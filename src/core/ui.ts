import type { StoreService } from './store-service'
import {
  type WebDavConfig,
  isConfigured,
  loadSyncConfig,
  saveSyncConfig,
  syncNow,
} from './sync'

let activePanel: HTMLElement | undefined

/**
 * 打开标签编辑面板，锚定在触发元素附近。
 * 同一时间只存在一个面板；点击外部、按 Esc 或保存后关闭。
 */
export function openTagPanel(
  key: string,
  anchor: HTMLElement,
  name: string,
  service: StoreService,
  onSaved: () => void
): void {
  closePanel()

  const entry = service.getEntry(key)
  const current = new Set(entry?.tags ?? [])
  const pinned = service.pinnedTags()
  const mostUsed = service.mostUsedTags().filter((t) => !pinned.includes(t))

  const panel = document.createElement('div')
  panel.className = 'v2mark-panel'

  const title = document.createElement('div')
  title.className = 'v2mark-panel-title'
  title.textContent = name

  const chips = document.createElement('div')
  chips.className = 'v2mark-panel-chips'

  const renderChips = () => {
    chips.replaceChildren()
    if (current.size === 0) {
      chips.dataset.empty = '1'
      return
    }
    for (const tag of current) {
      const chip = document.createElement('span')
      chip.className = 'v2mark-tag v2mark-tag-removable'
      chip.textContent = tag
      const x = document.createElement('button')
      x.className = 'v2mark-tag-x'
      x.textContent = '×'
      x.title = '移除'
      x.addEventListener('click', () => {
        current.delete(tag)
        renderChips()
      })
      chip.append(x)
      chips.append(chip)
    }
  }

  const input = document.createElement('input')
  input.className = 'v2mark-panel-input'
  input.type = 'text'
  input.placeholder = '输入标签，逗号分隔，回车确认'
  const commitInput = () => {
    for (const tag of input.value.split(/[,，]/)) {
      const t = tag.trim()
      if (t) {
        current.add(t)
      }
    }
    input.value = ''
    renderChips()
  }
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitInput()
    }
    if (event.key === 'Escape') {
      closePanel()
    }
  })
  input.addEventListener('blur', commitInput)

  const quickRow = (label: string, tags: string[]) => {
    if (tags.length === 0) {
      return undefined
    }
    const row = document.createElement('div')
    row.className = 'v2mark-panel-quick'
    const name2 = document.createElement('span')
    name2.className = 'v2mark-panel-quick-name'
    name2.textContent = label
    row.append(name2)
    for (const tag of tags) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'v2mark-tag v2mark-quick-tag'
      b.textContent = tag
      b.addEventListener('click', () => {
        if (current.has(tag)) {
          current.delete(tag)
        } else {
          current.add(tag)
        }
        renderChips()
      })
      row.append(b)
    }
    return row
  }

  const actions = document.createElement('div')
  actions.className = 'v2mark-panel-actions'
  const save = document.createElement('button')
  save.type = 'button'
  save.className = 'v2mark-btn v2mark-btn-primary'
  save.textContent = '保存'
  save.addEventListener('click', async () => {
    await service.setTags(key, [...current], name)
    closePanel()
    onSaved()
  })
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = 'v2mark-btn'
  cancel.textContent = '取消'
  cancel.addEventListener('click', closePanel)
  actions.append(save, cancel)

  const pinnedRow = quickRow('置顶', pinned)
  const usedRow = quickRow('常用', mostUsed)
  panel.append(
    title,
    chips,
    input,
    ...(pinnedRow ? [pinnedRow] : []),
    ...(usedRow ? [usedRow] : []),
    actions
  )
  document.body.append(panel)

  const rect = anchor.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const top = rect.bottom + window.scrollY + 6
  const left = Math.min(
    Math.max(rect.left + window.scrollX, 8),
    window.scrollX + window.innerWidth - panelRect.width - 8
  )
  panel.style.top = `${top}px`
  panel.style.left = `${left}px`

  activePanel = panel
  input.focus()

  const onDown = (event: MouseEvent) => {
    if (!panel.contains(event.target as Node)) {
      closePanel()
    }
  }
  const onScroll = () => closePanel()
  setTimeout(() => {
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  panel.dataset.cleanup = '1'
  panel.addEventListener('v2mark:cleanup', () => {
    document.removeEventListener('mousedown', onDown)
    window.removeEventListener('scroll', onScroll)
  })
}

export function closePanel(): void {
  if (activePanel) {
    activePanel.dispatchEvent(new CustomEvent('v2mark:cleanup'))
    activePanel.remove()
    activePanel = undefined
  }
}

/**
 * 管理面板：全屏浮层。搜索、编辑、删除、导入导出（V2Mark 与 UTags 格式）。
 */
export function openManager(
  service: StoreService,
  onChanged: () => void
): void {
  if (document.querySelector('.v2mark-manager')) {
    return
  }

  const overlay = document.createElement('div')
  overlay.className = 'v2mark-manager'

  const box = document.createElement('div')
  box.className = 'v2mark-manager-box'

  // 顶栏
  const bar = document.createElement('div')
  bar.className = 'v2mark-manager-bar'
  const title = document.createElement('strong')
  title.textContent = 'V2Mark 标签管理'
  const spacer = document.createElement('span')
  spacer.className = 'v2mark-manager-spacer'
  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'v2mark-btn'
  closeBtn.textContent = '关闭'
  closeBtn.addEventListener('click', () => overlay.remove())
  bar.append(title, spacer, closeBtn)

  // 工具行：搜索 + 导入导出
  const tools = document.createElement('div')
  tools.className = 'v2mark-manager-tools'
  const search = document.createElement('input')
  search.type = 'search'
  search.placeholder = '搜索用户名或标签…'
  const importBtn = document.createElement('button')
  importBtn.type = 'button'
  importBtn.className = 'v2mark-btn'
  importBtn.textContent = '导入数据'
  const exportBtn = document.createElement('button')
  exportBtn.type = 'button'
  exportBtn.className = 'v2mark-btn'
  exportBtn.textContent = '导出 V2Mark'
  const exportUtagsBtn = document.createElement('button')
  exportUtagsBtn.type = 'button'
  exportBtn.className = 'v2mark-btn'
  exportUtagsBtn.className = 'v2mark-btn'
  exportUtagsBtn.textContent = '导出 UTags 格式'
  tools.append(search, importBtn, exportBtn, exportUtagsBtn)

  const status = document.createElement('div')
  status.className = 'v2mark-manager-status'

  // 同步设置区（WebDAV）
  const syncBox = document.createElement('div')
  syncBox.className = 'v2mark-manager-sync'
  const syncTitle = document.createElement('strong')
  syncTitle.textContent = '多设备同步（WebDAV）'
  const syncHint = document.createElement('div')
  syncHint.className = 'v2mark-manager-hint'
  syncHint.textContent =
    '坚果云：账户信息页开启密码选项生成应用密码，地址填 https://dav.jianguoyun.com/dav'

  const syncConfig = loadSyncConfig()
  const field = (
    label: string,
    key: keyof WebDavConfig,
    type = 'text'
  ): HTMLInputElement => {
    const wrap = document.createElement('label')
    wrap.className = 'v2mark-sync-field'
    const span = document.createElement('span')
    span.textContent = label
    const input = document.createElement('input')
    input.type = type
    input.value = String(syncConfig[key] ?? '')
    wrap.append(span, input)
    syncBox.append(wrap)
    return input
  }
  const urlInput = field('服务地址', 'url', 'url')
  urlInput.placeholder = 'https://dav.jianguoyun.com/dav'
  const pathInput = field('文件路径', 'path')
  pathInput.placeholder = 'v2mark/bookmarks.json'
  const userInput = field('用户名', 'username')
  const passInput = field('密码', 'password', 'password')

  const autoLabel = document.createElement('label')
  autoLabel.className = 'v2mark-sync-field v2mark-sync-check'
  const autoInput = document.createElement('input')
  autoInput.type = 'checkbox'
  autoInput.checked = syncConfig.autoSync
  const autoSpan = document.createElement('span')
  autoSpan.textContent = '本地变更后自动同步'
  autoLabel.append(autoInput, autoSpan)

  const syncStatus = document.createElement('span')
  syncStatus.className = 'v2mark-manager-status'
  const formatTime = (ts: number) =>
    ts > 0
      ? `上次同步：${new Date(ts).toLocaleString()}`
      : '尚未同步'

  const saveSyncBtn = document.createElement('button')
  saveSyncBtn.type = 'button'
  saveSyncBtn.className = 'v2mark-btn'
  saveSyncBtn.textContent = '保存配置'
  const syncBtn = document.createElement('button')
  syncBtn.type = 'button'
  syncBtn.className = 'v2mark-btn v2mark-btn-primary'
  syncBtn.textContent = '立即同步'

  const collectConfig = (): WebDavConfig => ({
    url: urlInput.value.trim(),
    path: pathInput.value.trim() || 'v2mark/bookmarks.json',
    username: userInput.value.trim(),
    password: passInput.value,
    autoSync: autoInput.checked,
    lastSyncAt: loadSyncConfig().lastSyncAt,
  })

  const refreshSyncStatus = () => {
    const cfg = loadSyncConfig()
    syncStatus.textContent = isConfigured(cfg)
      ? formatTime(cfg.lastSyncAt)
      : '未配置'
    syncBtn.disabled = !isConfigured(cfg)
  }

  saveSyncBtn.addEventListener('click', () => {
    const cfg = collectConfig()
    if (cfg.url && !/^https?:\/\//.test(cfg.url)) {
      syncStatus.textContent = '服务地址必须是 http(s) 开头'
      return
    }
    saveSyncConfig(cfg)
    refreshSyncStatus()
    syncStatus.textContent = isConfigured(cfg)
      ? '配置已保存'
      : '已保存（信息不完整，暂不同步）'
  })

  syncBtn.addEventListener('click', async () => {
    const cfg = collectConfig()
    saveSyncConfig(cfg)
    syncStatus.textContent = '同步中…'
    syncBtn.disabled = true
    try {
      const result = await syncNow(service, cfg)
      syncStatus.textContent = `已同步（远端 ${result.remoteCount} 条，本地 ${result.localCount} 条）`
      refresh()
      onChanged()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('[V2Mark] 同步失败：', message)
      // 错误信息必须留在界面上，不要在这里刷新状态行覆盖它
      syncStatus.textContent = `同步失败：${message}`
    } finally {
      syncBtn.disabled = false
    }
  })

  const syncActions = document.createElement('div')
  syncActions.className = 'v2mark-manager-tools'
  syncActions.append(saveSyncBtn, syncBtn, autoLabel, syncStatus)
  syncBox.append(syncHint, syncActions)
  refreshSyncStatus()

  // 列表
  const list = document.createElement('div')
  list.className = 'v2mark-manager-list'

  const download = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const refresh = () => {
    const keyword = search.value.trim().toLowerCase()
    const entries = service
      .aliveEntries()
      .filter(([key, entry]) => {
        if (!keyword) {
          return true
        }
        const name = key.split('/').pop() ?? ''
        return (
          name.toLowerCase().includes(keyword) ||
          entry.tags.some((t) => t.toLowerCase().includes(keyword))
        )
      })
      .sort((a, b) => b[1].meta.updated - a[1].meta.updated)

    status.textContent = `共 ${service.aliveEntries().length} 条`
    list.replaceChildren()

    for (const [key, entry] of entries) {
      const name = key.split('/').pop() ?? key
      const row = document.createElement('div')
      row.className = 'v2mark-manager-row'

      const user = document.createElement('a')
      user.href = key
      user.target = '_blank'
      user.rel = 'noopener'
      user.textContent = entry.meta.title || name
      user.className = 'v2mark-manager-user'

      const tags = document.createElement('span')
      tags.className = 'v2mark-manager-tags'
      tags.textContent = entry.tags.join('、') || '（无标签）'

      const editBtn = document.createElement('button')
      editBtn.type = 'button'
      editBtn.className = 'v2mark-btn v2mark-btn-sm'
      editBtn.textContent = '编辑'
      editBtn.addEventListener('click', () => {
        const next = window.prompt(
          `编辑 ${name} 的标签（逗号分隔，留空则删除）`,
          entry.tags.join(', ')
        )
        if (next === null) {
          return
        }
        void service
          .setTags(key, next.split(/[,，]/), entry.meta.title || name)
          .then(() => {
            refresh()
            onChanged()
          })
      })

      const delBtn = document.createElement('button')
      delBtn.type = 'button'
      delBtn.className = 'v2mark-btn v2mark-btn-sm v2mark-btn-danger'
      delBtn.textContent = '删除'
      delBtn.addEventListener('click', async () => {
        if (window.confirm(`删除 ${name} 的全部标签？`)) {
          await service.deleteEntry(key)
          refresh()
          onChanged()
        }
      })

      row.append(user, tags, editBtn, delBtn)
      list.append(row)
    }
  }

  search.addEventListener('input', refresh)

  exportBtn.addEventListener('click', () => {
    download(
      `v2mark-export-${new Date().toISOString().slice(0, 10)}.json`,
      service.exportJson()
    )
  })
  exportUtagsBtn.addEventListener('click', () => {
    download(
      `v2mark-utags-export-${new Date().toISOString().slice(0, 10)}.json`,
      service.exportUtagsJson()
    )
  })

  // 导入区：选择文件或粘贴 JSON，二选一
  const importBox = document.createElement('div')
  importBox.className = 'v2mark-manager-import'
  importBox.style.display = 'none'

  const importHint = document.createElement('div')
  importHint.className = 'v2mark-manager-hint'
  importHint.textContent =
    '选择导出的 .json 文件，或把文件内容粘贴到下面（不是文件路径）。支持 V2Mark 与 UTags 两种格式，将与现有数据合并。'

  const importArea = document.createElement('textarea')
  importArea.className = 'v2mark-import-textarea'
  importArea.rows = 4
  importArea.placeholder = '把 JSON 文件的完整内容粘贴到这里…'

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.json,application/json'
  fileInput.style.display = 'none'
  const fileName = document.createElement('span')
  fileName.className = 'v2mark-manager-status'

  const pickFileBtn = document.createElement('button')
  pickFileBtn.type = 'button'
  pickFileBtn.className = 'v2mark-btn'
  pickFileBtn.textContent = '选择文件…'
  pickFileBtn.addEventListener('click', () => {
    fileInput.click()
  })

  let fileText = ''
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (!file) {
      return
    }
    void file
      .text()
      .then((text) => {
        fileText = text
        fileName.textContent = `已选文件：${file.name}`
      })
      .catch(() => {
        fileName.textContent = '读取文件失败，请改用粘贴方式'
      })
  })

  const doImportBtn = document.createElement('button')
  doImportBtn.type = 'button'
  doImportBtn.className = 'v2mark-btn v2mark-btn-primary'
  doImportBtn.textContent = '导入'
  doImportBtn.addEventListener('click', () => {
    const text = importArea.value.trim() || fileText
    if (!text) {
      status.textContent = '请先选择文件，或粘贴 JSON 内容'
      return
    }
    void service
      .importJson(text)
      .then((count) => {
        status.textContent = `已导入 ${count} 条，当前共 ${service.aliveEntries().length} 条`
        importBox.style.display = 'none'
        importArea.value = ''
        fileText = ''
        fileName.textContent = ''
        fileInput.value = ''
        refresh()
        onChanged()
      })
      .catch((error: unknown) => {
        status.textContent = `导入失败：${error instanceof Error ? error.message : error}`
      })
  })

  const cancelImportBtn = document.createElement('button')
  cancelImportBtn.type = 'button'
  cancelImportBtn.className = 'v2mark-btn'
  cancelImportBtn.textContent = '收起'
  cancelImportBtn.addEventListener('click', () => {
    importBox.style.display = 'none'
  })

  const importActions = document.createElement('div')
  importActions.className = 'v2mark-manager-tools'
  importActions.append(pickFileBtn, doImportBtn, cancelImportBtn, fileName)
  importBox.append(importHint, importArea, importActions)

  importBtn.addEventListener('click', () => {
    importBox.style.display =
      importBox.style.display === 'none' ? 'flex' : 'none'
  })

  box.append(bar, tools, importBox, syncBox, status, list)
  overlay.append(box)
  document.body.append(overlay)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove()
    }
  })
  refresh()
  search.focus()
}
