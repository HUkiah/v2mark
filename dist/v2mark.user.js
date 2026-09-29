// ==UserScript==
// @name         V2Mark - V2EX 用户标签
// @name:en      V2Mark - User tags for V2EX
// @namespace    https://github.com/HUkiah/v2mark
// @version      0.1.0
// @description  给 V2EX 的网友做记号：用户标签、特殊标签过滤，数据自主、可同步。
// @description:en  Add tags to V2EX members. Local-first, sync-ready, UTags-compatible data.
// @author       HUkiah
// @license      MIT
// @match        https://www.v2ex.com/*
// @match        https://global.v2ex.com/*
// @match        https://v2ex.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-end
// @noframes
// @homepageURL  https://github.com/HUkiah/v2mark
// @supportURL   https://github.com/HUkiah/v2mark/issues
// @updateURL    https://github.com/HUkiah/v2mark/raw/main/dist/v2mark.user.js
// @downloadURL  https://github.com/HUkiah/v2mark/raw/main/dist/v2mark.user.js
// ==/UserScript==
"use strict";
(() => {
  // src/styles/v2mark.css
  var v2mark_default = `/* V2Mark \u6837\u5F0F */

/* ---------- \u884C\u5185\u6807\u7B7E ---------- */

.v2mark-tags {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 4px;
  vertical-align: middle;
}

.v2mark-tag {
  display: inline-block;
  padding: 0 6px;
  border: 1px solid #dde4ec;
  border-radius: 3px;
  background: #eef2f7;
  color: #666;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}

/* \u60AC\u505C\u7528\u6237\u540D\u6216\u6807\u7B7E\u533A\u57DF\u65F6\u51FA\u73B0\u7684\u7F16\u8F91\u56FE\u6807 */
.v2mark-captain {
  display: none;
  border: none;
  background: none;
  padding: 0 2px;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  opacity: 0.55;
}

a[href*="/member/"]:hover + .v2mark-tags .v2mark-captain,
.content h1:hover + .v2mark-tags .v2mark-captain,
.v2mark-tags:hover .v2mark-captain {
  display: inline-block;
}

/* ---------- \u7279\u6B8A\u6807\u7B7E\u7684\u5217\u8868\u7EA7\u6548\u679C ---------- */
/* \u5217\u8868\u884C\u5BB9\u5668\u805A\u5408\u4E86\u8BE5\u884C\u6240\u6709\u6807\u7B7E\uFF08data-v2mark-list=",tag1,tag2,"\uFF09\u3002 */

[data-v2mark-list*=",sb,"],
[data-v2mark-list*=",\u6807\u9898\u515A,"],
[data-v2mark-list*=",\u63A8\u5E7F,"],
[data-v2mark-list*=",\u65E0\u804A,"],
[data-v2mark-list*=",\u5FFD\u7565,"],
[data-v2mark-list*=",ignore,"],
[data-v2mark-list*=",clickbait,"] {
  opacity: 10%;
}

[data-v2mark-list*=",\u5DF2\u9605,"],
[data-v2mark-list*=",\u65B0\u7528\u6237,"] {
  opacity: 50%;
}

[data-v2mark-list*=",block,"],
[data-v2mark-list*=",hide,"],
[data-v2mark-list*=",\u5C4F\u853D,"],
[data-v2mark-list*=",\u9690\u85CF,"] {
  display: none;
}

/* ---------- \u6807\u7B7E\u7F16\u8F91\u9762\u677F ---------- */

.v2mark-panel {
  position: absolute;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 280px;
  max-width: 360px;
  padding: 12px;
  border: 1px solid #d5dbe3;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  font-size: 13px;
}

.v2mark-panel-title {
  font-weight: 600;
  color: #333;
}

.v2mark-panel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 22px;
}

.v2mark-panel-chips[data-empty='1']::after {
  content: '\u8FD8\u6CA1\u6709\u6807\u7B7E';
  color: #999;
  font-size: 12px;
}

.v2mark-tag-removable {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.v2mark-tag-x {
  border: none;
  background: none;
  padding: 0;
  color: #999;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.v2mark-tag-x:hover {
  color: #e2c3c3;
}

.v2mark-panel-input {
  box-sizing: border-box;
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #ccd4de;
  border-radius: 4px;
  font-size: 13px;
}

.v2mark-panel-quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.v2mark-panel-quick-name {
  color: #999;
  font-size: 12px;
  margin-right: 2px;
}

.v2mark-quick-tag {
  cursor: pointer;
}

.v2mark-quick-tag:hover {
  border-color: #77808c;
  color: #333;
}

.v2mark-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.v2mark-btn {
  padding: 4px 12px;
  border: 1px solid #ccd4de;
  border-radius: 4px;
  background: #f7f9fb;
  color: #444;
  font-size: 13px;
  cursor: pointer;
}

.v2mark-btn:hover {
  background: #eef2f7;
}

.v2mark-btn-primary {
  border-color: #7784a8;
  background: #7784a8;
  color: #fff;
}

.v2mark-btn-primary:hover {
  background: #64718f;
}

.v2mark-btn-danger {
  color: #b05252;
}

.v2mark-btn-sm {
  padding: 2px 8px;
  font-size: 12px;
}

/* ---------- \u7BA1\u7406\u9762\u677F ---------- */

.v2mark-manager {
  position: fixed;
  inset: 0;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}

.v2mark-manager-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(720px, 92vw);
  max-height: 82vh;
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  font-size: 13px;
}

.v2mark-manager-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.v2mark-manager-spacer {
  flex: 1;
}

.v2mark-manager-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.v2mark-manager-tools input[type='search'] {
  flex: 1;
  min-width: 180px;
  padding: 5px 8px;
  border: 1px solid #ccd4de;
  border-radius: 4px;
  font-size: 13px;
}

.v2mark-manager-status {
  color: #888;
  font-size: 12px;
}

.v2mark-manager-list {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid #e8ecf1;
}

.v2mark-manager-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 2px;
  border-bottom: 1px solid #f0f3f7;
}

.v2mark-manager-user {
  flex: 0 0 auto;
  min-width: 120px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #77808c;
  font-weight: 600;
}

.v2mark-manager-tags {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #555;
}
`;

  // src/sites/v2ex.ts
  var V2EX_HOSTS = /* @__PURE__ */ new Set([
    "www.v2ex.com",
    "global.v2ex.com",
    "v2ex.com"
  ]);
  function memberKey(name) {
    return `https://www.v2ex.com/member/${name}`;
  }
  function memberNameFromHref(href) {
    const match = /\/member\/([^/?#]+)/.exec(href);
    return match?.[1];
  }
  var MEMBER_LINK_SELECTOR = 'a[href*="/member/"]';
  var EXCLUDE_SELECTORS = [
    ".site-nav a",
    ".cell_tabs a",
    ".tab-alt-container a",
    "#SecondaryTabs a",
    "a.page_normal",
    "a.page_current",
    "a.count_livid",
    ".button"
  ];
  var LIST_NODE_SELECTORS = [".box .cell"];

  // src/core/dom.ts
  var TAGS_CLASS = "v2mark-tags";
  var LIST_ATTR = "data-v2mark-list";
  function isExcluded(element) {
    return EXCLUDE_SELECTORS.some((selector) => element.closest(selector));
  }
  function renderPage(service, onEdit) {
    renderMemberLinks(service, onEdit);
    renderProfileTitle(service, onEdit);
    updateListEffects(document);
  }
  function renderMemberLinks(service, onEdit) {
    const links = document.querySelectorAll(
      MEMBER_LINK_SELECTOR
    );
    for (const link of links) {
      if (isExcluded(link)) {
        continue;
      }
      const name = memberNameFromHref(link.href);
      if (!name) {
        continue;
      }
      const key = memberKey(name);
      renderTagsAfter(link, key, name, service, onEdit);
    }
  }
  function renderProfileTitle(service, onEdit) {
    if (!location.pathname.includes("/member/")) {
      return;
    }
    const h1 = document.querySelector(".content h1");
    const name = h1?.textContent?.trim();
    if (!h1 || !name) {
      return;
    }
    const key = memberKey(name);
    renderTagsAfter(h1, key, name, service, onEdit);
  }
  function renderTagsAfter(target, key, name, service, onEdit) {
    const existing = target.nextElementSibling;
    if (existing?.classList.contains(TAGS_CLASS)) {
      existing.remove();
    }
    const container = document.createElement("span");
    container.className = TAGS_CLASS;
    container.dataset.v2markKey = key;
    const entry = service.getEntry(key);
    const tags = entry?.tags ?? [];
    const captain = document.createElement("button");
    captain.type = "button";
    captain.className = "v2mark-captain";
    captain.title = "\u7F16\u8F91\u6807\u7B7E";
    captain.textContent = "\u{1F3F7}\uFE0F";
    captain.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onEdit(key, target, name);
    });
    container.append(captain);
    for (const tag of tags) {
      const chip = document.createElement("span");
      chip.className = "v2mark-tag";
      chip.textContent = tag;
      container.append(chip);
    }
    container.dataset.v2markTags = tags.join(",");
    target.after(container);
  }
  function updateListEffects(root) {
    const lists = root.querySelectorAll(LIST_NODE_SELECTORS.join(","));
    for (const list of lists) {
      const tags = /* @__PURE__ */ new Set();
      for (const tagged of list.querySelectorAll(
        `.${TAGS_CLASS}[data-v2mark-tags]`
      )) {
        if (tagged.closest(`[${LIST_ATTR}]`) === list) {
          continue;
        }
        for (const tag of tagged.dataset.v2markTags?.split(",") ?? []) {
          if (tag) {
            tags.add(tag);
          }
        }
      }
      if (tags.size > 0) {
        list.setAttribute(LIST_ATTR, `,${[...tags].join(",")},`);
      } else {
        list.removeAttribute(LIST_ATTR);
      }
    }
  }
  function observeMutations(onChange) {
    let timer;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onChange, 500);
    };
    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some(
        (m) => m.type === "childList" && Array.from(m.addedNodes).some(
          (n) => n instanceof HTMLElement && n.querySelector?.(MEMBER_LINK_SELECTOR)
        )
      );
      if (relevant) {
        schedule();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // src/core/data.ts
  function createEmptyStore() {
    return {
      meta: { version: 1, updated: 0 },
      data: {}
    };
  }
  var TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
  var UTAGS_DELETED_TAG = "._DELETED_";
  function deleteEntry(store, key, now = Date.now()) {
    const entry = store.data[key];
    if (!entry || entry.meta.deleted) {
      return false;
    }
    entry.meta.deleted = now;
    entry.meta.updated = now;
    store.meta.updated = now;
    return true;
  }
  function gcDeleted(store, now = Date.now()) {
    let removed = 0;
    for (const key of Object.keys(store.data)) {
      const deleted = store.data[key]?.meta.deleted;
      if (deleted !== void 0 && now - deleted > TOMBSTONE_TTL_MS) {
        delete store.data[key];
        removed++;
      }
    }
    return removed;
  }
  function mergeStores(a, b) {
    const merged = createEmptyStore();
    let updated = 0;
    for (const key of /* @__PURE__ */ new Set([...Object.keys(a.data), ...Object.keys(b.data)])) {
      const ea = a.data[key];
      const eb = b.data[key];
      const winner = !ea ? eb : !eb ? ea : ea.meta.updated >= eb.meta.updated ? ea : eb;
      if (!winner) {
        continue;
      }
      merged.data[key] = winner;
      updated = Math.max(updated, winner.meta.updated);
    }
    merged.meta.updated = updated;
    return merged;
  }
  function toUtagsExport(store) {
    const data = {};
    for (const [url, entry] of Object.entries(store.data)) {
      const tags = entry.meta.deleted ? [...entry.tags, UTAGS_DELETED_TAG] : [...entry.tags];
      data[url] = {
        tags,
        meta: {
          title: entry.meta.title,
          created: entry.meta.created,
          updated: entry.meta.updated
        }
      };
    }
    return JSON.stringify({
      meta: {
        databaseVersion: 3,
        extensionVersion: "v2mark",
        created: Math.min(
          ...Object.values(store.data).map((e) => e.meta.created).concat([Date.now()])
        ),
        updated: store.meta.updated
      },
      data
    });
  }
  function parseUtagsExport(json) {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || !parsed.data) {
      throw new Error("\u4E0D\u662F\u6709\u6548\u7684 UTags \u5BFC\u51FA\u6570\u636E");
    }
    const store = createEmptyStore();
    let updated = 0;
    for (const [url, entry] of Object.entries(parsed.data)) {
      if (!Array.isArray(entry?.tags)) {
        continue;
      }
      const tags = entry.tags.filter(
        (t) => typeof t === "string" && t.trim().length > 0 && t !== UTAGS_DELETED_TAG
      );
      const meta = entry.meta ?? {};
      const now = Date.now();
      const created = typeof meta.created === "number" ? meta.created : now;
      const entryUpdated = typeof meta.updated === "number" ? meta.updated : now;
      const isDeleted = entry.tags.includes(UTAGS_DELETED_TAG);
      store.data[url] = {
        tags,
        meta: {
          title: typeof meta.title === "string" ? meta.title : void 0,
          created,
          updated: entryUpdated,
          ...isDeleted ? { deleted: entryUpdated } : {}
        }
      };
      updated = Math.max(updated, entryUpdated);
    }
    store.meta.updated = updated;
    return store;
  }

  // src/core/storage.ts
  var STORAGE_KEY = "v2mark.store";
  function createGmStorage() {
    if (typeof GM_getValue === "function" && typeof GM_setValue === "function") {
      return {
        load() {
          const raw = GM_getValue(STORAGE_KEY, void 0);
          if (!raw) {
            return Promise.resolve(createEmptyStore());
          }
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.data && parsed?.meta) {
              return Promise.resolve(parsed);
            }
          } catch {
          }
          return Promise.resolve(createEmptyStore());
        },
        save(store) {
          GM_setValue(STORAGE_KEY, JSON.stringify(store));
          return Promise.resolve();
        }
      };
    }
    return {
      load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return Promise.resolve(createEmptyStore());
        }
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.data && parsed?.meta) {
            return Promise.resolve(parsed);
          }
        } catch {
        }
        return Promise.resolve(createEmptyStore());
      },
      save(store) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        return Promise.resolve();
      }
    };
  }

  // src/core/store-service.ts
  var DEFAULT_PINNED = ["block", "sb", "\u5927\u4F6C", "\u6709\u8DA3"];
  var MOST_USED_LIMIT = 10;
  var StoreService = class {
    constructor(storage) {
      this.storage = storage;
    }
    storage;
    store = createEmptyStore();
    async init() {
      this.store = await this.storage.load();
      gcDeleted(this.store);
      await this.storage.save(this.store);
    }
    /** 未删除的条目 */
    aliveEntries() {
      return Object.entries(this.store.data).filter(
        ([, entry]) => entry.meta.deleted === void 0
      );
    }
    getEntry(key) {
      const entry = this.store.data[key];
      return entry && entry.meta.deleted === void 0 ? entry : void 0;
    }
    /** 置顶标签列表，默认 DEFAULT_PINNED */
    pinnedTags() {
      return this.store.meta.pinned ?? DEFAULT_PINNED;
    }
    async setPinnedTags(tags) {
      this.store.meta.pinned = tags;
      await this.storage.save(this.store);
    }
    /** 标签使用频次，按次数降序 */
    tagCounts() {
      const counts = /* @__PURE__ */ new Map();
      for (const [, entry] of this.aliveEntries()) {
        for (const tag of entry.tags) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }
    /** 常用标签：使用频次前 N 个 */
    mostUsedTags(limit = MOST_USED_LIMIT) {
      return this.tagCounts().slice(0, limit).map(([tag]) => tag);
    }
    /**
     * 设置某个用户的标签。空数组等于删除（软删除）。
     * 已软删除的条目重新写入时自动恢复。
     */
    async setTags(key, tags, title) {
      const now = Date.now();
      const cleaned = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
      let entry = this.store.data[key];
      if (!entry) {
        entry = { tags: [], meta: { created: now, updated: now } };
        this.store.data[key] = entry;
      }
      if (cleaned.length === 0) {
        if (!entry.meta.deleted) {
          deleteEntry(this.store, key, now);
        }
      } else {
        entry.tags = cleaned;
        entry.meta.updated = now;
        delete entry.meta.deleted;
        if (title && title.trim()) {
          entry.meta.title = title.trim();
        }
        this.store.meta.updated = now;
      }
      await this.storage.save(this.store);
      return entry;
    }
    async deleteEntry(key) {
      deleteEntry(this.store, key);
      await this.storage.save(this.store);
    }
    /** 导入外部数据（自动识别 V2Mark 与 UTags 格式），与本地合并。返回导入的条目数。 */
    async importJson(json) {
      const trimmed = json.trim();
      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        throw new Error("\u4E0D\u662F\u6709\u6548\u7684 JSON");
      }
      const obj = parsed;
      let incoming;
      if (obj?.meta && typeof obj.meta === "object" && "databaseVersion" in obj.meta) {
        incoming = parseUtagsExport(trimmed);
      } else if (obj?.data && obj?.meta) {
        incoming = parsed;
      } else {
        throw new Error("\u65E0\u6CD5\u8BC6\u522B\u7684\u6570\u636E\u683C\u5F0F");
      }
      const imported = Object.keys(incoming.data).length;
      this.store = mergeStores(this.store, incoming);
      gcDeleted(this.store);
      await this.storage.save(this.store);
      return imported;
    }
    /** V2Mark 原生格式导出（含置顶配置） */
    exportJson() {
      return JSON.stringify(this.store);
    }
    /** UTags 兼容格式导出 */
    exportUtagsJson() {
      return toUtagsExport(this.store);
    }
  };

  // src/core/ui.ts
  var activePanel;
  function openTagPanel(key, anchor, name, service, onSaved) {
    closePanel();
    const entry = service.getEntry(key);
    const current = new Set(entry?.tags ?? []);
    const pinned = service.pinnedTags();
    const mostUsed = service.mostUsedTags().filter((t) => !pinned.includes(t));
    const panel = document.createElement("div");
    panel.className = "v2mark-panel";
    const title = document.createElement("div");
    title.className = "v2mark-panel-title";
    title.textContent = name;
    const chips = document.createElement("div");
    chips.className = "v2mark-panel-chips";
    const renderChips = () => {
      chips.replaceChildren();
      if (current.size === 0) {
        chips.dataset.empty = "1";
        return;
      }
      for (const tag of current) {
        const chip = document.createElement("span");
        chip.className = "v2mark-tag v2mark-tag-removable";
        chip.textContent = tag;
        const x = document.createElement("button");
        x.className = "v2mark-tag-x";
        x.textContent = "\xD7";
        x.title = "\u79FB\u9664";
        x.addEventListener("click", () => {
          current.delete(tag);
          renderChips();
        });
        chip.append(x);
        chips.append(chip);
      }
    };
    const input = document.createElement("input");
    input.className = "v2mark-panel-input";
    input.type = "text";
    input.placeholder = "\u8F93\u5165\u6807\u7B7E\uFF0C\u9017\u53F7\u5206\u9694\uFF0C\u56DE\u8F66\u786E\u8BA4";
    const commitInput = () => {
      for (const tag of input.value.split(/[,，]/)) {
        const t = tag.trim();
        if (t) {
          current.add(t);
        }
      }
      input.value = "";
      renderChips();
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitInput();
      }
      if (event.key === "Escape") {
        closePanel();
      }
    });
    input.addEventListener("blur", commitInput);
    const quickRow = (label, tags) => {
      if (tags.length === 0) {
        return void 0;
      }
      const row = document.createElement("div");
      row.className = "v2mark-panel-quick";
      const name2 = document.createElement("span");
      name2.className = "v2mark-panel-quick-name";
      name2.textContent = label;
      row.append(name2);
      for (const tag of tags) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "v2mark-tag v2mark-quick-tag";
        b.textContent = tag;
        b.addEventListener("click", () => {
          if (current.has(tag)) {
            current.delete(tag);
          } else {
            current.add(tag);
          }
          renderChips();
        });
        row.append(b);
      }
      return row;
    };
    const actions = document.createElement("div");
    actions.className = "v2mark-panel-actions";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "v2mark-btn v2mark-btn-primary";
    save.textContent = "\u4FDD\u5B58";
    save.addEventListener("click", async () => {
      await service.setTags(key, [...current], name);
      closePanel();
      onSaved();
    });
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "v2mark-btn";
    cancel.textContent = "\u53D6\u6D88";
    cancel.addEventListener("click", closePanel);
    actions.append(save, cancel);
    const pinnedRow = quickRow("\u7F6E\u9876", pinned);
    const usedRow = quickRow("\u5E38\u7528", mostUsed);
    panel.append(
      title,
      chips,
      input,
      ...pinnedRow ? [pinnedRow] : [],
      ...usedRow ? [usedRow] : [],
      actions
    );
    document.body.append(panel);
    const rect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = Math.min(
      Math.max(rect.left + window.scrollX, 8),
      window.scrollX + window.innerWidth - panelRect.width - 8
    );
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    activePanel = panel;
    input.focus();
    const onDown = (event) => {
      if (!panel.contains(event.target)) {
        closePanel();
      }
    };
    const onScroll = () => closePanel();
    setTimeout(() => {
      document.addEventListener("mousedown", onDown);
      window.addEventListener("scroll", onScroll, { passive: true });
    });
    panel.dataset.cleanup = "1";
    panel.addEventListener("v2mark:cleanup", () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll);
    });
  }
  function closePanel() {
    if (activePanel) {
      activePanel.dispatchEvent(new CustomEvent("v2mark:cleanup"));
      activePanel.remove();
      activePanel = void 0;
    }
  }
  function openManager(service, onChanged) {
    if (document.querySelector(".v2mark-manager")) {
      return;
    }
    const overlay = document.createElement("div");
    overlay.className = "v2mark-manager";
    const box = document.createElement("div");
    box.className = "v2mark-manager-box";
    const bar = document.createElement("div");
    bar.className = "v2mark-manager-bar";
    const title = document.createElement("strong");
    title.textContent = "V2Mark \u6807\u7B7E\u7BA1\u7406";
    const spacer = document.createElement("span");
    spacer.className = "v2mark-manager-spacer";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "v2mark-btn";
    closeBtn.textContent = "\u5173\u95ED";
    closeBtn.addEventListener("click", () => overlay.remove());
    bar.append(title, spacer, closeBtn);
    const tools = document.createElement("div");
    tools.className = "v2mark-manager-tools";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "\u641C\u7D22\u7528\u6237\u540D\u6216\u6807\u7B7E\u2026";
    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "v2mark-btn";
    importBtn.textContent = "\u5BFC\u5165\uFF08V2Mark / UTags\uFF09";
    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "v2mark-btn";
    exportBtn.textContent = "\u5BFC\u51FA V2Mark";
    const exportUtagsBtn = document.createElement("button");
    exportUtagsBtn.type = "button";
    exportBtn.className = "v2mark-btn";
    exportUtagsBtn.className = "v2mark-btn";
    exportUtagsBtn.textContent = "\u5BFC\u51FA UTags \u683C\u5F0F";
    tools.append(search, importBtn, exportBtn, exportUtagsBtn);
    const status = document.createElement("div");
    status.className = "v2mark-manager-status";
    const list = document.createElement("div");
    list.className = "v2mark-manager-list";
    const download = (filename, text) => {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };
    const refresh = () => {
      const keyword = search.value.trim().toLowerCase();
      const entries = service.aliveEntries().filter(([key, entry]) => {
        if (!keyword) {
          return true;
        }
        const name = key.split("/").pop() ?? "";
        return name.toLowerCase().includes(keyword) || entry.tags.some((t) => t.toLowerCase().includes(keyword));
      }).sort((a, b) => b[1].meta.updated - a[1].meta.updated);
      status.textContent = `\u5171 ${service.aliveEntries().length} \u6761`;
      list.replaceChildren();
      for (const [key, entry] of entries) {
        const name = key.split("/").pop() ?? key;
        const row = document.createElement("div");
        row.className = "v2mark-manager-row";
        const user = document.createElement("a");
        user.href = key;
        user.target = "_blank";
        user.rel = "noopener";
        user.textContent = entry.meta.title || name;
        user.className = "v2mark-manager-user";
        const tags = document.createElement("span");
        tags.className = "v2mark-manager-tags";
        tags.textContent = entry.tags.join("\u3001") || "\uFF08\u65E0\u6807\u7B7E\uFF09";
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "v2mark-btn v2mark-btn-sm";
        editBtn.textContent = "\u7F16\u8F91";
        editBtn.addEventListener("click", () => {
          const next = window.prompt(
            `\u7F16\u8F91 ${name} \u7684\u6807\u7B7E\uFF08\u9017\u53F7\u5206\u9694\uFF0C\u7559\u7A7A\u5219\u5220\u9664\uFF09`,
            entry.tags.join(", ")
          );
          if (next === null) {
            return;
          }
          void service.setTags(key, next.split(/[,，]/), entry.meta.title || name).then(() => {
            refresh();
            onChanged();
          });
        });
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "v2mark-btn v2mark-btn-sm v2mark-btn-danger";
        delBtn.textContent = "\u5220\u9664";
        delBtn.addEventListener("click", async () => {
          if (window.confirm(`\u5220\u9664 ${name} \u7684\u5168\u90E8\u6807\u7B7E\uFF1F`)) {
            await service.deleteEntry(key);
            refresh();
            onChanged();
          }
        });
        row.append(user, tags, editBtn, delBtn);
        list.append(row);
      }
    };
    search.addEventListener("input", refresh);
    exportBtn.addEventListener("click", () => {
      download(
        `v2mark-export-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`,
        service.exportJson()
      );
    });
    exportUtagsBtn.addEventListener("click", () => {
      download(
        `v2mark-utags-export-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`,
        service.exportUtagsJson()
      );
    });
    importBtn.addEventListener("click", () => {
      const json = window.prompt(
        "\u7C98\u8D34\u5BFC\u5165\u6570\u636E\uFF08V2Mark \u5BFC\u51FA\u683C\u5F0F\u6216 UTags \u5BFC\u51FA\u683C\u5F0F\uFF09\uFF0C\u5C06\u4E0E\u73B0\u6709\u6570\u636E\u5408\u5E76\uFF1A"
      );
      if (!json) {
        return;
      }
      void service.importJson(json).then((count) => {
        status.textContent = `\u5DF2\u5BFC\u5165 ${count} \u6761`;
        refresh();
        onChanged();
      }).catch((error) => {
        window.alert(`\u5BFC\u5165\u5931\u8D25\uFF1A${error instanceof Error ? error.message : error}`);
      });
    });
    box.append(bar, tools, status, list);
    overlay.append(box);
    document.body.append(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });
    refresh();
    search.focus();
  }

  // src/main.ts
  function injectStyle(css) {
    if (typeof GM_addStyle === "function") {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
  }
  async function main() {
    console.log(`[V2Mark] v${"0.1.0"} \u5DF2\u52A0\u8F7D`, location.host);
    const service = new StoreService(createGmStorage());
    await service.init();
    const renderAll = () => {
      renderPage(service, (key, anchor, name) => {
        openTagPanel(key, anchor, name, service, renderAll);
      });
    };
    renderAll();
    observeMutations(renderAll);
    if (typeof GM_registerMenuCommand === "function") {
      GM_registerMenuCommand("\u{1F3F7}\uFE0F \u6807\u7B7E\u7BA1\u7406\u9762\u677F", () => {
        openManager(service, renderAll);
      });
    }
  }
  if (V2EX_HOSTS.has(location.host)) {
    injectStyle(v2mark_default);
    void main();
  }
})();
