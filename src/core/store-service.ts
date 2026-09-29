import {
  type BookmarkEntry,
  type BookmarksStore,
  createEmptyStore,
  deleteEntry as softDelete,
  gcDeleted,
  mergeStores,
  parseUtagsExport,
  toUtagsExport,
} from './data'
import type { Storage } from './storage'

export const DEFAULT_PINNED = ['block', 'sb', '大佬', '有趣']

/** 面板快捷点选里自动统计常用标签的个数 */
export const MOST_USED_LIMIT = 10

/**
 * 数据操作服务。DOM 与界面只通过这个类读写数据，
 * 不直接碰 storage，保证每次变更都落盘。
 */
export class StoreService {
  private store: BookmarksStore = createEmptyStore()

  constructor(private readonly storage: Storage) {}

  async init(): Promise<void> {
    this.store = await this.storage.load()
    gcDeleted(this.store)
    await this.storage.save(this.store)
  }

  /** 未删除的条目 */
  aliveEntries(): Array<[string, BookmarkEntry]> {
    return Object.entries(this.store.data).filter(
      ([, entry]) => entry.meta.deleted === undefined
    )
  }

  getEntry(key: string): BookmarkEntry | undefined {
    const entry = this.store.data[key]
    return entry && entry.meta.deleted === undefined ? entry : undefined
  }

  /** 置顶标签列表，默认 DEFAULT_PINNED */
  pinnedTags(): string[] {
    return this.store.meta.pinned ?? DEFAULT_PINNED
  }

  async setPinnedTags(tags: string[]): Promise<void> {
    this.store.meta.pinned = tags
    await this.storage.save(this.store)
  }

  /** 标签使用频次，按次数降序 */
  tagCounts(): Array<[string, number]> {
    const counts = new Map<string, number>()
    for (const [, entry] of this.aliveEntries()) {
      for (const tag of entry.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }

  /** 常用标签：使用频次前 N 个 */
  mostUsedTags(limit = MOST_USED_LIMIT): string[] {
    return this.tagCounts()
      .slice(0, limit)
      .map(([tag]) => tag)
  }

  /**
   * 设置某个用户的标签。空数组等于删除（软删除）。
   * 已软删除的条目重新写入时自动恢复。
   */
  async setTags(
    key: string,
    tags: string[],
    title?: string
  ): Promise<BookmarkEntry> {
    const now = Date.now()
    const cleaned = [...new Set(tags.map((t) => t.trim()).filter(Boolean))]
    let entry = this.store.data[key]
    if (!entry) {
      entry = { tags: [], meta: { created: now, updated: now } }
      this.store.data[key] = entry
    }
    if (cleaned.length === 0) {
      if (!entry.meta.deleted) {
        softDelete(this.store, key, now)
      }
    } else {
      entry.tags = cleaned
      entry.meta.updated = now
      delete entry.meta.deleted
      if (title && title.trim()) {
        entry.meta.title = title.trim()
      }
      this.store.meta.updated = now
    }
    await this.storage.save(this.store)
    return entry
  }

  async deleteEntry(key: string): Promise<void> {
    softDelete(this.store, key)
    await this.storage.save(this.store)
  }

  /** 导入外部数据（自动识别 V2Mark 与 UTags 格式），与本地合并。返回导入的条目数。 */
  async importJson(json: string): Promise<number> {
    const trimmed = json.trim()
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      throw new Error('不是有效的 JSON')
    }
    const obj = parsed as {
      meta?: { databaseVersion?: unknown }
      data?: unknown
    }
    let incoming: BookmarksStore
    if (obj?.meta && typeof obj.meta === 'object' && 'databaseVersion' in obj.meta) {
      incoming = parseUtagsExport(trimmed)
    } else if (obj?.data && obj?.meta) {
      incoming = parsed as BookmarksStore
    } else {
      throw new Error('无法识别的数据格式')
    }
    const imported = Object.keys(incoming.data).length
    this.store = mergeStores(this.store, incoming)
    gcDeleted(this.store)
    await this.storage.save(this.store)
    return imported
  }

  /** V2Mark 原生格式导出（含置顶配置） */
  exportJson(): string {
    return JSON.stringify(this.store)
  }

  /** UTags 兼容格式导出 */
  exportUtagsJson(): string {
    return toUtagsExport(this.store)
  }
}
