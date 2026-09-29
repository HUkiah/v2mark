/**
 * 数据模型。与 UTags（小鱼标签）的 extension.utags.urlmap 结构保持兼容，
 * 用户可以从 UTags 直接导入导出。
 */

/** 单条标签记录的元信息 */
export interface BookmarkMeta {
  /** 用户名或页面标题，仅用于展示 */
  title?: string
  /** 首次打标签的时间，毫秒时间戳 */
  created: number
  /** 最近修改时间，毫秒时间戳。同步合并时以此做 last-write-wins */
  updated: number
  /** 软删除时间。同步时防止已删除的条目在别的设备复活，30 天后物理清理 */
  deleted?: number
}

/** 单条标签记录：key 是规范化的 member URL */
export interface BookmarkEntry {
  tags: string[]
  meta: BookmarkMeta
}

export interface StoreMeta {
  version: 1
  updated: number
}

export interface BookmarksStore {
  meta: StoreMeta
  data: Record<string, BookmarkEntry>
}

export function createEmptyStore(): BookmarksStore {
  return {
    meta: { version: 1, updated: 0 },
    data: {},
  }
}

/**
 * 解析 UTags 导出的 JSON。UTags 的结构是
 * { meta: { databaseVersion, extensionVersion, ... }, data: { url: { tags, meta } } }，
 * 字段比本项目多，多余字段忽略即可。
 * @throws 数据非法时抛出 Error
 */
export function parseUtagsExport(json: string): BookmarksStore {
  const parsed = JSON.parse(json) as {
    data?: Record<string, { tags?: unknown; meta?: Record<string, unknown> }>
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.data) {
    throw new Error('不是有效的 UTags 导出数据')
  }
  const store = createEmptyStore()
  let updated = 0
  for (const [url, entry] of Object.entries(parsed.data)) {
    if (!Array.isArray(entry?.tags)) {
      continue
    }
    const tags = entry.tags.filter(
      (t): t is string => typeof t === 'string' && t.trim().length > 0
    )
    const meta = entry.meta ?? {}
    const now = Date.now()
    const created = typeof meta.created === 'number' ? meta.created : now
    const entryUpdated = typeof meta.updated === 'number' ? meta.updated : now
    store.data[url] = {
      tags,
      meta: {
        title: typeof meta.title === 'string' ? meta.title : undefined,
        created,
        updated: entryUpdated,
      },
    }
    updated = Math.max(updated, entryUpdated)
  }
  store.meta.updated = updated
  return store
}
