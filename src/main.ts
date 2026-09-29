import cssText from './styles/v2mark.css'
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

function main(): void {
  console.log(`[V2Mark] v${__VERSION__} 已加载`, location.host)

  // TODO(M1): 初始化存储（core/storage）
  // TODO(M1): 扫描 DOM 并挂载标签（core/dom + sites/v2ex 的选择器）
  // TODO(M1): 标签输入面板（core/ui）
  // TODO(M1): 特殊标签过滤效果（core/special-tags + styles）
}

if (V2EX_HOSTS.has(location.host)) {
  injectStyle(cssText)
  main()
}
