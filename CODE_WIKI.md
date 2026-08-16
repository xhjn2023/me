# 我的工作台 (Me Workbench) — Code Wiki

> 个人移动工作台 PWA · 每天都能用的效率工具  
> 技术栈：React 18 + Vite 5 + TailwindCSS + Supabase  
> 文档生成日期：2026-08-16

---

## 目录

1. [项目概述](#1-项目概述)
2. [整体架构](#2-整体架构)
3. [目录结构](#3-目录结构)
4. [模块详解](#4-模块详解)
   - [4.1 入口与路由 (App.jsx)](#41-入口与路由-appjsx)
   - [4.2 首页仪表盘 (Dashboard)](#42-首页仪表盘-dashboard)
   - [4.3 工作模块 (Work)](#43-工作模块-work)
   - [4.4 学习模块 (Study)](#44-学习模块-study)
   - [4.5 英语模块 (English)](#45-英语模块-english)
   - [4.6 生活模块 (Life)](#46-生活模块-life)
   - [4.7 用药模块 (Medicine)](#47-用药模块-medicine)
   - [4.8 副业模块 (SideWork)](#48-副业模块-sidework)
   - [4.9 复盘模块 (Review)](#49-复盘模块-review)
   - [4.10 登录模块 (Login)](#410-登录模块-login)
5. [数据层](#5-数据层)
   - [5.1 Supabase 客户端](#51-supabase-客户端)
   - [5.2 认证模块](#52-认证模块)
   - [5.3 API 模块一览](#53-api-模块一览)
   - [5.4 业务 Store](#54-业务-store)
   - [5.5 种子数据](#55-种子数据)
   - [5.6 自定义 Hook](#56-自定义-hook)
6. [UI 组件库](#6-ui-组件库)
7. [数据库设计](#7-数据库设计)
   - [7.1 迁移文件总览](#71-迁移文件总览)
   - [7.2 数据表 ER 概要](#72-数据表-er-概要)
8. [部署与运行](#8-部署与运行)
   - [8.1 本地开发](#81-本地开发)
   - [8.2 构建与部署](#82-构建与部署)
   - [8.3 Express 后端（可选）](#83-express-后端可选)
9. [依赖关系](#9-依赖关系)
   - [9.1 生产依赖](#91-生产依赖)
   - [9.2 开发依赖](#92-开发依赖)
10. [附录](#10-附录)
    - [A. 关键文件索引](#a-关键文件索引)
    - [B. 全局事件与约定](#b-全局事件与约定)

---

## 1. 项目概述

**项目名称**：`me-workbench`（我的工作台）  
**项目类型**：单页应用 (SPA) + PWA  
**设计风格**：淡紫/蓝紫 Gemini 风格，毛玻璃效果，大圆角，柔和阴影  
**主要功能**：任务管理、学习课程、英语单词（FSRS 间隔重复）、日记笔记、用药提醒、副业追踪、每日复盘

### 功能模块速览

| 模块 | 路由 Tab | 核心功能 |
|------|---------|---------|
| 首页 | `dashboard` | 今日任务概览、快捷入口、治愈短句 |
| 工作 | `work` | 任务看板（CRUD/筛选/排序/状态流转）、工作小结 |
| 学习 | `study` | 课程管理、推荐书籍、学习时间统计、每日格言 |
| 英语 | `english` | FSRS 间隔重复单词学习、六级/考研词库 |
| 生活 | `life` | 日记·笔记（CRUD/置顶/收藏/标签/海报/搜索/日历） |
| 用药 | `medicine` | 每日打卡、药瓶管理、余量追踪、低量提醒、操作日志 |
| 副业 | `side` | 副业项目进度追踪 |
| 复盘 | `review` | 每日情绪 + 四维评分（体能/心力/脑力/情绪） |

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器 (PWA)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  React 18 SPA                       │  │
│  │  ┌─────────┐  ┌──────────────────────────────┐    │  │
│  │  │ App.jsx  │  │  Pages (8 个 Tab 页面)        │    │  │
│  │  │ (路由+   │  │  Dashboard / Work / Study    │    │  │
│  │  │  认证)   │  │  English / Life / Medicine    │    │  │
│  │  └─────────┘  │  SideWork / Review             │    │  │
│  │               └──────────────┬───────────────┘    │  │
│  │  ┌──────────────────────────┴──────────────────┐  │  │
│  │  │  Components (UI 库 + 业务组件)               │  │  │
│  │  │  Card / Button / Input / BottomSheet / ...  │  │  │
│  │  │  TaskBoard / WorkSummary / NoteCard / ...   │  │  │
│  │  └──────────────────────────┬──────────────────┘  │  │
│  │  ┌──────────────────────────┴──────────────────┐  │  │
│  │  │  Data Layer (db/)                            │  │  │
│  │  │  database.js (Supabase Client + API 模块)     │  │  │
│  │  │  auth.js (认证)                              │  │  │
│  │  │  medicineStore.js / englishStore.js (业务)    │  │  │
│  │  │  seed.js (种子数据)                           │  │  │
│  │  └──────────────────────────┬──────────────────┘  │  │
│  │  ┌──────────────────────────┴──────────────────┐  │  │
│  │  │  Hooks (useAsyncData)                        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                               │
└──────────────────────────┼───────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Supabase (BaaS)                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth     │  │ PostgreSQL   │  │ RLS (Row-Level   │  │
│  │ (邮箱+)  │  │ (数据存储)    │  │ Security)        │  │
│  │ 密码)    │  │              │  │                  │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**架构特点**：
- **纯前端 SPA**：所有页面逻辑在客户端运行，无服务端渲染
- **Supabase BaaS**：认证 + 数据库 + RLS 均由 Supabase 托管
- **API 直连**：前端通过 `@supabase/supabase-js` 直接调用 PostgREST API，无需中间层
- **可选 Express 后端**：`server/index.js` 提供独立的 REST API 作为备选方案
- **PWA 支持**：通过 `vite-plugin-pwa` 实现离线可用、桌面安装

---

## 3. 目录结构

```
me-workbench/
├── index.html                    # HTML 入口
├── package.json                  # 项目配置与依赖
├── vite.config.js                # Vite 构建配置（含 PWA）
├── tailwind.config.js            # TailwindCSS 主题配置
├── postcss.config.js             # PostCSS 配置
├── netlify.toml                  # Netlify 部署配置
│
├── public/                       # 静态资源
│   ├── favicon.svg
│   ├── icon-192.png / icon-512.png   # PWA 图标
│   ├── _redirects                # Cloudflare Pages 路由重定向
│   ├── migrate.html              # 数据迁移页面
│   └── migrate-medicine.html     # 用药数据迁移页面
│
├── src/                          # 源代码
│   ├── main.jsx                  # React 入口
│   ├── App.jsx                   # 根组件（路由 + 认证 + 布局）
│   ├── index.css                 # 全局样式 + Tailwind 指令
│   │
│   ├── db/                       # 数据层
│   │   ├── database.js           # Supabase 客户端 + 13 个 API 模块
│   │   ├── auth.js               # 认证模块（登录/注册/登出/会话）
│   │   ├── medicineStore.js      # 用药业务逻辑
│   │   ├── englishStore.js       # 英语 FSRS 调度（纯函数）
│   │   └── seed.js               # 种子数据初始化
│   │
│   ├── hooks/                    # 自定义 Hooks
│   │   └── useAsyncData.js       # 通用异步数据获取 Hook
│   │
│   ├── components/               # 组件
│   │   ├── ui/                   # UI 基础组件库
│   │   │   ├── index.jsx         # Card/Button/Input/Select/Toast/...
│   │   │   └── icons.jsx         # SVG 图标库 (90+ 图标)
│   │   └── work/                 # 工作模块组件
│   │       ├── TaskBoard.jsx     # 任务看板
│   │       └── WorkSummary.jsx   # 工作小结
│   │
│   └── pages/                    # 页面
│       ├── Dashboard.jsx         # 首页仪表盘
│       ├── Work.jsx              # 工作页
│       ├── Study.jsx             # 学习页
│       ├── English.jsx           # 英语学习页
│       ├── Life.jsx              # 生活页（日记·笔记）
│       ├── Medicine.jsx          # 用药提醒页
│       ├── SideWork.jsx          # 副业页
│       ├── Review.jsx            # 复盘页
│       ├── Login.jsx             # 登录/注册页
│       ├── healingQuotes.js      # 治愈短句数据
│       ├── life/                 # 生活子组件
│       │   ├── NoteCard.jsx      # 笔记卡片
│       │   ├── NoteEditor.jsx    # 笔记编辑器
│       │   ├── NoteCalendar.jsx  # 笔记日历
│       │   ├── NoteSearch.jsx    # 笔记搜索
│       │   ├── NotePoster.jsx    # 笔记海报
│       │   └── constants.js      # 心情/标签常量
│       └── study/                # 学习数据
│           ├── courses.js        # 摄影课程大纲
│           └── words/            # 词库 JSON
│               ├── cet6.json     # 六级核心词
│               └── kaoyan.json   # 考研高频词
│
├── supabase/                     # 数据库迁移
│   └── migrations/
│       ├── 20260728000000_init.sql           # 初始表（7 张）
│       ├── 20260728000001_medicine_tables.sql # 用药表（4 张）
│       ├── 20260801000001_work_enhance.sql    # 工作增强 + work_summaries
│       └── 20260816000000_english_tables.sql  # 英语卡片表
│
├── server/                       # Express 后端（备选）
│   └── index.js                  # REST API 服务（端口 3001）
│
├── scripts/                      # 工具脚本
│   ├── check-deploy.mjs
│   ├── gen-icons.mjs
│   ├── migrate-medicine.mjs
│   └── seed-supabase.mjs
│
└── tests/                        # 测试
    ├── englishStore.test.mjs     # 英语模块单元测试
    └── stress-test.mjs           # 数据库压力测试
```

---

## 4. 模块详解

### 4.1 入口与路由 (App.jsx)

**文件**：[src/App.jsx](file:///f:/Users/workbuddy/gongzuotai/src/App.jsx)

**职责**：应用根组件，负责认证状态管理、Tab 导航和页面路由。

**关键状态**：
| 状态 | 类型 | 说明 |
|------|------|------|
| `tab` | `string` | 当前选中的 Tab 标识符 |
| `user` | `object\|null` | 当前登录用户 |
| `authLoading` | `boolean` | 认证状态加载中 |

**Tab 配置**（`TABS` 常量）：
| Key | 标签 | 图标 | 组件 |
|-----|------|------|------|
| `dashboard` | 首页 | home | `<Dashboard>` |
| `work` | 工作 | briefcase | `<Work>` |
| `study` | 学习 | graduationCap | `<Study>` |
| `english` | 英语 | languages | `<English>` |
| `life` | 生活 | leaf | `<Life>` |
| `medicine` | 用药 | pill | `<Medicine>` |
| `side` | 副业 | rocket | `<SideWork>` |
| `review` | 复盘 | clipboardList | `<Review>` |

**认证流程**：
1. 组件挂载时调用 `getCurrentUser()` 获取当前会话
2. 监听 `onAuthStateChange` 实时同步认证状态
3. 未登录 → 渲染 `<Login>` 页面
4. 已登录 → 渲染主界面 + 调用 `initializeData()` 初始化种子数据

**布局结构**：
- 左侧固定窄侧边栏（移动端 `w-16`，桌面端 `w-20`）
- 主内容区自适应宽度（桌面端 `max-w-3xl` 居中）
- 移动端顶部栏 + 桌面端顶部栏（含成就徽章）

---

### 4.2 首页仪表盘 (Dashboard)

**文件**：[src/pages/Dashboard.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/Dashboard.jsx)

**职责**：展示今日概览、模块快捷入口、治愈短句和今日任务预览。

**关键数据**：
- 今日任务列表（通过 `tasksApi.getByDate(today)` 获取）
- 本周学习时长（通过 `studyRecordsApi.getByDates(weekDates)` 计算）
- 连续打卡天数（通过 `getStreakDays()` 计算）
- 治愈短句（按天轮换，可手动刷新）

**数据流**：
```
tasksApi.getByDate(today) → todayTasks → 统计 doneCount/totalCount
                                          → 渲染任务预览列表
                                          → getStreakDays() → streak

studyRecordsApi.getByDates(weekDates) → 累计学习分钟 → studyTime (小时)

全局事件 'app-data-changed' → refreshTasks()
```

---

### 4.3 工作模块 (Work)

**文件**：[src/pages/Work.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/Work.jsx)

**子组件**：
- [TaskBoard.jsx](file:///f:/Users/workbuddy/gongzuotai/src/components/work/TaskBoard.jsx) — 任务看板
- [WorkSummary.jsx](file:///f:/Users/workbuddy/gongzuotai/src/components/work/WorkSummary.jsx) — 工作小结

**两个 Tab**：任务列表 / 工作小结

#### TaskBoard（任务看板）

**核心功能**：
- 任务 CRUD（添加/编辑/删除）
- 状态流转：`todo` → `in_progress` → `done`（循环切换）
- 多维度筛选：状态 / 分类 / 优先级
- 排序：创建时间 / 截止日期 / 优先级 / 标题
- 视图切换：今日视图 / 全部视图
- 统计卡片：待办 / 进行中 / 已完成 计数

**关键状态**：
| 状态 | 说明 |
|------|------|
| `statusFilter` | 状态筛选：all / todo / in_progress / done |
| `categoryFilter` | 分类筛选：全部 / 工作 / 学习 / 生活 / 副业 |
| `priorityFilter` | 优先级筛选 |
| `sortBy` / `sortOrder` | 排序字段与方向 |
| `viewMode` | 视图模式：daily / all |

**数据流**：
```
tasksApi.getAll({ status, category, priority, sortBy, sortOrder })
  → displayList → 渲染任务卡片列表
  → 筛选/排序变化 → useAsyncData 自动重新获取

CRUD 操作 → tasksApi.add/update/delete → refresh() → 触发 'app-data-changed' 事件
```

#### WorkSummary（工作小结）

**核心功能**：
- 支持日小结 / 周小结 / 月小结 三种类型
- 结构化字段：内容、完成情况、问题、解决方案、计划
- 按 `(user_id, type, date)` 唯一约束 upsert

---

### 4.4 学习模块 (Study)

**文件**：[src/pages/Study.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/Study.jsx)

**分类**：全部 / 人事专业 / 超市经营 / 内心能量 / 人生智慧 / 摄影

**核心功能**：
- 课程列表（含进度条、章节大纲展开）
- 推荐书籍列表
- 本周学习时长统计 + 连续学习天数
- 每日精选格言（可刷新）
- 每日六级单词（含 Web Speech API 发音）

**数据源**：
- 课程数据 → `coursesApi.getAll(category)`
- 书籍数据 → `booksApi.getAll(category)`
- 学习记录 → `studyRecordsApi.getByDates(weekDates)`
- 课程大纲 → 本地常量 `COURSE_OUTLINES`（来自 `study/courses.js`）

**摄影课程**：`PHOTOGRAPHY_COURSES` (5 门) + `RESERVED_COURSES` (6 门备用)，课程基础信息存数据库，章节大纲为本地常量。

---

### 4.5 英语模块 (English)

**文件**：[src/pages/English.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/English.jsx)

**业务层**：[src/db/englishStore.js](file:///f:/Users/workbuddy/gongzuotai/src/db/englishStore.js)

**核心功能**：基于 FSRS (Free Spaced Repetition Scheduler) 的间隔重复单词学习系统。

**词库**：
- 六级核心 (`cet6`) — 来自 `study/words/cet6.json`
- 考研高频 (`kaoyan`) — 来自 `study/words/kaoyan.json`

**学习流程**：
1. 选择词库 → 系统自动筛选到期卡片 + 新词
2. 每轮学习 10 个新词（`NEW_PER_SESSION = 10`）
3. 看单词 → 点击揭示 → 回忆 → 四档评分（Again/Hard/Good/Easy）
4. FSRS 算法自动计算下次复习时间

**关键函数（englishStore.js）**：
| 函数 | 说明 |
|------|------|
| `newCard()` | 创建空白 FSRS 卡片 |
| `reviewCard(card, rating, now)` | 应用评分，返回更新后的卡片 |
| `previewRatings(card, now)` | 预览四档评分的下次复习时间 |
| `getDueCards(cards, now)` | 筛选到期卡片 |
| `countMastered(cards)` | 统计已掌握卡片数 |
| `serializeCard(card)` / `deserializeCard(s)` | Date ↔ 时间戳序列化 |
| `computeStreak(dates)` | 计算连续学习天数 |

**数据持久化**：
- 卡片状态（FSRS JSON）存 Supabase `english_cards` 表
- 通过 `englishCardsApi` 进行 CRUD
- 评分时 `serializeCard()` 将 Date 转为时间戳存入 JSONB

---

### 4.6 生活模块 (Life)

**文件**：[src/pages/Life.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/Life.jsx)

**子组件**：
- [NoteCard.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/life/NoteCard.jsx) — 笔记卡片（含置顶/收藏/标签/心情展示）
- [NoteEditor.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/life/NoteEditor.jsx) — 笔记编辑器
- [NoteCalendar.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/life/NoteCalendar.jsx) — 日历视图
- [NoteSearch.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/life/NoteSearch.jsx) — 全局搜索
- [NotePoster.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/life/NotePoster.jsx) — 海报生成（html-to-image）

**核心功能**：
- 按日期查看笔记
- 快速输入（短文本）或完整编辑
- 笔记属性：心情、标签、图片、置顶、收藏、归档
- 日期前后切换（不允许超过今天）
- 搜索：关键字 / 标签 / 心情 / 仅收藏
- 海报生成（html-to-image 截图）

**心情选项**（`constants.js`）：
| key | 标签 | 表情 |
|-----|------|------|
| happy | 开心 | 😊 |
| calm | 平淡 | 😌 |
| tired | 疲惫 | 😴 |
| healed | 治愈 | 🌿 |
| sad | 难过 | 🥲 |
| busy | 忙碌 | 😅 |

**预设标签**：出行、美食、感悟、居家、朋友、家人、工作、梦境

---

### 4.7 用药模块 (Medicine)

**文件**：[src/pages/Medicine.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/Medicine.jsx)  
**业务层**：[src/db/medicineStore.js](file:///f:/Users/workbuddy/gongzuotai/src/db/medicineStore.js)

**核心功能**：
- 每日打卡（大圆形按钮，点击标记已服药，再次点击取消）
- 补打卡（为过去日期补记）
- 连续打卡天数自动计算
- 药瓶管理：瓶号、余量、换新瓶
- 余量追踪 + 进度条
- 低量提醒（余量 ≤ 阈值时顶部橙色提示）
- 预估吃完日期
- 设置：单瓶颗数、每日剂量、低量阈值、提醒时间
- 历史记录三 Tab：打卡记录 / 瓶次记录 / 操作日志
- 数据导出（exportData）

**数据表**（4 张）：
| 表 | 说明 |
|----|------|
| `medicine_state` | 当前药瓶状态，每用户单行 |
| `medicine_checkins` | 打卡日集合，`(user_id, date)` 唯一 |
| `medicine_bottles` | 瓶次历史 |
| `medicine_logs` | 操作日志（取最近 200 条） |

**关键业务函数（medicineStore.js）**：
| 函数 | 说明 |
|------|------|
| `getState()` | 获取当前状态（含默认值 + 字段校验） |
| `checkinToday()` | 今日打卡（扣减剂量、记录打卡、写日志） |
| `makeupCheckin(date)` | 补打卡 |
| `uncheckinToday()` | 取消今日打卡（恢复剂量） |
| `setRemainingPills(count)` | 修改余量 |
| `switchToNextBottle()` | 换新瓶（完成当前瓶、瓶号+1、余量重置） |
| `updateSettings(patch)` | 更新设置（含字段校验） |
| `estimateFinishDate(state, checkedToday)` | 预估吃完日期 |
| `isLowSupply(state)` | 是否低量 |
| `computeStreak(checkins)` | 计算连续打卡天数 |
| `exportData()` | 导出全部用药数据 |

---

### 4.8 副业模块 (SideWork)

**文件**：[src/pages/SideWork.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/SideWork.jsx)

**核心功能**：
- 副业项目 CRUD
- 5 类预设分类：自媒体 / 电商 / 技能 / 投资 / 其他
- 进度滑块（RangeSlider 0-100%）
- 平均进度统计

**数据表**：`side_projects`

---

### 4.9 复盘模块 (Review)

**文件**：[src/pages/Review.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/Review.jsx)

**核心功能**：
- 每日情绪选择：低落 / 平淡 / 不错 / 开心 / 超赞
- 四维评分（0-10 滑块）：
  - 体能 (physical) — 电池图标
  - 心力 (mental) — 心率图标
  - 脑力 (intellectual) — 大脑图标
  - 情绪 (emotional) — 笑脸图标
- 今日任务完成情况
- 连续复盘天数
- 自动保存（review 数据变化时 upsert）

**数据表**：`reviews`（`(user_id, date)` 唯一）

---

### 4.10 登录模块 (Login)

**文件**：[src/pages/Login.jsx](file:///f:/Users/workbuddy/gongzuotai/src/pages/Login.jsx)

**功能**：
- 邮箱 + 密码登录/注册
- 注册邮箱验证（Supabase Auth 邮件确认）
- 错误信息中文化
- 登录后自动认领历史匿名数据（`claimLegacyData()`）

**认证函数**（`auth.js`）：
| 函数 | 说明 |
|------|------|
| `signUp(email, password)` | 注册 |
| `signIn(email, password)` | 登录 |
| `signOut()` | 登出 |
| `getCurrentUser()` | 获取当前用户 |
| `onAuthStateChange(callback)` | 监听认证状态变化 |
| `claimLegacyData()` | 认领 `user_id IS NULL` 的历史数据 |

---

## 5. 数据层

### 5.1 Supabase 客户端

**文件**：[src/db/database.js](file:///f:/Users/workbuddy/gongzuotai/src/db/database.js)

```js
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})
```

**工具函数**：
| 函数 | 说明 |
|------|------|
| `uid()` | 获取当前用户 ID（内部使用，未登录抛错） |
| `todayStr()` | 返回今日日期字符串 `YYYY-MM-DD`（本地时区） |
| `formatDateCN(dateStr)` | 格式化为中文日期（如 "8月16日 周六"） |
| `formatDateShort(dateStr)` | 格式化为短日期（如 "8月16日"） |
| `getWeekDates()` | 返回本周 7 天日期数组 |
| `getStreakDays(records, field)` | 计算连续打卡天数 |
| `toDbRow(data)` | camelCase → snake_case 字段名转换 |

### 5.2 认证模块

**文件**：[src/db/auth.js](file:///f:/Users/workbuddy/gongzuotai/src/db/auth.js)

基于 Supabase Auth，Session 持久化在 localStorage。支持：
- 邮箱密码注册/登录
- Session 自动刷新
- 认证状态监听
- 历史数据认领（`claim_legacy_data` RPC 函数）

### 5.3 API 模块一览

所有 API 模块均在 [src/db/database.js](file:///f:/Users/workbuddy/gongzuotai/src/db/database.js) 中定义，每个操作都携带 `user_id` 进行 RLS 隔离。

| 模块 | 数据表 | 主要方法 |
|------|--------|---------|
| `tasksApi` | `tasks` | `getByDate`, `getAll`, `getByDateRange`, `add`, `update`, `updateStatus`, `delete` |
| `workSummariesApi` | `work_summaries` | `getByDate`, `getByPeriod`, `getAll`, `upsert`, `delete` |
| `coursesApi` | `courses` | `getAll`, `add`, `update`, `delete` |
| `reviewsApi` | `reviews` | `getByDate`, `getAll`, `upsert` |
| `studyRecordsApi` | `study_records` | `getByDates`, `add` |
| `booksApi` | `books` | `getAll`, `add` |
| `lifeRecordsApi` | `life_records` | `getByDate`, `search`, `add`, `update`, `delete`, `togglePin`, `toggleFavorite`, `toggleArchive` |
| `sideProjectsApi` | `side_projects` | `getAll`, `add`, `update`, `delete` |
| `medicineStateApi` | `medicine_state` | `get`, `upsert` |
| `medicineCheckinsApi` | `medicine_checkins` | `getAll`, `add`, `remove` |
| `medicineBottlesApi` | `medicine_bottles` | `getAll`, `add`, `finish` |
| `medicineLogsApi` | `medicine_logs` | `getAll`, `add` |
| `englishCardsApi` | `english_cards` | `getByBook`, `getDue`, `add`, `update`, `delete` |

### 5.4 业务 Store

#### medicineStore.js

**文件**：[src/db/medicineStore.js](file:///f:/Users/workbuddy/gongzuotai/src/db/medicineStore.js)

用药模块的业务逻辑层，依赖 `database.js` 中的 4 个 Medicine API。提供纯函数 + 异步操作：

- 状态读写（getState / saveState）
- 打卡操作（checkinToday / makeupCheckin / uncheckinToday）
- 药瓶管理（switchToNextBottle / setBottleNumber）
- 余量管理（setRemainingPills / estimateFinishDate / isLowSupply）
- 设置管理（updateSettings）
- 数据导出（exportData）

#### englishStore.js

**文件**：[src/db/englishStore.js](file:///f:/Users/workbuddy/gongzuotai/src/db/englishStore.js)

英语 FSRS 业务逻辑层，**纯函数设计，不依赖 Supabase**，可独立测试。

- 依赖 `ts-fsrs` 库实现 FSRS 算法
- 提供卡片创建、评分、调度、序列化等纯函数
- 数据读写由 `English.jsx` 组合 `englishCardsApi` 完成

### 5.5 种子数据

**文件**：[src/db/seed.js](file:///f:/Users/workbuddy/gongzuotai/src/db/seed.js)

`initializeData()` 函数在用户首次登录后调用，用于初始化示例数据。

**初始化策略**：
- 检查课程表是否为空 → 判断是否首次初始化
- 首次初始化：写入任务、课程、书籍、复盘、学习记录、生活记录、副业项目
- 老用户：增量补充摄影课程（缺失则插入）

**种子数据包含**：
- 7 条示例任务（工作、学习、副业、生活）
- 4 门基础课程 + 5 门摄影课程
- 3 本推荐书籍
- 2 条学习记录
- 2 条生活记录
- 2 个副业项目
- 2 条复盘记录

### 5.6 自定义 Hook

#### useAsyncData

**文件**：[src/hooks/useAsyncData.js](file:///f:/Users/workbuddy/gongzuotai/src/hooks/useAsyncData.js)

通用的异步数据获取 Hook，替代 Dexie 的 `useLiveQuery`。

```js
const { data, loading, error, refresh } = useAsyncData(fetcher, deps)
```

**参数**：
- `fetcher`: 异步函数，返回 Promise
- `deps`: 依赖数组，变化时重新获取

**返回值**：
- `data`: 获取到的数据
- `loading`: 加载状态
- `error`: 错误对象
- `refresh`: 手动刷新函数

**全局刷新机制**：
- `triggerGlobalRefresh()` — 触发所有监听器
- `useGlobalRefresh(callback)` — 注册全局刷新监听

---

## 6. UI 组件库

**文件**：[src/components/ui/index.jsx](file:///f:/Users/workbuddy/gongzuotai/src/components/ui/index.jsx)  
**图标**：[src/components/ui/icons.jsx](file:///f:/Users/workbuddy/gongzuotai/src/components/ui/icons.jsx)

### 组件清单

| 组件 | 说明 |
|------|------|
| `Card` | 毛玻璃卡片容器 |
| `PageHeader` | 页面顶部渐变标题栏（8 种 accent） |
| `Button` | 按钮（5 种 variant：primary/secondary/ghost/danger/outline） |
| `Input` | 输入框（含 label/error/hint/icon） |
| `Textarea` | 多行文本输入 |
| `Select` | 下拉选择 |
| `Chip` / `ChipGroup` | 标签/分类选择（支持 8 种颜色） |
| `EmptyState` | 空状态占位 |
| `LoadingState` | 加载中状态 |
| `ErrorState` | 错误状态（含重试按钮） |
| `BottomSheet` | 底部弹出层（毛玻璃风格） |
| `ProgressBar` | 进度条（8 种渐变色） |
| `RangeSlider` | 范围滑块 |
| `Stat` | 统计卡片（标签/数值/单位/图标/趋势） |
| `Badge` | 徽章标签（10 种颜色） |
| `SectionHeader` | 区块标题 |
| `ToastContainer` / `showToast` | 全局 Toast 提示 |
| `ConfirmDialog` | 确认弹窗 |

### 图标库

**Icon** 组件支持 90+ 图标，参考 Lucide 风格（24x24 viewBox，stroke 1.75px）。  
**IconFilled** 组件支持填充态图标（用于 Tab 激活态等）。

图标分类：
- 导航/Tab：home, briefcase, graduationCap, leaf, pill, rocket, clipboardList, notebookPen
- 通用操作：plus, search, bell, trash, x, check, edit, settings, calendar, clock, ...
- 状态：checkCircle, circle, alertCircle, info, loader, ...
- 功能：volume2, camera, image, heart, star, bookmark, flame, trendingUp, ...

---

## 7. 数据库设计

### 7.1 迁移文件总览

| 迁移文件 | 创建的表 |
|---------|---------|
| `20260728000000_init.sql` | tasks, courses, reviews, study_records, books, life_records, side_projects (7 张) |
| `20260728000001_medicine_tables.sql` | medicine_state, medicine_checkins, medicine_bottles, medicine_logs (4 张) |
| `20260801000001_work_enhance.sql` | 扩展 tasks（description/status/deadline/user_id）, 新建 work_summaries |
| `20260816000000_english_tables.sql` | english_cards (1 张) |

### 7.2 数据表 ER 概要

```
┌──────────────────────────────────────────────────────────────┐
│  auth.users                                                  │
│  ┌──────────┐                                                │
│  │ id (PK)  │◄──────────────────────────────────────┐       │
│  └──────────┘                                        │       │
│        │                                              │       │
│        │ user_id (FK, ON DELETE CASCADE)              │       │
│        ▼                                              │       │
│  ┌───────────────┐  ┌──────────────────┐             │       │
│  │ tasks         │  │ work_summaries   │             │       │
│  │───────────────│  │──────────────────│             │       │
│  │ id (PK)       │  │ id (PK)          │             │       │
│  │ user_id (FK)  │  │ user_id (FK)     │             │       │
│  │ title         │  │ type (daily/     │             │       │
│  │ description   │  │   weekly/monthly)│             │       │
│  │ status        │  │ date             │             │       │
│  │ priority      │  │ content          │             │       │
│  │ category      │  │ completion       │             │       │
│  │ deadline      │  │ problems         │             │       │
│  │ date          │  │ solutions        │             │       │
│  │ time          │  │ plan             │             │       │
│  │ done          │  │ UNIQUE(user_id,  │             │       │
│  │ created_at    │  │   type, date)    │             │       │
│  └───────────────┘  └──────────────────┘             │       │
│                                                       │       │
│  ┌───────────────┐  ┌──────────────────┐             │       │
│  │ courses       │  │ study_records    │             │       │
│  │───────────────│  │──────────────────│             │       │
│  │ id (PK)       │  │ id (PK)          │             │       │
│  │ user_id (FK)  │  │ user_id (FK)     │             │       │
│  │ title         │  │ date             │             │       │
│  │ instructor    │  │ duration         │             │       │
│  │ totalLessons  │  │ category         │             │       │
│  │ currentLessons│  │ created_at       │             │       │
│  │ category      │  └──────────────────┘             │       │
│  │ progress      │                                    │       │
│  └───────────────┘  ┌──────────────────┐             │       │
│                      │ books            │             │       │
│  ┌───────────────┐  │──────────────────│             │       │
│  │ reviews       │  │ id (PK)          │             │       │
│  │───────────────│  │ user_id (FK)     │             │       │
│  │ id (PK)       │  │ title            │             │       │
│  │ user_id (FK)  │  │ author           │             │       │
│  │ date          │  │ category         │             │       │
│  │ mood          │  │ recommended      │             │       │
│  │ physical      │  └──────────────────┘             │       │
│  │ mental        │                                    │       │
│  │ intellectual  │  ┌──────────────────┐             │       │
│  │ emotional     │  │ life_records     │             │       │
│  │ completion    │  │──────────────────│             │       │
│  │ UNIQUE(date)  │  │ id (PK)          │             │       │
│  └───────────────┘  │ user_id (FK)     │             │       │
│                      │ date             │             │       │
│  ┌───────────────┐  │ type             │             │       │
│  │ side_projects │  │ content          │             │       │
│  │───────────────│  │ mood             │             │       │
│  │ id (PK)       │  │ tags             │             │       │
│  │ user_id (FK)  │  │ pinned           │             │       │
│  │ title         │  │ favorited        │             │       │
│  │ category      │  │ archived         │             │       │
│  │ progress      │  │ created_at       │             │       │
│  └───────────────┘  └──────────────────┘             │       │
│                                                       │       │
│  ┌──────────────────┐  ┌──────────────────┐          │       │
│  │ medicine_state   │  │ medicine_checkins │          │       │
│  │──────────────────│  │──────────────────│          │       │
│  │ id (PK)          │  │ id (PK)          │          │       │
│  │ user_id (FK)     │  │ user_id (FK)     │          │       │
│  │ bottle_number    │  │ date             │          │       │
│  │ remaining_pills  │  │ dose             │          │       │
│  │ pills_per_bottle │  │ is_makeup        │          │       │
│  │ daily_dose       │  │ UNIQUE(user_id,  │          │       │
│  │ reminder_time    │  │   date)          │          │       │
│  │ low_threshold    │  └──────────────────┘          │       │
│  │ UNIQUE(user_id)  │                                │       │
│  └──────────────────┘  ┌──────────────────┐          │       │
│                         │ medicine_bottles │          │       │
│  ┌──────────────────┐  │──────────────────│          │       │
│  │ medicine_logs    │  │ id (PK)          │          │       │
│  │──────────────────│  │ user_id (FK)     │          │       │
│  │ id (PK)          │  │ bottle_number    │          │       │
│  │ user_id (FK)     │  │ started_at       │          │       │
│  │ date             │  │ finished_at      │          │       │
│  │ action           │  │ total_pills     │          │       │
│  │ note             │  └──────────────────┘          │       │
│  │ timestamp        │                                │       │
│  └──────────────────┘  ┌──────────────────┐          │       │
│                         │ english_cards    │          │       │
│                         │──────────────────│          │       │
│                         │ id (PK)          │          │       │
│                         │ user_id (FK)     │          │       │
│                         │ word             │          │       │
│                         │ book             │          │       │
│                         │ fsrs_state (JSONB)│         │       │
│                         │ due              │          │       │
│                         │ lapses           │          │       │
│                         │ last_review      │          │       │
│                         │ UNIQUE(user_id,  │          │       │
│                         │   word)          │          │       │
│                         └──────────────────┘          │       │
│                                                       │       │
│  所有表均启用 RLS，策略: auth.uid() = user_id          │       │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. 部署与运行

### 8.1 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（仅前端）
npm run dev
# → http://localhost:5173

# 同时启动前端 + Express 后端
npm run dev:all
# → 前端 http://localhost:5173
# → 后端 http://localhost:3001

# 运行测试
npm test                    # 英语模块单元测试
npm run stress-test         # 数据层压力测试
```

### 8.2 构建与部署

```bash
# 生产构建
npm run build
# → 输出到 dist/

# 部署到 Cloudflare Pages
npm run deploy:cf

# 预览构建结果
npm run preview
# → http://localhost:4173
```

**部署平台**：
- **Cloudflare Pages**：`CF_PAGES=1` 时 base 为 `/`
- **GitHub Pages**：base 为 `/me/`
- **Netlify**：`netlify.toml` 配置 SPA 路由重定向

**PWA 配置**：
- 主题色：`#7EB6E6`
- 背景色：`#F0F7FF`
- 显示模式：`standalone`
- 方向：`portrait`
- Workbox 缓存策略：`**/*.{js,css,html,ico,png,svg,woff2}`

### 8.3 Express 后端（可选）

**文件**：[server/index.js](file:///f:/Users/workbuddy/gongzuotai/server/index.js)

独立的 Express REST API 服务，直接连接 Supabase PostgreSQL（通过 `postgres` 库）。

**端点**：
- `GET /api/health` — 健康检查
- `GET/POST/PUT/DELETE /api/tasks` — 任务 CRUD
- `GET/POST/PUT/DELETE /api/courses` — 课程 CRUD
- `GET/POST /api/reviews` — 复盘读写
- `GET/POST /api/study-records` — 学习记录
- `GET/POST /api/books` — 书籍
- `GET/POST/DELETE /api/life-records` — 生活记录
- `GET/POST/PUT/DELETE /api/side-projects` — 副业项目

**注意**：Express 后端是备选方案，前端主要使用 Supabase 直连。Express 中的表结构与 Supabase 迁移不完全一致（缺少 `user_id`）

---

## 9. 依赖关系

### 9.1 生产依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `react` | ^18.3.1 | UI 框架 |
| `react-dom` | ^18.3.1 | React DOM 渲染 |
| `@supabase/supabase-js` | ^2.110.9 | Supabase 客户端（认证 + 数据库） |
| `ts-fsrs` | ^5.4.1 | FSRS 间隔重复算法（英语学习） |
| `html-to-image` | ^1.11.13 | 笔记海报生成（DOM → 图片） |
| `express` | ^5.2.1 | 备选后端服务器 |
| `cors` | ^2.8.6 | Express CORS 中间件 |
| `postgres` | ^3.4.9 | PostgreSQL 客户端（Express 后端） |
| `dexie` | ^4.0.8 | IndexedDB 封装（**已安装但未使用**） |
| `dexie-react-hooks` | ^1.1.7 | Dexie React Hooks（**已安装但未使用**） |

### 9.2 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `vite` | ^5.4.8 | 构建工具 |
| `@vitejs/plugin-react` | ^4.3.1 | Vite React 插件 |
| `tailwindcss` | ^3.4.13 | CSS 框架 |
| `postcss` | ^8.4.47 | CSS 处理 |
| `autoprefixer` | ^10.4.20 | CSS 自动前缀 |
| `vite-plugin-pwa` | ^0.20.5 | PWA 支持 |
| `concurrently` | ^10.0.4 | 并行运行开发服务器 |
| `jimp` | ^1.6.1 | 图片处理（图标生成脚本） |
| `fake-indexeddb` | ^6.0.0 | IndexedDB 模拟（测试用） |

---

## 10. 附录

### A. 关键文件索引

| 文件 | 功能 | 行数 |
|------|------|------|
| `src/App.jsx` | 根组件，路由与认证 | 304 |
| `src/db/database.js` | Supabase 客户端 + 13 个 API 模块 | 495 |
| `src/db/auth.js` | 认证模块 | 80 |
| `src/db/medicineStore.js` | 用药业务逻辑 | 324 |
| `src/db/englishStore.js` | 英语 FSRS 纯函数 | 130 |
| `src/db/seed.js` | 种子数据初始化 | 121 |
| `src/components/ui/index.jsx` | UI 组件库（20+ 组件） | 444 |
| `src/components/ui/icons.jsx` | 图标库（90+ 图标） | 165 |
| `src/components/work/TaskBoard.jsx` | 任务看板 | 474 |
| `src/pages/Dashboard.jsx` | 首页仪表盘 | 202 |
| `src/pages/Study.jsx` | 学习模块 | 395 |
| `src/pages/English.jsx` | 英语学习 | ~400 |
| `src/pages/Medicine.jsx` | 用药提醒 | ~400 |
| `src/pages/Life.jsx` | 生活笔记 | ~300 |
| `src/pages/Review.jsx` | 每日复盘 | ~200 |
| `server/index.js` | Express 后端 | 374 |
| `supabase/migrations/20260728000000_init.sql` | 初始表迁移 | 98 |

### B. 全局事件与约定

**全局事件**：
- `app-data-changed` — 任何 CRUD 操作后触发，Dashboard 等组件监听此事件刷新数据

**命名约定**：
- 数据库字段：snake_case（PostgreSQL 标准）
- JavaScript 对象：camelCase（`toDbRow` / `snakeToCamel` 转换）
- 组件文件：PascalCase（`TaskBoard.jsx`）
- API 模块：camelCase 后缀 `Api`（`tasksApi`）

**数据安全**：
- 所有 Supabase 表启用 RLS
- 策略规则：`auth.uid() = user_id`（用户只能操作自己的数据）
- 用药模块额外使用 `(user_id)` 或 `(user_id, date)` 唯一约束防止重复

**状态管理**：
- 无全局状态管理库（Redux/Zustand 等）
- 各页面组件通过 `useAsyncData` 自行管理数据状态
- 全局刷新通过 `window.dispatchEvent('app-data-changed')` 实现跨组件通信
- Toast 通过发布订阅模式（`showToast` / `ToastContainer`）实现全局提示