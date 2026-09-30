// ==UserScript==
// @name         V2Mark - V2EX 用户标签
// @name:en      V2Mark - User tags for V2EX
// @namespace    https://github.com/HUkiah/v2mark
// @version      0.2.7
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
// @grant        GM_xmlHttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_info
// @connect      dav.jianguoyun.com
// @connect      dav.dropdav.com
// @connect      dav.box.com
// @connect      app.koofr.net
// @connect      webdav.pcloud.com
// @connect      webdav.4shared.com
// @connect      localhost
// 说明：其他 WebDAV 域名首次请求时脚本管理器会弹确认，允许即可
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
  /* \u7528 padding \u6865\u63A5\u4E0E\u7528\u6237\u540D\u4E4B\u95F4\u7684\u7A7A\u9699\uFF1Amargin \u4E0D\u54CD\u5E94 hover\uFF0C\u4F1A\u5F62\u6210\u70B9\u4E0D\u5230\u7684\u6B7B\u533A */
  margin-left: 0;
  padding-left: 2px;
  vertical-align: middle;
  position: relative;
  /* \u9632\u6B62\u9875\u9762\u6D6E\u52A8\u5143\u7D20\u76D6\u4F4F\u6807\u7B7E\u533A\uFF0C\u541E\u6389\u70B9\u51FB */
  z-index: 5;
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

/* \u60AC\u505C\u7528\u6237\u540D\u6216\u6807\u7B7E\u533A\u57DF\u65F6\u51FA\u73B0\u7684\u7F16\u8F91\u56FE\u6807\u3002
   \u663E\u793A\u72B6\u6001\u7531 JS \u52A0 v2mark-hover \u7C7B\u63A7\u5236\uFF08\u89C1 core/dom\uFF09\uFF0C:hover \u4F5C\u515C\u5E95 */
.v2mark-captain {
  display: none;
  border: none;
  background: none;
  padding: 0 2px;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  opacity: 0.55;
  user-select: none;
  pointer-events: auto;
}

.v2mark-tags:hover .v2mark-captain,
.v2mark-tags.v2mark-hover .v2mark-captain {
  display: inline-block;
}

.v2mark-captain:hover {
  opacity: 1;
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

/* ---------- \u540C\u6B65\u8BBE\u7F6E ---------- */

.v2mark-manager-sync {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid #e4e9f0;
  border-radius: 6px;
  background: #fafbfd;
}

.v2mark-manager-hint {
  color: #888;
  font-size: 12px;
}

.v2mark-manager-sync .v2mark-sync-field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #555;
}

.v2mark-manager-sync .v2mark-sync-field span {
  flex: 0 0 56px;
}

.v2mark-manager-sync .v2mark-sync-field input[type='text'],
.v2mark-manager-sync .v2mark-sync-field input[type='url'],
.v2mark-manager-sync .v2mark-sync-field input[type='password'] {
  flex: 0 0 240px;
  padding: 4px 8px;
  border: 1px solid #ccd4de;
  border-radius: 4px;
  font-size: 12px;
}

.v2mark-sync-check {
  white-space: nowrap;
  color: #555;
}

/* ---------- \u5BFC\u5165\u533A ---------- */

.v2mark-manager-import {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid #e4e9f0;
  border-radius: 6px;
  background: #fafbfd;
}

