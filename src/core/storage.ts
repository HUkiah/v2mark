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

/** GM 存储实现（Tampermonkey、Violentmonkey 桌面版），GM API 缺失时降级 localStorage */
export function createGmStorage(): Storage {
  if (typeof GM_getValue === 'function' && typeof GM_setValue === 'function') {
    return {
      load() {
        const raw = GM_getValue<string | undefined>(STORAGE_KEY, undefined)
        if (!raw) {
          return Promise.resolve(createEmptyStore())
        }
        try {
          const parsed = JSON.parse(raw) as BookmarksStore
          if (parsed?.data && parsed?.meta) {
            return Promise.resolve(parsed)
          }
        } catch {
          // 数据损坏时回退到空库。TODO: 损坏数据另存一份以便手动恢复
        }
        return Promise.resolve(createEmptyStore())
      },
      save(store) {
        GM_setValue(STORAGE_KEY, JSON.stringify(store))
        return Promise.resolve()
      },
    }
  }

  // 降级：管理器未提供 GM API（或控制台直接注入调试）时用 localStorage
  return {
    load() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return Promise.resolve(createEmptyStore())
      }
      try {
        const parsed = JSON.parse(raw) as BookmarksStore
        if (parsed?.data && parsed?.meta) {
          return Promise.resolve(parsed)
        }
      } catch {
        // 忽略损坏数据，回退空库
      }
      return Promise.resolve(createEmptyStore())
    },
    save(store) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      return Promise.resolve()
    },
  }
}
