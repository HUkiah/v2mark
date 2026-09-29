import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmptyStore } from './data'
import { createGmStorage } from './storage'
import { StoreService } from './store-service'
import {
  type DavResponse,
  type WebDavConfig,
  EMPTY_CONFIG,
  isConfigured,
  loadSyncConfig,
  syncNow,
} from './sync'

// 用户名与地址均为虚构。

interface CapturedRequest {
  method: string
  url: string
  headers: Record<string, string>
  data?: string
}

function makeConfig(overrides: Partial<WebDavConfig> = {}): WebDavConfig {
  return {
    ...EMPTY_CONFIG,
    url: 'https://dav.example.com/dav',
    path: 'v2mark/bookmarks.json',
    username: 'user@example.com',
    password: 'app-password',
    ...overrides,
  }
}

async function makeService(localTags: Record<string, string[]>) {
  const store = createEmptyStore()
  for (const [name, tags] of Object.entries(localTags)) {
    store.data[`https://www.v2ex.com/member/${name}`] = {
      tags,
      meta: { created: 1, updated: 1, title: name },
    }
  }
  const map = new Map<string, unknown>([['v2mark.store', JSON.stringify(store)]])
  vi.stubGlobal('GM_setValue', (key: string, value: unknown) => {
    map.set(key, value)
  })
  vi.stubGlobal(
    'GM_getValue',
    <T>(key: string, defaultValue?: T): T =>
      (map.has(key) ? map.get(key) : defaultValue) as T
  )
  const service = new StoreService(createGmStorage())
  await service.init()
  return { service, map }
}

/** 按序响应的 GM_xmlHttpRequest mock；未匹配时 GET 404、PUT 201 */
function stubDav(
  handlers: Array<(req: CapturedRequest) => DavResponse>
): CapturedRequest[] {
  const requests: CapturedRequest[] = []
  vi.stubGlobal('GM_xmlHttpRequest', (details: {
    method: string
    url: string
    headers?: Record<string, string>
    data?: string
    onload: (r: { status: number; responseText: string }) => void
    onerror: (e: unknown) => void
    ontimeout: () => void
  }) => {
    const req: CapturedRequest = {
      method: details.method,
      url: details.url,
      headers: details.headers ?? {},
      data: details.data,
    }
    requests.push(req)
    const handler = handlers[requests.length - 1] ?? ((r) =>
      r.method === 'GET' ? { status: 404, text: '' } : { status: 201, text: '' }
    )
    const response = handler(req)
    setTimeout(() => details.onload({ status: response.status, responseText: response.text }), 0)
  })
  return requests
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('isConfigured', () => {
  it('地址、路径、账号、密码齐全才算已配置', () => {
    expect(isConfigured(makeConfig())).toBe(true)
    expect(isConfigured(makeConfig({ password: '' }))).toBe(false)
    expect(isConfigured(makeConfig({ url: 'ftp://x' }))).toBe(false)
  })
})

describe('syncNow', () => {
  it('拉取远端并合并，推送合并结果，带基本认证', async () => {
    const { service, map } = await makeService({ alice: ['本地'] })
    const remote = createEmptyStore()
    remote.data['https://www.v2ex.com/member/bob'] = {
      tags: ['远端'],
      meta: { created: 1, updated: 2, title: 'bob' },
    }
    const requests = stubDav([
      () => ({ status: 200, text: JSON.stringify(remote) }),
      (req) => {
        expect(req.method).toBe('PUT')
        return { status: 201, text: '' }
      },
    ])

    const result = await syncNow(service, makeConfig())

    expect(result.remoteCount).toBe(1)
    expect(result.localCount).toBe(2)
    expect(requests[0]?.method).toBe('GET')
    expect(requests[0]?.url).toBe(
      'https://dav.example.com/dav/v2mark/bookmarks.json'
    )
    expect(requests[0]?.headers.Authorization).toBe(
      `Basic ${btoa('user@example.com:app-password')}`
    )
    // 推送的是合并后的完整数据
    const pushed = JSON.parse(requests[1]?.data ?? '{}')
    expect(Object.keys(pushed.data)).toHaveLength(2)
    // 同步时间已记录
    expect(loadSyncConfig().lastSyncAt).toBeGreaterThan(0)
    // 合并结果落盘
    expect(map.has('v2mark.store')).toBe(true)
  })

  it('远端 404 时直接推送本地全量', async () => {
    const { service } = await makeService({ alice: ['大佬'] })
    const requests = stubDav([
      () => ({ status: 404, text: '' }),
      () => ({ status: 201, text: '' }),
    ])
    const result = await syncNow(service, makeConfig())
    expect(result.remoteCount).toBe(0)
    const pushed = JSON.parse(requests[1]?.data ?? '{}')
    expect(pushed.data['https://www.v2ex.com/member/alice']).toBeTruthy()
  })

  it('远端数据损坏时报错', async () => {
    const { service } = await makeService({})
    stubDav([() => ({ status: 200, text: '{broken' })])
    await expect(syncNow(service, makeConfig())).rejects.toThrow('解析失败')
  })

  it('远端 500 报错', async () => {
    const { service } = await makeService({})
    stubDav([() => ({ status: 500, text: '' })])
    await expect(syncNow(service, makeConfig())).rejects.toThrow('500')
  })

  it('PUT 返回 409 时逐级建目录后重试', async () => {
    const { service } = await makeService({ alice: ['大佬'] })
    const requests = stubDav([
      () => ({ status: 404, text: '' }),
      () => ({ status: 409, text: '' }),
      () => ({ status: 201, text: '' }),
      () => ({ status: 201, text: '' }),
    ])
    await syncNow(service, makeConfig())
    expect(requests.map((r) => r.method)).toEqual(['GET', 'PUT', 'MKCOL', 'PUT'])
    expect(requests[2]?.url).toBe('https://dav.example.com/dav/v2mark')
  })
})
