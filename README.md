# V2Mark

给 V2EX 的网友做记号。油猴脚本，单站、轻量、数据自主。

在 V2EX 的帖子列表、回复页、个人主页给用户挂自由文本标签。数据保存在本地，可导出导入，格式兼容 [UTags](https://github.com/utags/utags)（小鱼标签）。

## 功能

状态：M1 开发中，尚未发布首个版本。

计划功能：

- 给用户挂标签，逗号分隔，支持多个
- 置顶标签、最近常用标签快捷点选
- 特殊标签过滤：sb、标题党半透明，block、屏蔽不显示
- 管理面板：标签列表、搜索、导出导入 JSON
- 多设备同步（WebDAV、坚果云等，M2）

## 安装

脚本尚未发布。首个版本发布后，从这里安装：

- GreasyFork（发布后更新链接）
- 直接从 GitHub 安装：[dist/v2mark.user.js](https://github.com/HUkiah/v2mark/raw/main/dist/v2mark.user.js)

需要先安装脚本管理器：[Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。

注意：Chrome 138 及以上版本，要在 Tampermonkey 的详情页打开 Allow User Scripts 开关，脚本才会执行。

## 开发

```bash
npm install
npm run dev        # watch 模式，改 src/ 自动构建到 dist/
npm run build      # 构建到 dist/v2mark.user.js
npm run typecheck  # 类型检查
```

构建产物不压缩（GreasyFork 规则禁止压缩混淆）。dist/ 直接提交到仓库，供 raw 链接安装。

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
