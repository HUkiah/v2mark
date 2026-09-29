# V2Mark

[![CI](https://github.com/HUkiah/v2mark/actions/workflows/ci.yml/badge.svg)](https://github.com/HUkiah/v2mark/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

给 V2EX 的网友做记号。油猴脚本，单站、轻量、数据自主。

在 V2EX 的帖子列表、回复页、个人主页给用户挂自由文本标签。数据保存在本地，可导出导入，格式兼容 [UTags](https://github.com/utags/utags)（小鱼标签）。

## 功能

v0.1.0（M1）已实现：

- 帖子列表、回复页给用户挂标签；个人主页标题挂标签
- 悬停用户名出现 🏷️ 图标，点击打开编辑面板：逗号分隔多标签、置顶与常用标签点选
- 已有标签常驻显示
- 特殊标签过滤：sb、标题党等半透明，block、屏蔽等隐藏该用户的帖子行
- 管理面板（脚本菜单）：搜索、编辑、删除、导出导入 JSON
- 数据格式与 UTags（小鱼标签）双向互通，可从 UTags 直接迁移
- 多设备同步（WebDAV、坚果云等，M2 开发中）

## 安装

- 从 GitHub 安装：[dist/v2mark.user.js](https://github.com/HUkiah/v2mark/raw/main/dist/v2mark.user.js)
- GreasyFork（发布后更新链接）

需要先安装脚本管理器：[Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。

注意：Chrome 138 及以上版本，要在 Tampermonkey 的详情页打开 Allow User Scripts 开关，脚本才会执行。

## 开发

```bash
npm install
npm run dev        # watch 模式，改 src/ 自动构建到 dist/
npm run build      # 构建到 dist/v2mark.user.js
npm run typecheck  # 类型检查
npm test           # 单元测试
```

构建产物不压缩（GreasyFork 规则禁止压缩混淆）。dist/ 直接提交到仓库，供 raw 链接安装。

仓库即全部开发环境：任何设备上 clone 后 `npm install` 就能继续开发。构建命令、目录说明和范围约定见 [CONTRIBUTING.md](CONTRIBUTING.md)，给 AI 编码工具的项目说明见 [AGENTS.md](AGENTS.md)。

## 参与贡献

欢迎 issue 和 PR。参与前读 [CONTRIBUTING.md](CONTRIBUTING.md)：开发环境、测试要求、提交规范和安全红线（不提交密钥与真实用户数据）。

## 目录结构

```
src/
  main.ts              入口
  sites/v2ex.ts        V2EX 适配：URL 规范化、选择器
  core/data.ts         数据模型，兼容 UTags 格式
  core/storage.ts      存储抽象（本地，M2 接同步后端）
  core/special-tags.ts 特殊标签词表与效果
  core/dom.ts          DOM 扫描与挂载
  core/ui.ts           标签输入面板
  styles/v2mark.css    标签样式与特殊标签过滤效果
scripts/build.mjs      esbuild 构建，产出用户脚本
dist/v2mark.user.js    构建产物
```

## 路线图

- M1 脚本版 MVP：标签增删改查、特殊标签效果、本地存储、导出导入
- M2 同步：WebDAV（坚果云）、GitHub Gist，条目级合并
- M3 扩展版：上架 Chrome/Edge，浏览器账号同步（storage.sync）
- M4 视反馈决定：自建同步服务等

## 许可证

[MIT](LICENSE)
