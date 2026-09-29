import { describe, expect, it } from 'vitest'

import {
  type BookmarksStore,
  createEmptyStore,
  deleteEntry,
  gcDeleted,
  mergeStores,
  parseUtagsExport,
  toUtagsExport,
  TOMBSTONE_TTL_MS,
} from './data'

// 以下测试数据全部为虚构，不含任何真实用户信息。

function makeStore(
  entries: Record<string, { tags: string[]; updated: number; deleted?: number }>
): BookmarksStore {
  const store = createEmptyStore()
  for (const [url, e] of Object.entries(entries)) {
    store.data[url] = {
      tags: e.tags,
      meta: { created: e.updated, updated: e.updated, deleted: e.deleted },
    }
  }
  return store
}

describe('parseUtagsExport', () => {
  it('解析合法的 UTags 导出，保留标签与时间戳', () => {
    const json = JSON.stringify({
      meta: { databaseVersion: 3, extensionVersion: '0.14.2', created: 1, updated: 2 },
      data: {
        'https://www.v2ex.com/member/alice': {
          tags: ['大佬', 'block'],
          meta: { title: 'alice', created: 100, updated: 200 },
        },
        'https://www.v2ex.com/member/bob': {
          tags: ['有趣'],
          meta: { created: 300, updated: 301 },
        },
      },
    })
    const store = parseUtagsExport(json)
    expect(Object.keys(store.data)).toHaveLength(2)
    expect(store.data['https://www.v2ex.com/member/alice']?.tags).toEqual([
      '大佬',
      'block',
    ])
    expect(store.data['https://www.v2ex.com/member/alice']?.meta.updated).toBe(200)
    expect(store.meta.updated).toBe(301)
  })

  it('把 UTags 的 ._DELETED_ 标签转换成软删除时间戳', () => {
    const json = JSON.stringify({
      data: {
        'https://www.v2ex.com/member/carol': {
          tags: ['无聊', '._DELETED_'],
          meta: { created: 100, updated: 500 },
        },
      },
    })
    const store = parseUtagsExport(json)
    const entry = store.data['https://www.v2ex.com/member/carol']
    expect(entry?.tags).toEqual(['无聊'])
    expect(entry?.meta.deleted).toBe(500)
  })

  it('跳过 tags 不是数组的损坏条目', () => {
    const json = JSON.stringify({
      data: {
        'https://www.v2ex.com/member/dave': { tags: 'not-array', meta: {} },
      },
    })
    const store = parseUtagsExport(json)
    expect(store.data['https://www.v2ex.com/member/dave']).toBeUndefined()
  })

  it('缺少 data 字段时抛错', () => {
    expect(() => parseUtagsExport('{"meta":{}}')).toThrow()
    expect(() => parseUtagsExport('not json')).toThrow()
  })
})

describe('toUtagsExport 与 parseUtagsExport 互通', () => {
  it('软删除条目导出为 ._DELETED_，再导入还原为软删除', () => {
    const store = makeStore({
      'https://www.v2ex.com/member/alice': { tags: ['大佬'], updated: 200 },
      'https://www.v2ex.com/member/bob': { tags: [], updated: 300, deleted: 300 },
    })
    const exported = toUtagsExport(store)
    const parsed = JSON.parse(exported)
    expect(parsed.data['https://www.v2ex.com/member/bob'].tags).toContain(
      '._DELETED_'
    )
    const roundTrip = parseUtagsExport(exported)
    expect(roundTrip.data['https://www.v2ex.com/member/alice']?.tags).toEqual([
      '大佬',
    ])
    expect(roundTrip.data['https://www.v2ex.com/member/bob']?.meta.deleted).toBe(
      300
    )
  })
})

describe('软删除与合并', () => {
  it('deleteEntry 记录删除时间戳，重复删除返回 false', () => {
    const store = makeStore({
      'https://www.v2ex.com/member/alice': { tags: ['大佬'], updated: 100 },
    })
    expect(deleteEntry(store, 'https://www.v2ex.com/member/alice', 500)).toBe(true)
    expect(store.data['https://www.v2ex.com/member/alice']?.meta.deleted).toBe(500)
    expect(deleteEntry(store, 'https://www.v2ex.com/member/alice', 600)).toBe(false)
  })

  it('合并时按条目 updated 新者胜出', () => {
    const a = makeStore({
      'https://www.v2ex.com/member/alice': { tags: ['旧标签'], updated: 100 },
      'https://www.v2ex.com/member/bob': { tags: ['bob 的'], updated: 900 },
    })
    const b = makeStore({
      'https://www.v2ex.com/member/alice': { tags: ['新标签'], updated: 200 },
      'https://www.v2ex.com/member/carol': { tags: ['carol 的'], updated: 300 },
    })
    const merged = mergeStores(a, b)
    expect(merged.data['https://www.v2ex.com/member/alice']?.tags).toEqual(['新标签'])
    expect(merged.data['https://www.v2ex.com/member/bob']?.tags).toEqual(['bob 的'])
    expect(merged.data['https://www.v2ex.com/member/carol']?.tags).toEqual(['carol 的'])
  })

  it('更新的软删除胜出，已删条目不在另一台设备复活', () => {
    const alive = makeStore({
      'https://www.v2ex.com/member/alice': { tags: ['大佬'], updated: 500 },
    })
    const deleted = makeStore({
      'https://www.v2ex.com/member/alice': { tags: ['大佬'], updated: 800, deleted: 800 },
    })
    expect(mergeStores(alive, deleted).data['https://www.v2ex.com/member/alice']?.meta.deleted).toBe(800)
    // 反向同样成立
    expect(mergeStores(deleted, alive).data['https://www.v2ex.com/member/alice']?.meta.deleted).toBe(800)
  })

  it('gcDeleted 只清理超过保留期的条目', () => {
    const now = 1_000_000_000
    const store = makeStore({
      'https://www.v2ex.com/member/old': {
        tags: [],
        updated: now - TOMBSTONE_TTL_MS - 1,
        deleted: now - TOMBSTONE_TTL_MS - 1,
      },
      'https://www.v2ex.com/member/recent': {
        tags: [],
        updated: now - 1000,
        deleted: now - 1000,
      },
      'https://www.v2ex.com/member/alive': { tags: ['在'], updated: now },
    })
    const removed = gcDeleted(store, now)
    expect(removed).toBe(1)
    expect(store.data['https://www.v2ex.com/member/old']).toBeUndefined()
    expect(store.data['https://www.v2ex.com/member/recent']).toBeDefined()
    expect(store.data['https://www.v2ex.com/member/alive']).toBeDefined()
  })
})
