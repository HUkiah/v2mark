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

  // 同步：启动时拉取合并；本地变更后 debounce 静默推送
  const runSync = async (silent: boolean) => {
    const config = loadSyncConfig()
    if (!isConfigured(config)) {
      return
    }
    try {
      await syncNow(service, config)
      renderAll()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!silent) {
        console.warn('[V2Mark] 同步失败：', message)
      }
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
      void runSync(true)
    }, AUTO_SYNC_DEBOUNCE_MS)
  })

  renderAll()
  observeMutations(renderAll)
  void runSync(true)

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('🏷️ 标签管理面板', () => {
      openManager(service, renderAll)
    })
  }
}

if (V2EX_HOSTS.has(location.host)) {
  injectStyle(cssText)
  void main()
}
