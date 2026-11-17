# 服药记录 · 每日一颗

一个可安装到手机桌面、支持多瓶管理、完全离线的服药记录 PWA。
架构参考 GitHub 成熟方案 [`amajid17/work-tracker`](https://github.com/amajid17/work-tracker)（MIT）：单文件 HTML + Service Worker + Web App Manifest。

## 功能
- 每日一颗打卡 / 撤销，连续天数、累计、本月达标率统计
- **多瓶并存**：可同时开多瓶，每瓶独立记录名称 / 容量 / 余量 / 开瓶日期
- **选瓶打卡**：点药瓶卡片「设为当前」，打卡即扣减选中的那瓶；某瓶吃完自动切到下一瓶
- 服药日历、补打卡、最近记录、低量提醒、余量/瓶名编辑
- JSON 导出 / 导入备份、清空数据
- 数据默认存本机 `localStorage`，支持离线使用
- **多端同步（可选）**：用同步码在手机 / 平板 / 电脑间自动合并数据，免注册登录

## 线上地址（GitHub Pages）
https://xhjn2023.github.io/me/pill-tracker/
（`gh-pages` orphan 分支的 `pill-tracker/` 子目录，不占用 me 站点根路径）

## 本地预览
Service Worker 需要 http(s) 或 localhost 才能注册（`file://` 下会自动跳过注册，页面仍可用，只是无法离线/安装）。

```bash
cd pill-tracker
python -m http.server 8080
# 打开 http://localhost:8080
```

## 部署（获得手机可访问的 HTTPS 地址后即可安装到桌面）
把整个 `pill-tracker/` 目录作为静态站点部署到任意 HTTPS 托管，例如：

- **Netlify Drop**：把 `pill-tracker` 文件夹拖到 https://app.netlify.com/drop
- **GitHub Pages**：推到仓库后用 Pages 托管该目录
- **Cloudflare Pages**：连接仓库，构建命令留空，输出目录设为 `pill-tracker`

> 注意：manifest 和 sw.js 使用相对路径（`./`），部署在根路径或子路径都能工作。

## 安装到手机桌面
- **iPhone**：Safari 打开网址 → 分享 → 添加到主屏幕
- **安卓**：Chrome 打开网址 → 菜单 → 安装应用 / 添加到主屏幕
- 安装后全屏打开，首次联网加载后可离线使用（页面右上「📲」按钮、设置面板内也有引导）

## 多端同步（首次配置，只需一次）
1. 打开 Supabase 项目 `cszkekdciqgimsvfgons` → 左侧 **SQL Editor** → New query
2. 粘贴本目录 `supabase-sync.sql` 全部内容 → **Run**（重复执行安全）
3. 页面右上角「未同步」→ 设置 → 多端同步 → **创建新同步码**，记下码（如 `ABCD-2345`）
4. 其他设备打开同一网址 → 设置 → **输入同步码加入**，数据自动合并

> 同步机制：一行 = 一个同步码的整包快照；以打卡记录（带时间戳）为事实源做并集 + 删除墓碑合并，两端各自打卡不会互相覆盖，撤销也能跨端传播。同步码即凭证（RLS 按 `X-Sync-Code` 请求头隔离），请勿外泄。断网时数据留本机，恢复网络自动合并。

## 文件结构
```
pill-tracker/
├── index.html           # 全部界面与逻辑（HTML+CSS+JS 内联）
├── manifest.webmanifest # PWA 安装配置
├── sw.js                # Service Worker，缓存 app shell 实现离线
├── supabase-sync.sql    # 多端同步建表 SQL（Supabase 执行一次）
├── icons/               # 各尺寸图标
└── README.md
```
