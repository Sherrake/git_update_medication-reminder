# 吃药提醒 - 网页版

本文件夹为**吃药提醒**的网页版，可部署到 GitHub Pages。使用**账号登录**（邮箱+密码），同一账号在多设备登录可同步全部药物信息；登录后不退出则关闭网页再打开仍保持登录。

## 文件说明

| 文件 | 说明 |
|------|------|
| index.html | 入口页面（含登录/主界面） |
| styles.css | 样式 |
| app.js | 业务逻辑（登录、今日服药、提醒） |
| firebase-config.js | Firebase 配置（需自行填写并启用 Auth） |
| manifest.json | PWA 配置 |
| sw.js | Service Worker（离线缓存） |
| DEPLOY.md | 部署与 Firebase 配置步骤 |

## 本地预览

用任意静态服务器打开本文件夹即可，例如：

- 在 VS Code 中安装 “Live Server” 后右键 `index.html` → Open with Live Server
- 或在该目录执行：`npx serve .` 后访问提示的地址

## 部署到 GitHub Pages

1. 将**本文件夹内所有文件**作为仓库根目录或作为 `docs` 目录推送到 GitHub。
2. 若作为根目录：仓库 **Settings → Pages → Source** 选 **Deploy from a branch**，Branch 选 `main`，Folder 选 **/ (root)**。
3. 若作为 docs：Folder 选 **/docs**。
4. 访问 `https://你的用户名.github.io/仓库名/` 即可使用。

详细步骤与 Firebase 配置见 **DEPLOY.md**。
