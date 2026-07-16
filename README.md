# Keval 金匣子 · 安装包下载

**Keval（金匣子）** 是一款本地优先、端到端加密的密钥 / 密码管理器。
所有数据都加密存储在你自己的设备上，主密码永不离开本机。

> 本仓库**只用于分发 macOS 安装包和版本信息**，不包含源代码。

## ⬇️ 下载最新版

👉 **[前往 Releases 下载最新版本](https://github.com/tomszhou/keval-release/releases/latest)**

在最新 Release 的 **Assets** 区域下载 `.dmg` 文件即可。

## 💻 系统要求

- macOS 11（Big Sur）或更高版本
- **Apple 芯片（M1 / M2 / M3 …）** —— 当前安装包为 Apple Silicon (arm64) 版本，暂不支持 Intel Mac

## 📦 安装

1. 双击下载好的 `.dmg`
2. 把 **Keval** 拖进 **Applications（应用程序）** 文件夹
3. 从启动台 / 应用程序里打开

安装包已经过 **Apple 公证（Notarized）**，正常双击即可打开，不会出现「无法验证开发者」的拦截。

## 🔎 检查 / 获取最新版本

- **人工查看**：本页 Releases 顶部即为最新版本号
- **程序查询**（可用于自动更新）：

  ```
  https://api.github.com/repos/tomszhou/keval-release/releases/latest
  ```

  返回 JSON 中的 `tag_name` 即最新版本（如 `v1.0.0`），`assets[].browser_download_url` 为安装包直链。

> ⚠️ 部分网络环境（如中国大陆）访问 GitHub 可能不稳定，必要时需自备网络工具。

## 🗒 版本历史

### v1.0.1（2026-07-16）
- **新增「检查更新」**：关于页可手动检查新版本，发现更新后一键下载并安装
- 界面文案中 / 英切换更完整；侧栏加宽，长菜单项不再换行

### v1.0.0（2026-07-15）
首个正式版本。
- 本地优先、端到端加密（AES-256-GCM / Argon2id 密钥派生）
- 六类条目：API 密钥、网站密码、邮箱、手机 / SIM、信用卡、安全笔记
- 加密文件保险库，支持外置盘存放
- 局域网设备间加密同步（双向 mTLS + 配对，不联外网）
- Touch ID 解锁、加密备份导出 / 恢复
- 中 / 英双语，深 / 浅色主题
