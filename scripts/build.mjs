import { build, context } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const pkg = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'),
    'utf8'
  )
)

const version = pkg.version

// 用户脚本元数据。GreasyFork 禁止压缩混淆，构建保持不压缩。
const userscriptHeader = `// ==UserScript==
// @name         V2Mark - V2EX 用户标签
// @name:en      V2Mark - User tags for V2EX
// @namespace    https://github.com/HUkiah/v2mark
// @version      ${version}
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
// ==/UserScript==`

const commonOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/v2mark.user.js',
  banner: { js: userscriptHeader },
  loader: { '.css': 'text' },
  minify: false,
  target: ['es2022'],
  define: { __VERSION__: JSON.stringify(version) },
  logLevel: 'info',
}

const watch = process.argv.includes('--watch')

if (watch) {
  const ctx = await context(commonOptions)
  await ctx.watch()
  console.log('[v2mark] watch 模式已启动，修改 src/ 后自动重新构建到 dist/')
} else {
  await build(commonOptions)
}
