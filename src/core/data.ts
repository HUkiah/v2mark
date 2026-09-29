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
  /** 置顶标签（输入面板快捷点选的第一行），随数据一起同步 */
  pinned?: string[]
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

/** 软删除保留期：30 天后物理清理 */
export const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** UTags 用特殊标签 ._DELETED_ 标记删除，导入时转成软删除时间戳 */
const UTAGS_DELETED_TAG = '._DELETED_'

/**
 * 软删除一个条目。保留 tags 以便撤销，展示层按 meta.deleted 过滤。
 * 同步时软删除随 updated 时间戳一起合并，防止已删除条目在别的设备复活。
 */
export function deleteEntry(store: BookmarksStore, key: string, now = Date.now()): boolean {
  const entry = store.data[key]
  if (!entry || entry.meta.deleted) {
    return false
  }
  entry.meta.deleted = now
  entry.meta.updated = now
  store.meta.updated = now
  return true
}

/** 物理清理超过保留期的软删除条目 */
export function gcDeleted(store: BookmarksStore, now = Date.now()): number {
  let removed = 0
  for (const key of Object.keys(store.data)) {
    const deleted = store.data[key]?.meta.deleted
    if (deleted !== undefined && now - deleted > TOMBSTONE_TTL_MS) {
      delete store.data[key]
      removed++
    }
  }
  return removed
}

/**
 * 合并两个库：逐条目按 meta.updated 做 last-write-wins。
 * 软删除条目与普通条目同样参与比较，deleted 更新的条目胜出，
 * 已删除的记录不会在另一台设备复活。
 */
export function mergeStores(a: BookmarksStore, b: BookmarksStore): BookmarksStore {
  const merged = createEmptyStore()
  let updated = 0
  for (const key of new Set([...Object.keys(a.data), ...Object.keys(b.data)])) {
    const ea = a.data[key]
    const eb = b.data[key]
    const winner =
      !ea ? eb : !eb ? ea : ea.meta.updated >= eb.meta.updated ? ea : eb
    if (!winner) {
      continue
    }
    merged.data[key] = winner
    updated = Math.max(updated, winner.meta.updated)
  }
  merged.meta.updated = updated
  return merged
}

/**
 * 生成 UTags 可导入的导出 JSON。
 * UTags 的库结构是 { meta: { databaseVersion, extensionVersion, ... }, data: { url: { tags, meta } } }，
 * 软删除条目转成 UTags 的 ._DELETED_ 标签。
 */
export function toUtagsExport(store: BookmarksStore): string {
  const data: Record<string, { tags: string[]; meta: Record<string, unknown> }> = {}
  for (const [url, entry] of Object.entries(store.data)) {
    const tags = entry.meta.deleted
      ? [...entry.tags, UTAGS_DELETED_TAG]
      : [...entry.tags]
    data[url] = {
      tags,
      meta: {
        title: entry.meta.title,
        created: entry.meta.created,
        updated: entry.meta.updated,
      },
    }
  }
  return JSON.stringify({
    meta: {
      databaseVersion: 3,
      extensionVersion: 'v2mark',
      created: Math.min(
        ...Object.values(store.data).map((e) => e.meta.created).concat([Date.now()])
      ),
      updated: store.meta.updated,
    },
    data,
  })
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
      (t): t is string =>
        typeof t === 'string' && t.trim().length > 0 && t !== UTAGS_DELETED_TAG
    )
    const meta = entry.meta ?? {}
    const now = Date.now()
    const created = typeof meta.created === 'number' ? meta.created : now
    const entryUpdated = typeof meta.updated === 'number' ? meta.updated : now
    const isDeleted = entry.tags.includes(UTAGS_DELETED_TAG)
    store.data[url] = {
      tags,
      meta: {
        title: typeof meta.title === 'string' ? meta.title : undefined,
        created,
        updated: entryUpdated,
        ...(isDeleted ? { deleted: entryUpdated } : {}),
      },
    }
    updated = Math.max(updated, entryUpdated)
  }
  store.meta.updated = updated
  return store
}
