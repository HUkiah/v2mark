import cssText from './styles/v2mark.css'
import { observeMutations, renderPage } from './core/dom'
import { createGmStorage } from './core/storage'
import { StoreService } from './core/store-service'
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

async function main(): Promise<void> {
  console.log(`[V2Mark] v${__VERSION__} 已加载`, location.host)

  const service = new StoreService(createGmStorage())
  await service.init()

  const renderAll = () => {
    renderPage(service, (key, anchor, name) => {
      openTagPanel(key, anchor, name, service, renderAll)
    })
  }

  renderAll()
  observeMutations(renderAll)

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
