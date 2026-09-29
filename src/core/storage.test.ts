import { afterEach, describe, expect, it, vi } from 'vitest'

import { createEmptyStore } from './data'
import { createGmStorage } from './storage'

// 用内存 Map 模拟 GM_setValue / GM_getValue。
// 模拟 GM 存储按原值存取（不额外序列化），损坏数据直接写入原始字符串。
function stubGmStorage() {
  const map = new Map<string, unknown>()
  vi.stubGlobal('GM_setValue', (key: string, value: unknown) => {
    map.set(key, value)
  })
  vi.stubGlobal(
    'GM_getValue',
    <T>(key: string, defaultValue?: T): T => {
      return (map.has(key) ? map.get(key) : defaultValue) as T
    }
  )
  return map
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createGmStorage', () => {
  it('空库返回空 store', async () => {
    stubGmStorage()
    const storage = createGmStorage()
    const store = await storage.load()
    expect(store.data).toEqual({})
    expect(store.meta.version).toBe(1)
  })

  it('save 后 load 还原同一份数据', async () => {
    stubGmStorage()
    const storage = createGmStorage()
    const store = createEmptyStore()
    store.data['https://www.v2ex.com/member/alice'] = {
      tags: ['大佬'],
      meta: { title: 'alice', created: 100, updated: 200 },
    }
    store.meta.updated = 200
    await storage.save(store)

    const loaded = await storage.load()
    expect(loaded.data['https://www.v2ex.com/member/alice']?.tags).toEqual(['大佬'])
    expect(loaded.meta.updated).toBe(200)
  })

  it('损坏的 JSON 回退为空库', async () => {
    const map = stubGmStorage()
    map.set('v2mark.store', '{broken json')
    const storage = createGmStorage()
    const store = await storage.load()
    expect(store.data).toEqual({})
  })
})
