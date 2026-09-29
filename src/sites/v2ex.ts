/**
 * V2EX 站点适配：URL 规范化与选择器。
 * 选择器参考了 UTags（MIT）的 V2EX 适配并做了删减，只保留用户链接相关。
 */

export const V2EX_HOSTS = new Set([
  'www.v2ex.com',
  'global.v2ex.com',
  'v2ex.com',
])

/**
 * 生成用户标签的存储 key。
 * member 名大小写敏感，原样保留（与 UTags 存量数据兼容）。
 */
export function memberKey(name: string): string {
  return `https://www.v2ex.com/member/${name}`
}

/**
 * 从 member 链接提取用户名，失败返回 undefined。
 * 入参传 element.href（绝对地址）；相对地址也能匹配，
 * 调用方已用 MEMBER_LINK_SELECTOR 限定在 v2ex 页面的 member 链接上。
 */
export function memberNameFromHref(href: string): string | undefined {
  const match = /\/member\/([^/?#]+)/.exec(href)
  return match?.[1]
}

/** 需要挂标签的链接 */
export const MEMBER_LINK_SELECTOR = 'a[href*="/member/"]'

/** 排除的链接：导航、分页、回复计数等 */
export const EXCLUDE_SELECTORS = [
  '.site-nav a',
  '.cell_tabs a',
  '.tab-alt-container a',
  '#SecondaryTabs a',
  'a.page_normal',
  'a.page_current',
  'a.count_livid',
  '.button',
]

/** 帖子列表行、回复行等容器，用于特殊标签的列表级效果 */
export const LIST_NODE_SELECTORS = ['.box .cell']
