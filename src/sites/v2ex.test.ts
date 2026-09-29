import { describe, expect, it } from 'vitest'

import { memberKey, memberNameFromHref } from './v2ex'

// 测试里的用户名均为虚构。

describe('memberNameFromHref', () => {
  it.each([
    ['https://www.v2ex.com/member/alice', 'alice'],
    ['https://v2ex.com/member/bob', 'bob'],
    ['/member/carol', 'carol'],
    ['https://www.v2ex.com/member/Dave?tab=replies', 'Dave'],
    ['https://www.v2ex.com/member/Eve#reply1', 'Eve'],
  ])('%s -> %s', (href, expected) => {
    expect(memberNameFromHref(href)).toBe(expected)
  })

  it('非 member 链接返回 undefined', () => {
    expect(memberNameFromHref('https://www.v2ex.com/t/123')).toBeUndefined()
    expect(memberNameFromHref('https://www.v2ex.com/go/create')).toBeUndefined()
    expect(memberNameFromHref('')).toBeUndefined()
  })
})

describe('memberKey', () => {
  it('生成规范化的存储 key，大小写保留', () => {
    expect(memberKey('alice')).toBe('https://www.v2ex.com/member/alice')
    expect(memberKey('Carol')).toBe('https://www.v2ex.com/member/Carol')
  })
})
