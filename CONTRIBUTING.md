# 参与贡献

感谢关注 V2Mark。这是一个小而专注的项目：给 V2EX 的网友做标签。参与前请先读 [README](README.md) 了解定位和路线图。

## 开发环境

需要 Node.js 20 及以上版本。

```bash
git clone https://github.com/HUkiah/v2mark.git
cd v2mark
npm install
npm run dev   # watch 模式，改 src/ 自动构建到 dist/
```

本地调试：把 `dist/v2mark.user.js` 拖进脚本管理器（Tampermonkey、Violentmonkey），或在管理器里直接打开该文件的 URL 安装。改动代码后 `npm run build`，再在管理器里刷新脚本。

```bash
npm run typecheck  # 类型检查
npm test           # 单元测试（vitest）
npm run build      # 构建用户脚本
```

跨设备开发：仓库即全部开发环境，clone 后 `npm install` 即可继续。构建产物 `dist/` 提交在仓库里，供用户从 raw 链接安装，改完代码记得重新构建并一起提交。

## 测试

数据层（导入解析、URL 规范化、合并语义）用 vitest 覆盖，测试文件放在 `src/` 对应文件旁，命名 `*.test.ts`。

DOM 与界面不做自动化测试，改动手动验证三条：

1. v2ex.com 首页、帖子页、个人主页，已有标签显示位置正确。
2. 增、删、改标签即时生效，刷新页面不丢。
3. 导出的 JSON 能被 UTags 导入，UTags 导出的 JSON 能被本项目导入。

## 提交与 PR

- 一个改动一个主题，提交信息用中文，说清做了什么。
- 直接改 `main` 适合小修；功能开发建议开分支，完成后提 Pull Request。
- PR 里说明改了什么、怎么验证的。CI 会跑类型检查、测试、构建和密钥扫描，全绿才会合并。

## 范围约定

- 只支持 V2EX 一个站点。多站点适配是明确不做的事（见 README 路线图），相关 PR 不会被接受。
- 同步功能按路线图推进（M2 WebDAV、Gist），自建服务端不在近期计划内。
- 上游行为参考：标签数据格式与 [UTags](https://github.com/utags/utags) 保持互通，改动 `src/core/data.ts` 时不能破坏兼容。

## 安全红线

这是公开仓库。以下内容任何情况下不能提交：

- 密钥、密码、token、应用专用密码，包括出现在示例、注释、测试数据里的。
- 任何真实用户的个人数据。测试一律使用虚构的用户名和标签（现有测试里的 `alice`、`bob` 等都是编的）。
- 个人身份信息（邮箱、真实姓名、公司信息）。

不确定某段内容能不能提交时，先在 issue 里问。CI 有密钥扫描兜底，但不要依赖它。
