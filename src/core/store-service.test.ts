import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmptyStore, type BookmarksStore } from './data'
import { StoreService } from './store-service'
import { createGmStorage } from './storage'

// 测试里的用户名均为虚构。

function makeService(initial?: BookmarksStore) {
  const map = new Map<string, unknown>()
  vi.stubGlobal('GM_setValue', (key: string, value: unknown) => {
    map.set(key, value)
  })
  vi.stubGlobal(
    'GM_getValue',
    <T>(key: string, defaultValue?: T): T =>
      (map.has(key) ? map.get(key) : defaultValue) as T
  )
  const service = new StoreService(createGmStorage())
  if (initial) {
    map.set('v2mark.store', JSON.stringify(initial))
  }
  return service
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('StoreService', () => {
  it('init 读取已存数据', async () => {
    const store = createEmptyStore()
    store.data['https://www.v2ex.com/member/alice'] = {
      tags: ['大佬'],
      meta: { title: 'alice', created: 100, updated: 100 },
    }
    const service = makeService(store)
    await service.init()
    expect(service.getEntry('https://www.v2ex.com/member/alice')?.tags).toEqual([
      '大佬',
    ])
  })

  it('setTags 新建条目并去重、去空白', async () => {
    const service = makeService()
    await service.init()
    await service.setTags('https://www.v2ex.com/member/bob', [
      '大佬',
      ' 大佬 ',
      '',
      '有趣',
    ])
    const entry = service.getEntry('https://www.v2ex.com/member/bob')
    expect(entry?.tags).toEqual(['大佬', '有趣'])
  })

  it('setTags 空数组触发软删除，getEntry 返回 undefined，重写后恢复', async () => {
    const service = makeService()
    await service.init()
    const key = 'https://www.v2ex.com/member/carol'
    await service.setTags(key, ['大佬'])
    await service.setTags(key, [])
    expect(service.getEntry(key)).toBeUndefined()
    expect(service.aliveEntries()).toHaveLength(0)
    await service.setTags(key, ['回归'])
    expect(service.getEntry(key)?.tags).toEqual(['回归'])
  })

  it('tagCounts 按频次降序，mostUsedTags 截取前 N', async () => {
    const service = makeService()
    await service.init()
    await service.setTags('https://www.v2ex.com/member/alice', ['大佬', '有趣'])
    await service.setTags('https://www.v2ex.com/member/bob', ['大佬'])
    await service.setTags('https://www.v2ex.com/member/carol', ['大佬', '新人'])
    expect(service.tagCounts()[0]).toEqual(['大佬', 3])
    expect(service.mostUsedTags(2)).toEqual(['大佬', '有趣'])
  })

  it('importJson 识别 UTags 格式并合并', async () => {
    const service = makeService()
    await service.init()
    await service.setTags('https://www.v2ex.com/member/alice', ['本地标签'])
    const imported = await service.importJson(
      JSON.stringify({
        meta: { databaseVersion: 3, extensionVersion: '0.14.2' },
        data: {
          'https://www.v2ex.com/member/bob': {
            tags: ['外来标签'],
            meta: { created: 1, updated: 2 },
          },
        },
      })
    )
    expect(imported).toBe(1)
    expect(service.getEntry('https://www.v2ex.com/member/bob')?.tags).toEqual([
      '外来标签',
    ])
    expect(service.getEntry('https://www.v2ex.com/member/alice')?.tags).toEqual([
      '本地标签',
    ])
  })

  it('importJson 对无法识别的格式抛错', async () => {
    const service = makeService()
    await service.init()
    await expect(service.importJson('{"foo":1}')).rejects.toThrow(
      '无法识别的数据格式'
    )
    await expect(service.importJson('not json')).rejects.toThrow('JSON')
  })

  it('导出 V2Mark 与 UTags 格式可再次导入', async () => {
    const service = makeService()
    await service.init()
    await service.setTags('https://www.v2ex.com/member/alice', ['大佬'])
    for (const text of [service.exportJson(), service.exportUtagsJson()]) {
      const other = makeService()
      await other.init()
      await other.importJson(text)
      expect(other.getEntry('https://www.v2ex.com/member/alice')?.tags).toEqual([
        '大佬',
      ])
    }
  })
})
