// @vitest-environment happy-dom
// 复刻 V2EX 页面结构的集成测试。用户名均为虚构。
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderPage } from './dom'
import { StoreService } from './store-service'
import { createGmStorage } from './storage'
import { memberKey } from '../sites/v2ex'

async function makeService(
  entries: Record<string, string[]>
): Promise<StoreService> {
  const map = new Map<string, unknown>()
  vi.stubGlobal('GM_setValue', (key: string, value: unknown) => {
    map.set(key, value)
  })
  vi.stubGlobal(
    'GM_getValue',
    <T>(key: string, defaultValue?: T): T =>
      (map.has(key) ? map.get(key) : defaultValue) as T
  )
  const store = {
    meta: { version: 1 as const, updated: 1 },
    data: {} as Record<
      string,
      { tags: string[]; meta: Record<string, number | string> }
    >,
  }
  for (const [name, tags] of Object.entries(entries)) {
    store.data[memberKey(name)] = {
      tags,
      meta: { created: 1, updated: 1, title: name },
    }
  }
  map.set('v2mark.store', JSON.stringify(store))
  const service = new StoreService(createGmStorage())
  await service.init()
  return service
}

/** 模仿 v2ex 帖子列表 + 回复的 DOM 结构 */
function setupListPage() {
  document.body.innerHTML = `
    <div class="site-nav"><a href="/member/navuser">导航里的用户</a></div>
    <div id="Main">
      <div class="box">
        <div class="cell" id="topic-1">
          <span class="item_title"><a class="topic-link" href="/t/999999">某个话题</a></span>
          <span class="topic_info">
            <strong><a href="/member/alice">alice</a></strong>
            <span class="node">node</span>
          </span>
        </div>
        <div class="cell" id="r_1">
          <div class="reply_content">回复内容</div>
          <div class="ago"><a href="#r_1">1 天前</a></div>
          <strong><a class="dark" href="/member/bob">bob</a></strong>
        </div>
        <div class="cell" id="r_2">
          <strong><a class="dark" href="/member/carol">carol</a></strong>
        </div>
        <div class="cell" id="r_3">
          <table>
            <tr>
              <td width="48">
                <a href="/member/dave"><img class="avatar" width="48" src="/avatar/dave.png" alt="dave"></a>
              </td>
              <td>
                <div class="reply_content">头像用户的回复</div>
                <div class="ago"><strong><a class="dark" href="/member/dave">dave</a></strong></div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>`
}

beforeEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('renderPage 帖子页渲染', () => {
  it('member 链接后渲染常驻标签，排除导航链接', async () => {
    const service = await makeService({ alice: ['大佬'], bob: ['block'] })
    setupListPage()
    renderPage(service, () => {})

    const aliceTags = document.querySelector<HTMLSpanElement>(
      'a[href*="/member/alice"] + .v2mark-tags'
    )
    expect(aliceTags?.querySelectorAll('.v2mark-tag')).toHaveLength(1)
    expect(aliceTags?.querySelector('.v2mark-tag')?.textContent).toBe('大佬')

    // bob 的链接是相对地址，也应被规范化匹配
    const bobTags = document.querySelector<HTMLSpanElement>(
      'a[href*="/member/bob"] + .v2mark-tags'
    )
    expect(bobTags?.dataset.v2markTags).toBe('block')

    // 无标签的 carol：容器存在但只有编辑图标
    const carolTags = document.querySelector<HTMLSpanElement>(
      'a[href*="/member/carol"] + .v2mark-tags'
    )
    expect(carolTags?.querySelectorAll('.v2mark-tag')).toHaveLength(0)
    expect(carolTags?.querySelector('.v2mark-captain')).toBeTruthy()

    // 头像链接（a > img）不渲染标签，同一行的用户名链接正常渲染
    const avatarLink = document.querySelector<HTMLAnchorElement>(
      '#r_3 td a[href*="/member/dave"]'
    )
    expect(
      avatarLink?.nextElementSibling?.classList.contains('v2mark-tags') ?? false
    ).toBe(false)
    const daveNameLink = document.querySelector<HTMLAnchorElement>(
      '#r_3 .ago a[href*="/member/dave"]'
    )
    expect(
      daveNameLink?.nextElementSibling?.classList.contains('v2mark-tags')
    ).toBe(true)

    // 导航里的 member 链接不渲染
    expect(
      document.querySelector('a[href*="/member/navuser"] + .v2mark-tags')
    ).toBeNull()
  })

  it('标签聚合到列表行，供特殊标签 CSS 生效', async () => {
    const service = await makeService({ alice: ['大佬'], bob: ['block'] })
    setupListPage()
    renderPage(service, () => {})

    const topicRow = document.getElementById('topic-1')
    expect(topicRow?.getAttribute('data-v2mark-list')).toBe(',大佬,')
    const replyRow = document.getElementById('r_1')
    expect(replyRow?.getAttribute('data-v2mark-list')).toBe(',block,')
    // carol 无标签，行上不设属性
    expect(document.getElementById('r_2')?.hasAttribute('data-v2mark-list')).toBe(
      false
    )
  })

  it('重复渲染幂等，不产生重复元素', async () => {
    const service = await makeService({ alice: ['大佬'] })
    setupListPage()
    renderPage(service, () => {})
    renderPage(service, () => {})
    const wrappers = document.querySelectorAll('.v2mark-tags')
    const aliceLinks = document.querySelectorAll('a[href*="/member/alice"]')
    // alice 链接只有 1 个，容器也只能有 1 个
    expect(aliceLinks).toHaveLength(1)
    expect(
      document.querySelectorAll('a[href*="/member/alice"] + .v2mark-tags')
    ).toHaveLength(1)
    // member 链接共 6 个：导航 1 个被排除，dave 的头像 1 个被排除，渲染 4 个
    expect(wrappers.length).toBe(
      document.querySelectorAll('a[href*="/member/"]').length - 2
    )
  })

  it('点击编辑图标触发 onEdit，带回正确的 key', async () => {
    const service = await makeService({ alice: ['大佬'] })
    setupListPage()
    const edits: Array<[string, string]> = []
    renderPage(service, (key, _anchor, name) => {
      edits.push([key, name])
    })
    const captain = document.querySelector<HTMLButtonElement>(
      'a[href*="/member/alice"] + .v2mark-tags .v2mark-captain'
    )
    captain?.click()
    expect(edits).toHaveLength(1)
    expect(edits[0]?.[1]).toBe('alice')
    expect(edits[0]?.[0]).toBe(memberKey('alice'))
  })

  it('悬停用户名进入 hover 态（JS 管理），移出后延迟恢复', async () => {
    vi.useFakeTimers()
    try {
      const service = await makeService({ alice: [] })
      setupListPage()
      const edits: string[] = []
      renderPage(service, (key) => {
        edits.push(key)
      })
      const link = document.querySelector<HTMLElement>(
        'a[href*="/member/alice"]'
      )
      const container = document.querySelector<HTMLElement>(
        'a[href*="/member/alice"] + .v2mark-tags'
      )
      expect(link).toBeTruthy()
      expect(container?.classList.contains('v2mark-hover')).toBe(false)

      link?.dispatchEvent(new MouseEvent('mouseenter'))
      expect(container?.classList.contains('v2mark-hover')).toBe(true)

      // hover 态下按钮可点击
      container?.querySelector<HTMLButtonElement>('.v2mark-captain')?.click()
      expect(edits).toHaveLength(1)

      // 移出后有 250ms 缓冲，期间再次进入会取消隐藏
      link?.dispatchEvent(new MouseEvent('mouseleave'))
      container?.dispatchEvent(new MouseEvent('mouseenter'))
      vi.advanceTimersByTime(300)
      expect(container?.classList.contains('v2mark-hover')).toBe(true)

      container?.dispatchEvent(new MouseEvent('mouseleave'))
      vi.advanceTimersByTime(300)
      expect(container?.classList.contains('v2mark-hover')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('renderPage 个人主页', () => {
  it('个人主页 h1 后渲染标签', async () => {
    window.location.href = 'https://www.v2ex.com/member/alice'
    const service = await makeService({ alice: ['大佬'] })
    document.body.innerHTML = `
      <div class="content"><h1>alice</h1></div>`
    renderPage(service, () => {})
    const wrapper = document.querySelector<HTMLElement>(
      '.content h1 + .v2mark-tags'
    )
    expect(wrapper?.querySelector('.v2mark-tag')?.textContent).toBe('大佬')
  })
})
