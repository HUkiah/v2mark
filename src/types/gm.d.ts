// GM API 的最小类型声明。
// 注意：iOS 的 Stay、Userscripts 管理器提供的是异步（Promise 风格）GM API。
// M1 实现存储层（core/storage）时要做同步/异步适配，这里只声明桌面 Tampermonkey
// 与 Violentmonkey 的同步签名。
declare const GM_setValue: (key: string, value: unknown) => void
declare const GM_getValue: <T>(key: string, defaultValue?: T) => T
declare const GM_registerMenuCommand: (
  name: string,
  fn: () => void
) => number | string | void
declare const GM_addStyle: (css: string) => HTMLStyleElement | void

interface GMXmlHttpRequestDetails {
  method: string
  url: string
  headers?: Record<string, string>
  data?: string
  timeout?: number
  onload: (response: { status: number; responseText: string }) => void
  onerror: (error: unknown) => void
  ontimeout: () => void
}
declare const GM_xmlHttpRequest: (details: GMXmlHttpRequestDetails) => void

declare module '*.css' {
  const cssText: string
  export default cssText
}
