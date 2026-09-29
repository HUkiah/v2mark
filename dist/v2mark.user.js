// ==UserScript==
// @name         V2Mark - V2EX 用户标签
// @name:en      V2Mark - User tags for V2EX
// @namespace    https://github.com/HUkiah/v2mark
// @version      0.0.1
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
  var v2mark_default = '/* V2Mark \u6837\u5F0F\u3002\u7279\u6B8A\u6807\u7B7E\u7684\u8FC7\u6EE4\u6548\u679C\u5728\u8FD9\u91CC\u7528\u5C5E\u6027\u9009\u62E9\u5668\u5B9E\u73B0\u3002 */\n\n/* TODO(M1): \u6807\u7B7E\u56FE\u6807\u3001\u6807\u7B7E\u884C\u5185\u5C55\u793A\u3001\u8F93\u5165\u9762\u677F\u6837\u5F0F */\n\n/* \u5217\u8868\u884C\u5BB9\u5668\u4E0A\u805A\u5408\u4E86\u8BE5\u884C\u6240\u6709\u6807\u7B7E\uFF08data-v2mark-list="sb,block," \u683C\u5F0F\uFF0C\n   \u524D\u540E\u5E26\u9017\u53F7\uFF0C\u4FBF\u4E8E ,tag, \u5B50\u4E32\u5339\u914D\uFF09\u3002\u5B9E\u73B0\u89C1 core/dom\u3002 */\n\n[data-v2mark-list*=",sb,"],\n[data-v2mark-list*=",\u6807\u9898\u515A,"],\n[data-v2mark-list*=",\u63A8\u5E7F,"],\n[data-v2mark-list*=",\u65E0\u804A,"],\n[data-v2mark-list*=",\u5FFD\u7565,"] {\n  opacity: 10%;\n}\n\n[data-v2mark-list*=",\u5DF2\u9605,"],\n[data-v2mark-list*=",\u65B0\u7528\u6237,"] {\n  opacity: 50%;\n}\n\n[data-v2mark-list*=",block,"],\n[data-v2mark-list*=",hide,"],\n[data-v2mark-list*=",\u5C4F\u853D,"],\n[data-v2mark-list*=",\u9690\u85CF,"] {\n  display: none;\n}\n';

  // src/sites/v2ex.ts
  var V2EX_HOSTS = /* @__PURE__ */ new Set([
    "www.v2ex.com",
    "global.v2ex.com",
    "v2ex.com"
  ]);

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
  function main() {
    console.log(`[V2Mark] v${"0.0.1"} \u5DF2\u52A0\u8F7D`, location.host);
  }
  if (V2EX_HOSTS.has(location.host)) {
    injectStyle(v2mark_default);
    main();
  }
})();
