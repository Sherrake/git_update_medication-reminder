# 将吃药提醒部署到 GitHub Pages（网页版）

本文件夹为独立网页版，可直接用于部署。使用**账号登录**（邮箱+密码），同一账号在多设备登录可同步全部药物信息；不退出登录则关闭网页后再打开仍保持登录。须配置 **Firebase（Authentication + Firestore）** 后才能正常使用。

---

## 一、部署到 GitHub Pages（必做）

### 准备工作

| 准备项 | 说明 |
|--------|------|
| **GitHub 账号** | 在 [github.com](https://github.com) 注册并登录。 |
| **本机已装 Git** | 在终端执行 `git --version` 能显示版本号即表示已安装；未安装可到 [git-scm.com](https://git-scm.com) 下载。 |
| **项目文件就绪** | 确保 `medication-reminder-web` 文件夹内已有 `index.html`、`styles.css`、`app.js`、`firebase-config.js`、`manifest.json`、`sw.js`、`README.md`、`DEPLOY.md`。 |

### 方式 A：本文件夹作为仓库根目录（推荐）

**步骤 1：在 GitHub 上创建空仓库**

1. 登录 GitHub，点击右上角 **+** → **New repository**。
2. **Repository name** 填：`medication-reminder`（或你喜欢的名字，如 `med-reminder`）。
3. **Description** 可填：吃药提醒网页版（可选）。
4. 选择 **Public**。
5. **不要**勾选 “Add a README file”、“Add .gitignore”、“Choose a license”，保持仓库为空。
6. 点击 **Create repository**。创建完成后会看到一个空仓库页面，记下你的**用户名**和**仓库名**（后面命令里要替换）。

**步骤 2：在本机把本文件夹推送到该仓库**

1. 打开终端（PowerShell 或 CMD），进入本文件夹：
   ```bash
   cd c:\Users\shichaoran1\Desktop\cursor-practice\medication-reminder-web
   ```
2. 依次执行（把 `你的用户名` 换成你的 GitHub 用户名，`medication-reminder` 换成你刚建的仓库名）：
   ```bash
   git init
   git add index.html styles.css app.js firebase-config.js manifest.json sw.js README.md DEPLOY.md
   git commit -m "吃药提醒 PWA with sync"
   git branch -M main
   git remote add origin https://github.com/你的用户名/medication-reminder.git
   git push -u origin main
   ```
3. 若提示输入账号密码：密码处需填 **Personal Access Token**（GitHub 已不再支持账号密码）。在 GitHub → **Settings → Developer settings → Personal access tokens** 中生成一个 token，用 token 当密码。

**步骤 3：开启 GitHub Pages**

1. 在 GitHub 上打开该仓库页面，点击 **Settings**。
2. 左侧找到 **Pages**。
3. 在 **Build and deployment** 下，**Source** 选 **Deploy from a branch**。
4. **Branch** 选 `main`，**Folder** 选 **/ (root)**，点击 **Save**。
5. 等待约 1～2 分钟，页面顶部会出现绿色提示：*Your site is live at https://你的用户名.github.io/medication-reminder/* 。

**步骤 4：访问网页**

在浏览器打开：**https://你的用户名.github.io/medication-reminder/** 即可使用吃药提醒。

**方式 B：本文件夹作为仓库里的 docs 目录**

1. 在项目根目录（上一级）有仓库时，将本文件夹内容放到 `docs/` 下，然后：

```bash
git add docs/
git commit -m "吃药提醒网页版"
git push
```

2. **Settings → Pages** 里 **Folder** 选 **/docs**。访问：**https://你的用户名.github.io/仓库名/**

---

## 二、Firebase 配置（必做，否则无法登录与同步）

1. 打开 [Firebase 控制台](https://console.firebase.google.com)，创建项目。
2. 添加「网页」应用，记下 `apiKey`、`authDomain`、`projectId` 等，填入 **firebase-config.js**。
3. 启用 **Authentication**：左侧 **Build → Authentication** → **Get started** → **Sign-in method** 中启用 **电子邮件/密码**（Email/Password）。
4. 开通 **Firestore Database**：**Build → Firestore Database** → 创建数据库（测试模式即可）。在 **规则** 中改为（仅允许已登录用户读写自己的数据）：
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /schedules/{id} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
       }
       match /takens/{id} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
       }
     }
   }
   ```

---

## 三、使用方式

- 打开页面 → **登录**（或点击「没有账号？注册」先注册）。
- 同一账号在手机、电脑等多设备登录，药物信息自动同步。
- 不点击「退出登录」则关闭网页、关闭浏览器后再打开，仍保持登录状态。
- 到点会收到浏览器通知（需允许通知）。
- 手机浏览器可「添加到主屏幕」当 App 使用。
