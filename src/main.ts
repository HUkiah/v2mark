import cssText from './styles/v2mark.css'
import { observeMutations, renderPage } from './core/dom'
import { createGmStorage } from './core/storage'
import { StoreService } from './core/store-service'
import {
  isConfigured,
  loadSyncConfig,
  syncNow,
} from './core/sync'
import { openManager, openTagPanel } from './core/ui'
import { V2EX_HOSTS } from './sites/v2ex'

declare const __VERSION__: string

function injectStyle(css: string): void {
  if (typeof GM_addStyle === 'function') {
    GM_addStyle(css)
    return
  }
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
}

/** 变更后自动同步的等待窗口 */
const AUTO_SYNC_DEBOUNCE_MS = 3000

async function main(): Promise<void> {
  console.log(`[V2Mark] v${__VERSION__} 已加载`, location.host)

  const service = new StoreService(createGmStorage())
  await service.init()

  const renderAll = () => {
    renderPage(service, (key, anchor, name) => {
      openTagPanel(key, anchor, name, service, renderAll)
    })
  }

  // 同步：启动时拉取合并；本地变更后 debounce 推送。失败只记控制台，不打扰浏览
  const runSync = async () => {
    const config = loadSyncConfig()
    if (!isConfigured(config)) {
      return
    }
    try {
      await syncNow(service, config)
      renderAll()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('[V2Mark] 同步失败：', message)
    }
  }

  let syncTimer: number | undefined
  service.onPersist(() => {
    const config = loadSyncConfig()
    if (!config.autoSync) {
      return
    }
    window.clearTimeout(syncTimer)
    syncTimer = window.setTimeout(() => {
      void runSync()
    }, AUTO_SYNC_DEBOUNCE_MS)
  })

  renderAll()
  observeMutations(renderAll)
  void runSync()

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('🏷️ 标签管理面板', () => {
      openManager(service, renderAll)
    })
    GM_registerMenuCommand('📋 复制诊断信息', () => {
      const g = globalThis as Record<string, unknown>
      const probe = (name: string): string => {
        try {
          return typeof g[name]
        } catch {
          return 'throws'
        }
      }
      const info =
        typeof GM_info !== 'undefined' && GM_info
          ? {
              handler: GM_info.scriptHandler,
              managerVersion: GM_info.version,
              scriptVersion: GM_info.script?.version,
            }
          : null
      const gmObj = g.GM as Record<string, unknown> | undefined
      const diag = {
        time: new Date().toISOString(),
        ua: navigator.userAgent,
        manager: info,
        apis: {
          GM_setValue: probe('GM_setValue'),
          GM_getValue: probe('GM_getValue'),
          GM_registerMenuCommand: probe('GM_registerMenuCommand'),
          GM_xmlHttpRequest: probe('GM_xmlHttpRequest'),
          GM: probe('GM'),
          GM_info: probe('GM_info'),
          unsafeWindow: probe('unsafeWindow'),
        },
        gmMembers: gmObj
          ? Object.keys(gmObj).map(
              (k) => `${k}:${typeof gmObj[k]}`
            )
          : null,
        syncConfigured: isConfigured(loadSyncConfig()),
      }
      const text = JSON.stringify(diag)
      console.log('[V2Mark] 诊断信息：', text)
      void navigator.clipboard
        ?.writeText(text)
        .then(() => console.log('[V2Mark] 诊断信息已复制到剪贴板'))
        .catch(() => {
          window.prompt('复制下面的诊断信息：', text)
        })
    })
  }
}

if (V2EX_HOSTS.has(location.host)) {
  injectStyle(cssText)
  void main()
}
