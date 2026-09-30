import type { StoreService } from './store-service'
import {
  EXCLUDE_SELECTORS,
  LIST_NODE_SELECTORS,
  MEMBER_LINK_SELECTOR,
  memberKey,
  memberNameFromHref,
} from '../sites/v2ex'

const TAGS_CLASS = 'v2mark-tags'
const LIST_ATTR = 'data-v2mark-list'

/** 排除导航、分页等不该挂标签的链接 */
export function isExcluded(element: Element): boolean {
  return EXCLUDE_SELECTORS.some((selector) => element.closest(selector))
}

/**
 * 扫描当前页面所有 member 链接（含个人主页标题），渲染常驻标签与悬停编辑图标。
 */
export function renderPage(service: StoreService, onEdit: EditHandler): void {
  renderMemberLinks(service, onEdit)
  renderProfileTitle(service, onEdit)
  updateListEffects(document)
}

export type EditHandler = (key: string, anchor: HTMLElement, name: string) => void

function renderMemberLinks(service: StoreService, onEdit: EditHandler): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    MEMBER_LINK_SELECTOR
  )
  for (const link of links) {
    if (isExcluded(link)) {
      continue
    }
    const name = memberNameFromHref(link.href)
    if (!name) {
      continue
    }
    const key = memberKey(name)
    renderTagsAfter(link, key, name, service, onEdit)
  }
}

/** 个人主页：.content h1 是用户名 */
function renderProfileTitle(service: StoreService, onEdit: EditHandler): void {
  if (!location.pathname.includes('/member/')) {
    return
  }
  const h1 = document.querySelector<HTMLElement>('.content h1')
  const name = h1?.textContent?.trim()
  if (!h1 || !name) {
    return
  }
  const key = memberKey(name)
  renderTagsAfter(h1, key, name, service, onEdit)
}

const HOVER_CLASS = 'v2mark-hover'

/**
 * 悬停状态由 JS 管理（mouseenter 加 class，mouseleave 延迟移除），
 * 不依赖 CSS 相邻兄弟选择器：零宽容器 + margin 死区会让纯 CSS 方案
 * 出现"按钮闪现但点不到"的问题，插入第三方元素也会断掉选择器链。
 */
function bindHoverReveal(target: HTMLElement, container: HTMLElement): void {
  let hideTimer: number | undefined
  const show = () => {
    window.clearTimeout(hideTimer)
    container.classList.add(HOVER_CLASS)
  }
  const scheduleHide = () => {
    window.clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => {
      container.classList.remove(HOVER_CLASS)
    }, 250)
  }
  target.addEventListener('mouseenter', show)
  target.addEventListener('mouseleave', scheduleHide)
  container.addEventListener('mouseenter', show)
  container.addEventListener('mouseleave', scheduleHide)
}

/**
 * 在目标元素后面渲染标签容器。重复调用是幂等的：先移除旧容器再插入新的。
 * 容器带 data-v2mark-key 与 data-v2mark-tags（逗号分隔），
 * 后者供列表级特殊标签效果聚合使用。
 */
function renderTagsAfter(
  target: HTMLElement,
  key: string,
  name: string,
  service: StoreService,
  onEdit: EditHandler
): void {
  const existing = target.nextElementSibling
  if (existing?.classList.contains(TAGS_CLASS)) {
    existing.remove()
  }

  const container = document.createElement('span')
  container.className = TAGS_CLASS
  container.dataset.v2markKey = key

  const entry = service.getEntry(key)
  const tags = entry?.tags ?? []

  const captain = document.createElement('button')
  captain.type = 'button'
  captain.className = 'v2mark-captain'
  captain.title = '编辑标签'
  captain.textContent = '🏷️'
  captain.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    onEdit(key, target, name)
  })
  container.append(captain)

  for (const tag of tags) {
    const chip = document.createElement('span')
    chip.className = 'v2mark-tag'
    chip.textContent = tag
    container.append(chip)
  }

  container.dataset.v2markTags = tags.join(',')
  bindHoverReveal(target, container)
  target.after(container)
}

/**
 * 把列表行内所有标签聚合到行容器上（data-v2mark-list=",tag1,tag2,"），
 * 特殊标签的半透明、隐藏效果由 CSS 属性选择器生效。
 */
export function updateListEffects(root: Document | HTMLElement): void {
  const lists = root.querySelectorAll(LIST_NODE_SELECTORS.join(','))
  for (const list of lists) {
    const tags = new Set<string>()
    for (const tagged of list.querySelectorAll<HTMLElement>(
      `.${TAGS_CLASS}[data-v2mark-tags]`
    )) {
      // 只聚合直属的标签，嵌套列表行由它自己的容器负责
      if (tagged.closest(`[${LIST_ATTR}]`) === list) {
        continue
      }
      for (const tag of tagged.dataset.v2markTags?.split(',') ?? []) {
        if (tag) {
          tags.add(tag)
        }
      }
    }
    if (tags.size > 0) {
      list.setAttribute(LIST_ATTR, `,${[...tags].join(',')},`)
    } else {
      list.removeAttribute(LIST_ATTR)
    }
  }
}

/**
 * 监听动态插入的内容（第三方增强脚本注入的回复等），
 * 有变化时节流触发重渲染。
 */
export function observeMutations(onChange: () => void): void {
  let timer: number | undefined
  const schedule = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(onChange, 500)
  }
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some(
      (m) =>
        m.type === 'childList' &&
        Array.from(m.addedNodes).some(
          (n) => n instanceof HTMLElement && n.querySelector?.(MEMBER_LINK_SELECTOR)
        )
    )
    if (relevant) {
      schedule()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
