# AGENTS.md

给 AI 编码工具（以及第一次进仓库的人类协作者）的项目说明。

## 这是什么项目

V2Mark：V2EX 单站用户标签油猴脚本。给 v2ex.com 的用户挂自由文本标签，特殊标签（sb、block 等）有半透明、隐藏等过滤效果。数据本地存储，格式与 UTags（小鱼标签）互通。

产品蓝图、形态调研等背景文档不在仓库里，如需上下文，以 README 的路线图和本文件为准。

## 常用命令

```bash
npm install
npm run dev        # esbuild watch，改 src/ 自动构建到 dist/
npm run typecheck  # tsc --noEmit，严格模式
npm test           # vitest 单测
npm run build      # 构建 dist/v2mark.user.js（不压缩，GreasyFork 规则）
```

改完代码必须跑 typecheck 和 test，并重新 build。`dist/` 提交在仓库里供 raw 链接安装，忘记重新构建会导致用户装到旧版本。

## 目录结构

- `src/main.ts`：入口，只做环境判断和装配
- `src/sites/v2ex.ts`：站点适配。URL 规范化、选择器。唯一的站点耦合点
- `src/core/data.ts`：数据模型与合并语义。**与 UTags 格式互通是硬约束**
- `src/core/storage.ts`：存储抽象。上层统一走 async 接口，iOS 管理器的异步 GM API 在这层适配
- `src/core/special-tags.ts`：特殊标签词表
- `src/core/dom.ts`：DOM 扫描与标签挂载
- `src/core/ui.ts`：输入面板与管理面板
- `src/styles/v2mark.css`：标签样式、特殊标签过滤（CSS 属性选择器 `[data-v2mark-list*=",tag,"]`）
- `scripts/build.mjs`：构建脚本，userscript 头在这里维护

## 约定

- TypeScript strict，不用 any。中文注释，只在讲清楚约束时写。
- 界面文案用简体中文。
- 特殊标签的过滤效果改 CSS（styles/v2mark.css），词表改 `special-tags.ts`，两处要保持同步。
- 软删除语义：删除标签不是移除 entry，而是记 `meta.deleted` 时间戳，30 天后物理清理。这是同步防复活的机制，不能绕过。

## 红线

- 只支持 V2EX，不加第二个站点。
- 不提交密钥、密码、token、真实用户数据。测试只用虚构数据。
- 不压缩、不混淆构建产物。
- 数据格式不破坏 UTags 兼容性。

## 当前状态

v0.2.0（M2 WebDAV）已实现：标签渲染、编辑面板、管理面板、UTags 互通、WebDAV 同步（条目级合并、变更后 3 秒自动推送、PUT 409 自动建目录）。37 个单测（vitest；DOM 集成测试用 happy-dom，文件头标注 `@vitest-environment happy-dom`）。

同步模块（core/sync.ts）的硬约束：凭据只经 readSetting/writeSetting 存本设备（key `v2mark.sync`），绝不放进 BookmarksStore（store 会被导出和同步）。同步引发的落盘走 `service.mergeFrom`（persist(false)），不触发变更回调，防止同步循环。

待办：真机验收（见 CONTRIBUTING.md 三条）；Gist 通道、V2EX 记事本实验通道待定；M3 扩展版。线上 v2ex.com 有 Cloudflare 挑战页，自动化浏览器进不去，DOM 验证一律走 happy-dom 集成测试。
