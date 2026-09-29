import {
  type BookmarksStore,
  createEmptyStore,
} from './data'

/**
 * 本地存储。M1 只做本地读写，同步后端（WebDAV、Gist）在 M2 接到同一个接口后面。
 *
 * TODO(M1): 实现时注意 iOS 管理器（Stay、Userscripts）的 GM API 是异步风格，
 * 需要在这一层做同步/异步适配，上层代码统一走 async 接口。
 */
export interface Storage {
  load(): Promise<BookmarksStore>
  save(store: BookmarksStore): Promise<void>
}

const STORAGE_KEY = 'v2mark.store'

/** GM 存储实现（Tampermonkey、Violentmonkey 桌面版） */
export function createGmStorage(): Storage {
  return {
    load() {
      const raw = GM_getValue<string | undefined>(STORAGE_KEY, undefined)
      if (!raw) {
        return Promise.resolve(createEmptyStore())
      }
      try {
        const parsed = JSON.parse(raw) as BookmarksStore
        // TODO(M1): 字段级校验与损坏数据的兜底
        if (parsed?.data && parsed?.meta) {
          return Promise.resolve(parsed)
        }
      } catch {
        // 数据损坏时回退到空库。TODO(M1): 损坏数据另存一份以便手动恢复
      }
      return Promise.resolve(createEmptyStore())
    },
    save(store) {
      GM_setValue(STORAGE_KEY, JSON.stringify(store))
      return Promise.resolve()
    },
  }
}
