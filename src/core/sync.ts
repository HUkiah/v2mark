import type { BookmarksStore } from './data'
import { readSetting, writeSetting } from './storage'
import type { StoreService } from './store-service'

export const SYNC_CONFIG_KEY = 'v2mark.sync'

export interface WebDavConfig {
  /** WebDAV 服务地址，如 https://dav.jianguoyun.com/dav */
  url: string
  /** 数据文件路径，如 v2mark/bookmarks.json */
  path: string
  username: string
  /** 坚果云等用应用专用密码 */
  password: string
  /** 本地变更后自动同步（debounce 数秒） */
  autoSync: boolean
  lastSyncAt: number
}

export const EMPTY_CONFIG: WebDavConfig = {
  url: '',
  path: 'v2mark/bookmarks.json',
  username: '',
  password: '',
  autoSync: true,
  lastSyncAt: 0,
}

export function loadSyncConfig(): WebDavConfig {
  return { ...EMPTY_CONFIG, ...readSetting(SYNC_CONFIG_KEY, {}) }
}

export function saveSyncConfig(config: WebDavConfig): void {
  writeSetting(SYNC_CONFIG_KEY, config)
}

export function isConfigured(config: WebDavConfig): boolean {
  return Boolean(
    config.url &&
      config.path &&
      config.username &&
      config.password &&
      /^https?:\/\//.test(config.url)
  )
}

export interface DavResponse {
  status: number
  text: string
}

/**
 * 解析当前管理器的跨域请求函数。
 * Tampermonkey、Violentmonkey 桌面版提供老式 GM_xmlHttpRequest；
 * Stay、Userscripts（iOS/macOS）等只提供新式 GM.xmlHttpRequest。
 */
type XhrFn = (details: {
  method: string
  url: string
  headers?: Record<string, string>
  data?: string
  timeout?: number
  onload: (response: { status: number; responseText: string }) => void
  onerror: (error: unknown) => void
  ontimeout: () => void
}) => void

function resolveXhr(): XhrFn | undefined {
  const g = globalThis as Record<string, unknown>
  if (typeof GM_xmlHttpRequest === 'function') {
    return GM_xmlHttpRequest
  }
  if (typeof g.GM_xmlHttpRequest === 'function') {
    return g.GM_xmlHttpRequest as XhrFn
  }
  if (typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function') {
    return GM.xmlHttpRequest
  }
  const gmObj = g.GM as { xmlHttpRequest?: unknown } | undefined
  if (gmObj && typeof gmObj.xmlHttpRequest === 'function') {
    return gmObj.xmlHttpRequest as XhrFn
  }
  return undefined
}

/** 发起一次 WebDAV 请求（跨域授权由 @connect 与用户确认承担） */
export function davRequest(
  method: string,
  url: string,
  config: WebDavConfig,
  data?: string
): Promise<DavResponse> {
  return new Promise((resolve, reject) => {
    const xhr = resolveXhr()
    if (!xhr) {
      const handler =
        typeof GM_info !== 'undefined' && GM_info?.scriptHandler
          ? `${GM_info.scriptHandler} ${GM_info.version ?? ''}`
          : '未知管理器'
      reject(
        new Error(
          `当前脚本管理器未提供跨域请求接口（${handler}，详见菜单「复制诊断信息」）`
        )
      )
      return
    }
    xhr({
      method,
      url,
      headers: {
        Authorization: `Basic ${btoa(
          `${config.username}:${config.password}`
        )}`,
        ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      data,
      timeout: 15_000,
      onload: (response) => {
        resolve({ status: response.status, text: response.responseText })
      },
      onerror: () => {
        reject(new Error(`网络错误：${method} ${url}`))
      },
      ontimeout: () => {
        reject(new Error(`请求超时：${method} ${url}`))
      },
    })
  })
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

/** PUT 到不存在的目录会返回 409，逐级 MKCOL 后重试 */
async function ensureParentDirs(
  config: WebDavConfig
): Promise<void> {
  const segments = config.path.replace(/^\/+/, '').split('/').slice(0, -1)
  let current = config.url.replace(/\/+$/, '')
  for (const segment of segments) {
    current += `/${segment}`
    try {
      await davRequest('MKCOL', current, config)
    } catch {
      // 目录已存在（405）或其他非致命状态，继续尝试下一级
    }
  }
}

function isValidStore(value: unknown): value is BookmarksStore {
  const obj = value as BookmarksStore
  return Boolean(obj?.meta && obj?.data && typeof obj.data === 'object')
}

export interface SyncResult {
  /** 远端拉到的条目数（含软删除） */
  remoteCount: number
  /** 合并后本地有效条目数 */
  localCount: number
}

/**
 * 完整同步：拉取远端 → 条目级合并 → 推送合并结果。
 * 冲突由 mergeStores 的 last-write-wins 与软删除语义解决，无整文件冲突。
 */
export async function syncNow(
  service: StoreService,
  config: WebDavConfig
): Promise<SyncResult> {
  const fullUrl = joinUrl(config.url, config.path)

  const get = await davRequest('GET', fullUrl, config)
  let remote: BookmarksStore | undefined
  if (get.status === 200) {
    try {
      const parsed = JSON.parse(get.text) as unknown
      if (isValidStore(parsed)) {
        remote = parsed
      } else {
        throw new Error('远端文件不是有效的 V2Mark 数据')
      }
    } catch (error) {
      throw new Error(
        `远端数据解析失败：${error instanceof Error ? error.message : error}`
      )
    }
  } else if (get.status !== 404 && get.status !== 409) {
    // 404：文件不存在。409：父目录不存在——坚果云对这种情况返回 409
    // 而非标准 WebDAV 的 404。两种都视为远端尚无数据，继续推送。
    throw new Error(`远端返回 HTTP ${get.status}`)
  }

  const localCount = service.mergeFrom(remote)
  const remoteCount = remote ? Object.keys(remote.data).length : 0

  let put = await davRequest('PUT', fullUrl, config, service.exportJson())
  if (put.status === 409) {
    await ensureParentDirs(config)
    put = await davRequest('PUT', fullUrl, config, service.exportJson())
  }
  if (put.status < 200 || put.status >= 300) {
    throw new Error(`推送失败，HTTP ${put.status}`)
  }

  const done: WebDavConfig = { ...config, lastSyncAt: Date.now() }
  saveSyncConfig(done)
  return { remoteCount, localCount }
}