.v2mark-import-textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccd4de;
  border-radius: 4px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  resize: vertical;
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
      if (link.querySelector("img")) {
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
  var HOVER_CLASS = "v2mark-hover";
  function bindHoverReveal(target, container) {
    let hideTimer;
    const show = () => {
      window.clearTimeout(hideTimer);
      container.classList.add(HOVER_CLASS);
    };
    const scheduleHide = () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        container.classList.remove(HOVER_CLASS);
      }, 250);
    };
    target.addEventListener("mouseenter", show);
    target.addEventListener("mouseleave", scheduleHide);
    container.addEventListener("mouseenter", show);
    container.addEventListener("mouseleave", scheduleHide);
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
    bindHoverReveal(target, container);
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
  function readSetting(key, fallback) {
    if (typeof GM_getValue === "function") {
      return GM_getValue(key, fallback);
    }
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function writeSetting(key, value) {
    if (typeof GM_setValue === "function") {
      GM_setValue(key, value);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
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
    listeners = /* @__PURE__ */ new Set();
    /** 注册本地数据变更回调（用于触发 debounce 自动同步）。返回取消函数。 */
    onPersist(callback) {
      this.listeners.add(callback);
      return () => {
        this.listeners.delete(callback);
      };
    }
    async persist(notify = true) {
      await this.storage.save(this.store);
      if (notify) {
        for (const callback of this.listeners) {
          callback();
        }
      }
    }
    async init() {
      this.store = await this.storage.load();
      gcDeleted(this.store);
      await this.persist(false);
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
      await this.persist();
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
      await this.persist();
      return entry;
    }
    async deleteEntry(key) {
      deleteEntry(this.store, key);
      await this.persist();
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
      await this.persist();
      return imported;
    }
    /**
     * 同步流程专用：合并远端数据并落盘。
     * 不触发变更回调，避免"同步引发保存、保存又触发同步"的循环。
     */
    mergeFrom(remote) {
      if (remote) {
        this.store = mergeStores(this.store, remote);
      }
      gcDeleted(this.store);
      void this.persist(false);
      return this.aliveEntries().length;
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

  // src/core/sync.ts
  var SYNC_CONFIG_KEY = "v2mark.sync";
  var EMPTY_CONFIG = {
    url: "",
    path: "v2mark/bookmarks.json",
    username: "",
    password: "",
    autoSync: true,
    lastSyncAt: 0
  };
  function loadSyncConfig() {
    return { ...EMPTY_CONFIG, ...readSetting(SYNC_CONFIG_KEY, {}) };
  }
  function saveSyncConfig(config) {
    writeSetting(SYNC_CONFIG_KEY, config);
  }
  function isConfigured(config) {
    return Boolean(
      config.url && config.path && config.username && config.password && /^https?:\/\//.test(config.url)
    );
  }
  function resolveXhr() {
    const g = globalThis;
    if (typeof GM_xmlHttpRequest === "function") {
      return GM_xmlHttpRequest;
    }
    if (typeof g.GM_xmlHttpRequest === "function") {
      return g.GM_xmlHttpRequest;
    }
    if (typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function") {
      return GM.xmlHttpRequest;
    }
    const gmObj = g.GM;
    if (gmObj && typeof gmObj.xmlHttpRequest === "function") {
      return gmObj.xmlHttpRequest;
    }
    return void 0;
  }
  function davRequest(method, url, config, data) {
    return new Promise((resolve, reject) => {
      const xhr = resolveXhr();
      if (!xhr) {
        const handler = typeof GM_info !== "undefined" && GM_info?.scriptHandler ? `${GM_info.scriptHandler} ${GM_info.version ?? ""}` : "\u672A\u77E5\u7BA1\u7406\u5668";
        reject(
          new Error(
            `\u5F53\u524D\u811A\u672C\u7BA1\u7406\u5668\u672A\u63D0\u4F9B\u8DE8\u57DF\u8BF7\u6C42\u63A5\u53E3\uFF08${handler}\uFF0C\u8BE6\u89C1\u83DC\u5355\u300C\u590D\u5236\u8BCA\u65AD\u4FE1\u606F\u300D\uFF09`
          )
        );
        return;
      }
      xhr({
        method,
        url,
        headers: {
          Authorization: `Basic ${btoa(
            `${config.username}:${config.password}`
          )}`,
          ...data !== void 0 ? { "Content-Type": "application/json" } : {}
        },
        data,
        timeout: 15e3,
        onload: (response) => {
          resolve({ status: response.status, text: response.responseText });
        },
        onerror: () => {
          reject(new Error(`\u7F51\u7EDC\u9519\u8BEF\uFF1A${method} ${url}`));
        },
        ontimeout: () => {
          reject(new Error(`\u8BF7\u6C42\u8D85\u65F6\uFF1A${method} ${url}`));
        }
      });
    });
  }
  function joinUrl(base, path) {
    return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  }
  async function ensureParentDirs(config) {
    const segments = config.path.replace(/^\/+/, "").split("/").slice(0, -1);
    let current = config.url.replace(/\/+$/, "");
    for (const segment of segments) {
      current += `/${segment}`;
      try {
        await davRequest("MKCOL", current, config);
      } catch {
      }
    }
  }
  function isValidStore(value) {
    const obj = value;
    return Boolean(obj?.meta && obj?.data && typeof obj.data === "object");
  }
  async function syncNow(service, config) {
    const fullUrl = joinUrl(config.url, config.path);
    const get = await davRequest("GET", fullUrl, config);
    let remote;
    if (get.status === 200) {
      try {
        const parsed = JSON.parse(get.text);
        if (isValidStore(parsed)) {
          remote = parsed;
        } else {
          throw new Error("\u8FDC\u7AEF\u6587\u4EF6\u4E0D\u662F\u6709\u6548\u7684 V2Mark \u6570\u636E");
        }
      } catch (error) {
        throw new Error(
          `\u8FDC\u7AEF\u6570\u636E\u89E3\u6790\u5931\u8D25\uFF1A${error instanceof Error ? error.message : error}`
        );
      }
    } else if (get.status !== 404 && get.status !== 409) {
      throw new Error(`\u8FDC\u7AEF\u8FD4\u56DE HTTP ${get.status}`);
    }
    const localCount = service.mergeFrom(remote);
    const remoteCount = remote ? Object.keys(remote.data).length : 0;
    let put = await davRequest("PUT", fullUrl, config, service.exportJson());
    if (put.status === 409) {
      await ensureParentDirs(config);
      put = await davRequest("PUT", fullUrl, config, service.exportJson());
    }
    if (put.status < 200 || put.status >= 300) {
      throw new Error(`\u63A8\u9001\u5931\u8D25\uFF0CHTTP ${put.status}`);
    }
    const done = { ...config, lastSyncAt: Date.now() };
    saveSyncConfig(done);
    return { remoteCount, localCount };
  }

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
    importBtn.textContent = "\u5BFC\u5165\u6570\u636E";
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
    const syncBox = document.createElement("div");
    syncBox.className = "v2mark-manager-sync";
    const syncTitle = document.createElement("strong");
    syncTitle.textContent = "\u591A\u8BBE\u5907\u540C\u6B65\uFF08WebDAV\uFF09";
    const syncHint = document.createElement("div");
    syncHint.className = "v2mark-manager-hint";
    syncHint.textContent = "\u575A\u679C\u4E91\uFF1A\u8D26\u6237\u4FE1\u606F\u9875\u5F00\u542F\u5BC6\u7801\u9009\u9879\u751F\u6210\u5E94\u7528\u5BC6\u7801\uFF0C\u5730\u5740\u586B https://dav.jianguoyun.com/dav";
    const syncConfig = loadSyncConfig();
    const field = (label, key, type = "text") => {
      const wrap = document.createElement("label");
      wrap.className = "v2mark-sync-field";
      const span = document.createElement("span");
      span.textContent = label;
      const input = document.createElement("input");
      input.type = type;
      input.value = String(syncConfig[key] ?? "");
      wrap.append(span, input);
      syncBox.append(wrap);
      return input;
    };
    const urlInput = field("\u670D\u52A1\u5730\u5740", "url", "url");
    urlInput.placeholder = "https://dav.jianguoyun.com/dav";
    const pathInput = field("\u6587\u4EF6\u8DEF\u5F84", "path");
    pathInput.placeholder = "v2mark/bookmarks.json";
    const userInput = field("\u7528\u6237\u540D", "username");
    const passInput = field("\u5BC6\u7801", "password", "password");
    const autoLabel = document.createElement("label");
    autoLabel.className = "v2mark-sync-field v2mark-sync-check";
    const autoInput = document.createElement("input");
    autoInput.type = "checkbox";
    autoInput.checked = syncConfig.autoSync;
    const autoSpan = document.createElement("span");
    autoSpan.textContent = "\u672C\u5730\u53D8\u66F4\u540E\u81EA\u52A8\u540C\u6B65";
    autoLabel.append(autoInput, autoSpan);
    const syncStatus = document.createElement("span");
    syncStatus.className = "v2mark-manager-status";
    const formatTime = (ts) => ts > 0 ? `\u4E0A\u6B21\u540C\u6B65\uFF1A${new Date(ts).toLocaleString()}` : "\u5C1A\u672A\u540C\u6B65";
    const saveSyncBtn = document.createElement("button");
    saveSyncBtn.type = "button";
    saveSyncBtn.className = "v2mark-btn";
    saveSyncBtn.textContent = "\u4FDD\u5B58\u914D\u7F6E";
    const syncBtn = document.createElement("button");
    syncBtn.type = "button";
    syncBtn.className = "v2mark-btn v2mark-btn-primary";
    syncBtn.textContent = "\u7ACB\u5373\u540C\u6B65";
    const collectConfig = () => ({
      url: urlInput.value.trim(),
      path: pathInput.value.trim() || "v2mark/bookmarks.json",
      username: userInput.value.trim(),
      password: passInput.value,
      autoSync: autoInput.checked,
      lastSyncAt: loadSyncConfig().lastSyncAt
    });
    const refreshSyncStatus = () => {
      const cfg = loadSyncConfig();
      syncStatus.textContent = isConfigured(cfg) ? formatTime(cfg.lastSyncAt) : "\u672A\u914D\u7F6E";
      syncBtn.disabled = !isConfigured(cfg);
    };
    saveSyncBtn.addEventListener("click", () => {
      const cfg = collectConfig();
      if (cfg.url && !/^https?:\/\//.test(cfg.url)) {
        syncStatus.textContent = "\u670D\u52A1\u5730\u5740\u5FC5\u987B\u662F http(s) \u5F00\u5934";
        return;
      }
      saveSyncConfig(cfg);
      refreshSyncStatus();
      syncStatus.textContent = isConfigured(cfg) ? "\u914D\u7F6E\u5DF2\u4FDD\u5B58" : "\u5DF2\u4FDD\u5B58\uFF08\u4FE1\u606F\u4E0D\u5B8C\u6574\uFF0C\u6682\u4E0D\u540C\u6B65\uFF09";
    });
    syncBtn.addEventListener("click", async () => {
      const cfg = collectConfig();
      saveSyncConfig(cfg);
      syncStatus.textContent = "\u540C\u6B65\u4E2D\u2026";
      syncBtn.disabled = true;
      try {
        const result = await syncNow(service, cfg);
        syncStatus.textContent = `\u5DF2\u540C\u6B65\uFF08\u8FDC\u7AEF ${result.remoteCount} \u6761\uFF0C\u672C\u5730 ${result.localCount} \u6761\uFF09`;
        refresh();
        onChanged();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("[V2Mark] \u540C\u6B65\u5931\u8D25\uFF1A", message);
        syncStatus.textContent = `\u540C\u6B65\u5931\u8D25\uFF1A${message}`;
      } finally {
        syncBtn.disabled = false;
      }
    });
    const syncActions = document.createElement("div");
    syncActions.className = "v2mark-manager-tools";
    syncActions.append(saveSyncBtn, syncBtn, autoLabel, syncStatus);
    syncBox.append(syncHint, syncActions);
    refreshSyncStatus();
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
    const importBox = document.createElement("div");
    importBox.className = "v2mark-manager-import";
    importBox.style.display = "none";
    const importHint = document.createElement("div");
    importHint.className = "v2mark-manager-hint";
    importHint.textContent = "\u9009\u62E9\u5BFC\u51FA\u7684 .json \u6587\u4EF6\uFF0C\u6216\u628A\u6587\u4EF6\u5185\u5BB9\u7C98\u8D34\u5230\u4E0B\u9762\uFF08\u4E0D\u662F\u6587\u4EF6\u8DEF\u5F84\uFF09\u3002\u652F\u6301 V2Mark \u4E0E UTags \u4E24\u79CD\u683C\u5F0F\uFF0C\u5C06\u4E0E\u73B0\u6709\u6570\u636E\u5408\u5E76\u3002";
    const importArea = document.createElement("textarea");
    importArea.className = "v2mark-import-textarea";
    importArea.rows = 4;
    importArea.placeholder = "\u628A JSON \u6587\u4EF6\u7684\u5B8C\u6574\u5185\u5BB9\u7C98\u8D34\u5230\u8FD9\u91CC\u2026";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.style.display = "none";
    const fileName = document.createElement("span");
    fileName.className = "v2mark-manager-status";
    const pickFileBtn = document.createElement("button");
    pickFileBtn.type = "button";
    pickFileBtn.className = "v2mark-btn";
    pickFileBtn.textContent = "\u9009\u62E9\u6587\u4EF6\u2026";
    pickFileBtn.addEventListener("click", () => {
      fileInput.click();
    });
    let fileText = "";
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) {
        return;
      }
      void file.text().then((text) => {
        fileText = text;
        fileName.textContent = `\u5DF2\u9009\u6587\u4EF6\uFF1A${file.name}`;
      }).catch(() => {
        fileName.textContent = "\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25\uFF0C\u8BF7\u6539\u7528\u7C98\u8D34\u65B9\u5F0F";
      });
    });
    const doImportBtn = document.createElement("button");
    doImportBtn.type = "button";
    doImportBtn.className = "v2mark-btn v2mark-btn-primary";
    doImportBtn.textContent = "\u5BFC\u5165";
    doImportBtn.addEventListener("click", () => {
      const text = importArea.value.trim() || fileText;
      if (!text) {
        status.textContent = "\u8BF7\u5148\u9009\u62E9\u6587\u4EF6\uFF0C\u6216\u7C98\u8D34 JSON \u5185\u5BB9";
        return;
      }
      void service.importJson(text).then((count) => {
        status.textContent = `\u5DF2\u5BFC\u5165 ${count} \u6761\uFF0C\u5F53\u524D\u5171 ${service.aliveEntries().length} \u6761`;
        importBox.style.display = "none";
        importArea.value = "";
        fileText = "";
        fileName.textContent = "";
        fileInput.value = "";
        refresh();
        onChanged();
      }).catch((error) => {
        status.textContent = `\u5BFC\u5165\u5931\u8D25\uFF1A${error instanceof Error ? error.message : error}`;
      });
    });
    const cancelImportBtn = document.createElement("button");
    cancelImportBtn.type = "button";
    cancelImportBtn.className = "v2mark-btn";
    cancelImportBtn.textContent = "\u6536\u8D77";
    cancelImportBtn.addEventListener("click", () => {
      importBox.style.display = "none";
    });
    const importActions = document.createElement("div");
    importActions.className = "v2mark-manager-tools";
    importActions.append(pickFileBtn, doImportBtn, cancelImportBtn, fileName);
    importBox.append(importHint, importArea, importActions);
    importBtn.addEventListener("click", () => {
      importBox.style.display = importBox.style.display === "none" ? "flex" : "none";
    });
    box.append(bar, tools, importBox, syncBox, status, list);
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
  var AUTO_SYNC_DEBOUNCE_MS = 3e3;
  async function main() {
    console.log(`[V2Mark] v${"0.2.7"} \u5DF2\u52A0\u8F7D`, location.host);
    const service = new StoreService(createGmStorage());
    await service.init();
    const renderAll = () => {
      renderPage(service, (key, anchor, name) => {
        openTagPanel(key, anchor, name, service, renderAll);
      });
    };
    const runSync = async () => {
      const config = loadSyncConfig();
      if (!isConfigured(config)) {
        return;
      }
      try {
        await syncNow(service, config);
        renderAll();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("[V2Mark] \u540C\u6B65\u5931\u8D25\uFF1A", message);
      }
    };
    let syncTimer;
    service.onPersist(() => {
      const config = loadSyncConfig();
      if (!config.autoSync) {
        return;
      }
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(() => {
        void runSync();
      }, AUTO_SYNC_DEBOUNCE_MS);
    });
    renderAll();
    observeMutations(renderAll);
    void runSync();
    if (typeof GM_registerMenuCommand === "function") {
      GM_registerMenuCommand("\u{1F3F7}\uFE0F \u6807\u7B7E\u7BA1\u7406\u9762\u677F", () => {
        openManager(service, renderAll);
      });
      GM_registerMenuCommand("\u{1F4CB} \u590D\u5236\u8BCA\u65AD\u4FE1\u606F", () => {
        const g = globalThis;
        const probe = (name) => {
          try {
            return typeof g[name];
          } catch {
            return "throws";
          }
        };
        const info = typeof GM_info !== "undefined" && GM_info ? {
          handler: GM_info.scriptHandler,
          managerVersion: GM_info.version,
          scriptVersion: GM_info.script?.version
        } : null;
        const gmObj = g.GM;
        const diag = {
          time: (/* @__PURE__ */ new Date()).toISOString(),
          ua: navigator.userAgent,
          manager: info,
          apis: {
            GM_setValue: probe("GM_setValue"),
            GM_getValue: probe("GM_getValue"),
            GM_registerMenuCommand: probe("GM_registerMenuCommand"),
            GM_xmlHttpRequest: probe("GM_xmlHttpRequest"),
            GM: probe("GM"),
            GM_info: probe("GM_info"),
            unsafeWindow: probe("unsafeWindow")
          },
          gmMembers: gmObj ? Object.keys(gmObj).map(
            (k) => `${k}:${typeof gmObj[k]}`
          ) : null,
          syncConfigured: isConfigured(loadSyncConfig())
        };
        const text = JSON.stringify(diag);
        console.log("[V2Mark] \u8BCA\u65AD\u4FE1\u606F\uFF1A", text);
        void navigator.clipboard?.writeText(text).then(() => console.log("[V2Mark] \u8BCA\u65AD\u4FE1\u606F\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F")).catch(() => {
          window.prompt("\u590D\u5236\u4E0B\u9762\u7684\u8BCA\u65AD\u4FE1\u606F\uFF1A", text);
        });
      });
    }
  }
  if (V2EX_HOSTS.has(location.host)) {
    injectStyle(v2mark_default);
    void main();
  }
})();
