# 我的工作台 (Me Workbench) — Code Wiki

> 个人移动工作台 PWA · 每天都能用的效率工具  
> 技术栈：React 18 + Vite 5 + TailwindCSS + Supabase  
> 文档生成日期：2026-08-16 · **最近更新：2026-10-26**

**2026-10-26 更新摘要**
- 生活模块重构：日记·笔记 → 每日记录 / 每周复盘 / 随笔 / **认知重塑**（4 个子 Tab）
- 新增 `src/utils/cognitionEngine.js` 认知扭曲检测引擎（Burns 15 项 + Sanctum TR 7 栏 + 去灾难化）
- 用药模块支持**多瓶并行**打卡（`medicine_state.bottles` 数组）与「开新瓶」
- 新增 `daily_records` / `weekly_reviews` / `cognition_entries` / `cognition_feedbacks` 四张表
- 补齐 `20261026000000_cognition_tables.sql` 迁移（此前两张认知表未纳入版本管理）
- 数据层 API 模块数 13 → 17

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
**主要功能**：任务管理、学习课程、英语单词（FSRS 间隔重复）、生活记录与认知重塑、用药提醒（多瓶并存）、副业追踪、每日复盘

### 功能模块速览

| 模块 | 路由 Tab | 核心功能 |
|------|---------|---------|
| 首页 | `dashboard` | 今日任务概览、快捷入口、治愈短句 |
| 工作 | `work` | 任务看板（CRUD/筛选/排序/状态流转）、工作小结 |
| 学习 | `study` | 课程管理、推荐书籍、学习时间统计、每日格言 |
| 英语 | `english` | FSRS 间隔重复单词学习、六级/考研词库 |
| 生活 | `life` | 4 子 Tab：每日记录 / 每周复盘 / 随笔 / 认知重塑 |
| 用药 | `medicine` | 每日打卡、多瓶并行、余量追踪、低量提醒、操作日志 |
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
│  │  │  medicineStore.js / englishStore.js /      │  │  │
│  │  │  lifeStore.js (业务纯函数)                    │  │  │
│  │  │  seed.js (种子数据)                           │  │  │
│  │  └──────────────────────────┬──────────────────┘  │  │
│  │  ┌──────────────────────────┴──────────────────┐  │  │
│  │  │  Utils (纯函数)                              │  │  │
│  │  │  cognitionEngine.js (认知扭曲检测)            │  │  │
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
│   │   ├── database.js           # Supabase 客户端 + 17 个 API 模块
│   │   ├── auth.js               # 认证模块（登录/注册/登出/会话）
│   │   ├── medicineStore.js      # 用药业务逻辑（多瓶并行）
│   │   ├── englishStore.js       # 英语 FSRS 调度（纯函数）
│   │   ├── lifeStore.js          # 生活模块业务逻辑（纯函数，可单测）
│   │   └── seed.js               # 种子数据初始化
│   │
│   ├── utils/                    # 纯函数工具
│   │   └── cognitionEngine.js    # 认知扭曲检测引擎（648 行，纯函数）
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
│       ├── Life.jsx              # 生活页（4 子 Tab 容器，63 行）
│       ├── Medicine.jsx          # 用药提醒页
│       ├── SideWork.jsx          # 副业页
│       ├── Review.jsx            # 复盘页
│       ├── Login.jsx             # 登录/注册页
│       ├── healingQuotes.js      # 治愈短句数据
│       ├── life/                 # 生活子组件（4 个 Tab + 共用编辑器）
│       │   ├── DailyTab.jsx      # 每日记录（完成事项/投入时长/情绪/精力/支出/明日任务）
│       │   ├── DailyEditor.jsx   # 每日记录编辑表单
│       │   ├── WeeklyTab.jsx     # 每周复盘（亮点/问题模式/改进）
│       │   ├── NotesTab.jsx      # 随笔列表
│       │   ├── CognitionTab.jsx  # 认知重塑（输入 → 引擎分析 → 反馈落库）
│       │   ├── FeedbackCard.jsx  # 认知反馈展示卡（扭曲/证据/视角/重构/追问）
│       │   ├── CognitionInsight.jsx # 认知历史统计（高频偏差/分数趋势）
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
│       ├── 20260728000000_init.sql            # 初始表（7 张）
│       ├── 20260728000001_medicine_tables.sql # 用药表（4 张）
│       ├── 20260801000001_work_enhance.sql    # 工作增强 + work_summaries
│       ├── 20260816000000_english_tables.sql  # 英语卡片表
│       ├── 20260816000001_life_module_tables.sql # daily_records + weekly_reviews
│       └── 20261026000000_cognition_tables.sql   # 认知重塑两表（补录）
│
├── server/                       # Express 后端（备选）
│   └── index.js                  # REST API 服务（端口 3001）
│
├── scripts/                      # 工具脚本
│   ├── check-deploy.mjs
│   ├── gen-icons.mjs
│   ├── migrate-medicine.mjs
│   ├── perf_test.mjs / .py
│   └── seed-supabase.mjs
│
└── tests/                        # 测试（node --test）
    ├── englishStore.test.mjs     # 英语模块单元测试
    ├── lifeStore.test.mjs        # 生活模块单元测试
    └── stress-test.mjs           # 数据库压力测试
```

> **未纳入版本管理**：`trust-query-h5/`（独立 H5 单页，与 PWA 无关）、`招行云信托流程.docx`、`deck.pptx`、`trae-work-教学.pptx` 均为独立产物。

---

## 4. 模块详解

### 4.1 入口与路由 (App.jsx)

**文件**：[src/App.jsx](file:///F:/14143/trae%20work/gongzuotai/src/App.jsx)

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

**文件**：[src/pages/Dashboard.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/Dashboard.jsx)

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

**文件**：[src/pages/Work.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/Work.jsx)

**子组件**：
- [TaskBoard.jsx](file:///F:/14143/trae%20work/gongzuotai/src/components/work/TaskBoard.jsx) — 任务看板
- [WorkSummary.jsx](file:///F:/14143/trae%20work/gongzuotai/src/components/work/WorkSummary.jsx) — 工作小结

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

**文件**：[src/pages/Study.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/Study.jsx)

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

**文件**：[src/pages/English.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/English.jsx)

**业务层**：[src/db/englishStore.js](file:///F:/14143/trae%20work/gongzuotai/src/db/englishStore.js)

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

**容器**：[src/pages/Life.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/Life.jsx) — 仅 63 行，只负责 4 个子 Tab 切换与懒挂载
**业务层**：[src/db/lifeStore.js](file:///F:/14143/trae%20work/gongzuotai/src/db/lifeStore.js) — 纯函数，不依赖 Supabase，可单测
**分析引擎**：[src/utils/cognitionEngine.js](file:///F:/14143/trae%20work/gongzuotai/src/utils/cognitionEngine.js)

生活模块在 2026-09 前后做过一次重构：原先的「日记·笔记」被拆成四个职责清晰的子 Tab。

| 子 Tab | 组件 | 数据表 | 说明 |
|--------|------|--------|------|
| 每日记录 | `DailyTab.jsx` + `DailyEditor.jsx` | `daily_records` | 每用户每天一条，`(user_id, date)` 唯一 |
| 每周复盘 | `WeeklyTab.jsx` | `weekly_reviews` | 每用户每周一条，`week_start` 为周一日期 |
| 随笔 | `NotesTab.jsx` + `Note*.jsx` | `life_records` | 原笔记功能完整保留 |
| 认知重塑 | `CognitionTab.jsx` + `FeedbackCard.jsx` + `CognitionInsight.jsx` | `cognition_entries` / `cognition_feedbacks` | 本地规则引擎分析，无需 LLM |

#### 每日记录

字段：完成事项（`done_items` 多行文本）、有效投入时长（`focus_hours` 小数小时）、情绪（`mood`，5 档）、精力（`energy` 1-5）、支出明细（`expenses` JSONB 数组 `[{desc, amount, category}]`）、明日最重要的一件事（`tomorrow_task`）。

情绪档位（`lifeStore.MOODS`）：

| key | 标签 | 表情 |
|-----|------|------|
| great | 很棒 | 😄 |
| good | 不错 | 🙂 |
| ok | 一般 | 😐 |
| low | 低落 | 😔 |
| bad | 很差 | 😞 |

精力档位（1-5）：疲惫 / 较低 / 一般 / 充沛 / 满格。

#### 每周复盘

三个纯文本核心字段：`highlights`（本周亮点）、`problems`（反复出现的问题与模式）、`improvement`（下周计划改进的一件小事）。按 `week_start`（周一日期）upsert。

#### 随笔（原笔记系统）

- 按日期查看、快速输入或完整编辑
- 属性：心情、标签、图片、置顶、收藏、归档
- 搜索：关键字 / 标签 / 心情 / 仅收藏
- 海报生成（`html-to-image` 截图）
- 心情选项来自 `life/constants.js`（happy/calm/tired/healed/sad/busy 六档，**与每日记录的 5 档 mood 是两套独立定义**，不要混用）
- 预设标签：出行、美食、感悟、居家、朋友、家人、工作、梦境

#### 认知重塑

这是生活模块里技术含量最高的部分：一个**纯前端、无 LLM 依赖**的认知扭曲检测引擎，输入一段 ≥15 字的心情记录，秒级返回结构化批判性反馈。

**设计原则**（写在 `cognitionEngine.js` 头部注释里，改动前请先读）：
- 不讨好 — 不使用「你很棒 / 你已经很好了」这类安抚话术
- 客观 — 基于文本证据推导，不无端共情
- 有批判性 — 直接指出认知漏洞，不模糊处理
- 可执行 — 指出问题后给可操作的思考工具

**三个对齐来源**（刻意不重复造轮子）：

| 来源 | 贡献 |
|------|------|
| Burns《Feeling Good》(1980) | 15 项权威认知扭曲分类及检测正则 |
| GitHub CBT App「Sanctum」`thought_record.dart` | Thought Record 7 栏结构 + 苏格拉底 6 问模板 |
| MoodJam / Quirk（开源） | Decatastrophizing 去灾难化三步法 |

**分析流水线**：`analyzeReflection(text, { mood, category })` → 纯同步函数 → 返回：

| 字段 | 类型 | 说明 |
|------|------|------|
| `biases` | array | 命中的扭曲 `[{key, name, severity, desc, evidence, source}]` |
| `evidence` | object | `{ support: [], against: [] }` 支持/反驳证据 |
| `perspectives` | array | 替代视角列表 |
| `reframe` | string | 认知重构后的表述 |
| `challenges` | array | 苏格拉底追问 |
| `summary` | string | 一句话总评 |
| `score` | number | 思辨得分，用于历史趋势 |
| `rawAnalysis` | string | 引擎原始输出 |

典型流程（`CognitionTab.jsx`）：先 `cognitionEntriesApi.add()` 落库拿到 `entryId` → 同步跑引擎 → `cognitionFeedbacksApi.upsert(entryId, result)` 按 `entry_id` 覆盖写入 → 广播 `app-data-changed`。重新生成走 `Promise.all` 并行更新条目与反馈（2 次 RTT 压到 1 次）。

**分类**：general 通用想法 / work 工作困扰 / relationship 人际关系 / self-growth 自我成长 / emotion 情绪波动 / decision 抉择纠结
**情绪维度**：anxious / sad / angry / confused / ashamed / hurt / fear / calm（比随笔的情绪选项更偏自省场景）

`CognitionInsight.jsx` 读取 `cognitionFeedbacksApi.getAll()`（带 `cognition_entries!inner(date, category)` 关联）做历史统计：高频偏差、分数趋势。

---

### 4.7 用药模块 (Medicine)

**文件**：[src/pages/Medicine.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/Medicine.jsx)  
**业务层**：[src/db/medicineStore.js](file:///F:/14143/trae%20work/gongzuotai/src/db/medicineStore.js)

**核心功能**：
- 每日打卡（大圆形按钮，点击标记已服药，再次点击取消）
- 补打卡（为过去日期补记）
- 连续打卡天数自动计算
- **多瓶并存**：不强制吃完旧瓶即可「开新瓶」；旧瓶仍有余量则保留为进行中，可随时「切换打卡瓶」回来（打卡始终记在当前活跃瓶上）
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
| `medicine_state` | 当前活跃瓶状态，每用户单行 |
| `medicine_checkins` | 打卡日集合，`(user_id, date)` 唯一 |
| `medicine_bottles` | 瓶次历史，每瓶一行（含 `remaining_pills` / `finished_at`） |
| `medicine_logs` | 操作日志（取最近 200 条） |

> 多瓶模型的关键约定：`medicine_state.bottle_number` 只是「当前在打哪一瓶」的游标，真正的每瓶余量存在 `medicine_bottles.remaining_pills`。切换活跃瓶前必须把当前瓶余量写回 `medicine_bottles`，否则数据会漂移——`openNewBottle()` 和 `switchActiveBottle()` 都遵守这个顺序。

**关键业务函数（medicineStore.js）**：
| 函数 | 说明 |
|------|------|
| `getState()` | 获取当前状态（含默认值 + `clampInt` 字段范围校验） |
| `checkinToday()` | 今日打卡（扣减活跃瓶剂量、记录打卡、写日志） |
| `makeupCheckin(date)` | 补打卡 |
| `uncheckinToday()` | 取消今日打卡（恢复剂量） |
| `getBottles()` | 全部瓶次记录（含进行中） |
| `setRemainingPills(count)` | 修改当前瓶余量 |
| `openNewBottle()` | 开新瓶：旧瓶余量回写 → 余量为 0 则标记完成 → 新建瓶号 = max+1 → 游标指过去 |
| `switchActiveBottle(n)` | 切换打卡瓶（拒绝已吃完的瓶） |
| `setBottleNumber(num)` | 直接指定瓶号 |
| `updateSettings(patch)` | 更新设置（含字段校验） |
| `estimateFinishDate(state, checkedToday)` | 预估吃完日期 |
| `isLowSupply(state)` | 是否低量 |
| `computeStreak(checkins)` | 计算连续打卡天数 |
| `exportData()` | 导出全部用药数据 |

---

### 4.8 副业模块 (SideWork)

**文件**：[src/pages/SideWork.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/SideWork.jsx)

**核心功能**：
- 副业项目 CRUD
- 5 类预设分类：自媒体 / 电商 / 技能 / 投资 / 其他
- 进度滑块（RangeSlider 0-100%）
- 平均进度统计

**数据表**：`side_projects`

---

### 4.9 复盘模块 (Review)

**文件**：[src/pages/Review.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/Review.jsx)

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

**文件**：[src/pages/Login.jsx](file:///F:/14143/trae%20work/gongzuotai/src/pages/Login.jsx)

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

**文件**：[src/db/database.js](file:///F:/14143/trae%20work/gongzuotai/src/db/database.js)

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

**文件**：[src/db/auth.js](file:///F:/14143/trae%20work/gongzuotai/src/db/auth.js)

基于 Supabase Auth，Session 持久化在 localStorage。支持：
- 邮箱密码注册/登录
- Session 自动刷新
- 认证状态监听
- 历史数据认领（`claim_legacy_data` RPC 函数）

### 5.3 API 模块一览

所有 API 模块均在 [src/db/database.js](file:///F:/14143/trae%20work/gongzuotai/src/db/database.js) 中定义，每个操作都携带 `user_id` 进行 RLS 隔离。

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
| `dailyRecordsApi` | `daily_records` | `getByDate`, `getByRange`, `upsert`, `delete` |
| `weeklyReviewsApi` | `weekly_reviews` | `getByWeek`, `getAll`, `upsert`, `delete` |
| `cognitionEntriesApi` | `cognition_entries` | `getAll({limit, category})`, `getById`, `add`, `update`, `delete` |
| `cognitionFeedbacksApi` | `cognition_feedbacks` | `getByEntryId`, `upsert`（onConflict `entry_id`）, `getAll`（关联 entries） |

共 17 个 API 模块。所有读写都先 `await uid()` 取当前会话用户 ID，再以 `eq('user_id', userId)` 显式过滤——即使 RLS 已兜底，双层过滤仍是本项目约定。

### 5.4 业务 Store

#### medicineStore.js

**文件**：[src/db/medicineStore.js](file:///F:/14143/trae%20work/gongzuotai/src/db/medicineStore.js)

用药模块的业务逻辑层，依赖 `database.js` 中的 4 个 Medicine API。提供纯函数 + 异步操作：

- 状态读写（getState / saveState）
- 打卡操作（checkinToday / makeupCheckin / uncheckinToday）
- 药瓶管理（switchToNextBottle / setBottleNumber）
- 余量管理（setRemainingPills / estimateFinishDate / isLowSupply）
- 设置管理（updateSettings）
- 数据导出（exportData）

#### englishStore.js

**文件**：[src/db/englishStore.js](file:///F:/14143/trae%20work/gongzuotai/src/db/englishStore.js)

英语 FSRS 业务逻辑层，**纯函数设计，不依赖 Supabase**，可独立测试。

- 依赖 `ts-fsrs` 库实现 FSRS 算法
- 提供卡片创建、评分、调度、序列化等纯函数
- 数据读写由 `English.jsx` 组合 `englishCardsApi` 完成

#### lifeStore.js

**文件**：[src/db/lifeStore.js](file:///F:/14143/trae%20work/gongzuotai/src/db/lifeStore.js)

生活模块业务层，同样**纯函数设计，不依赖 Supabase**，由 `tests/lifeStore.test.mjs` 覆盖。

- 情绪档位 `MOODS`（great/good/ok/low/bad）、精力档位 `ENERGY_LEVELS`（1-5）
- 每日记录 / 每周复盘的字段校验与派生计算（支出汇总、连续记录天数等）
- 数据读写由 `DailyTab` / `WeeklyTab` 组合 `dailyRecordsApi` / `weeklyReviewsApi` 完成

#### cognitionEngine.js（utils 而非 db，但同属业务纯函数层）

**文件**：[src/utils/cognitionEngine.js](file:///F:/14143/trae%20work/gongzuotai/src/utils/cognitionEngine.js)

认知扭曲检测引擎，648 行纯函数，不依赖网络与 Supabase。对外只暴露 `analyzeReflection(text, options)`。详见 [4.6 认知重塑](#46-生活模块-life)。

### 5.5 种子数据

**文件**：[src/db/seed.js](file:///F:/14143/trae%20work/gongzuotai/src/db/seed.js)

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

**文件**：[src/hooks/useAsyncData.js](file:///F:/14143/trae%20work/gongzuotai/src/hooks/useAsyncData.js)

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

**文件**：[src/components/ui/index.jsx](file:///F:/14143/trae%20work/gongzuotai/src/components/ui/index.jsx)  
**图标**：[src/components/ui/icons.jsx](file:///F:/14143/trae%20work/gongzuotai/src/components/ui/icons.jsx)

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
| `20260816000001_life_module_tables.sql` | daily_records, weekly_reviews (2 张) |
| `20261026000000_cognition_tables.sql` | cognition_entries, cognition_feedbacks (2 张，补录) |

合计 **17 张表**，与 `database.js` 中 17 个 API 模块一一对应。

> ⚠️ `20261026000000_cognition_tables.sql` 是 2026-10-26 补录的：这两张表在认知重塑功能上线时很可能只通过 Supabase Dashboard → SQL Editor 手动创建，未进版本库，导致「换环境重建数据库会漏表」。新增迁移已用 `IF NOT EXISTS` + `DROP POLICY IF EXISTS` 写成幂等脚本，可安全重复执行。
>
> 另注：根目录 `supabase-init.sql` 是早期单文件版本，只覆盖 7 张基础表，已被 `migrations/` 取代，不要再用于初始化。

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

> 上面这张 ASCII 图绘制于 2026-08，未包含生活模块四表。它们的关系如下。

#### 7.2.1 生活模块四表（补充）

| 表 | 唯一约束 | 关键字段 |
|----|---------|---------|
| `daily_records` | `(user_id, date)` | done_items, focus_hours, mood, energy(1-5), expenses(JSONB), tomorrow_task |
| `weekly_reviews` | `(user_id, week_start)` | highlights, problems, improvement |
| `cognition_entries` | — | date, content, category, mood |
| `cognition_feedbacks` | `entry_id`（1:1） | biases/evidence/perspectives/challenges(JSONB), reframe, summary, score, raw_analysis |

关系：`cognition_entries 1 ──── 1 cognition_feedbacks`（`entry_id` FK，`ON DELETE CASCADE`）。

`entry_id` 上的 UNIQUE 约束是必需的——`cognitionFeedbacksApi.upsert()` 依赖 `onConflict: 'entry_id'` 做覆盖写；同时 `cognitionFeedbacksApi.getAll()` 使用 `cognition_entries!inner(date, category)` 关联查询，需要真实外键关系才能被 PostgREST 解析。

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

**文件**：[server/index.js](file:///F:/14143/trae%20work/gongzuotai/server/index.js)

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
| `src/App.jsx` | 根组件，路由与认证 | 323 |
| `src/db/database.js` | Supabase 客户端 + 17 个 API 模块 | 688 |
| `src/db/auth.js` | 认证模块 | 80 |
| `src/db/medicineStore.js` | 用药业务逻辑（多瓶并存） | 384 |
| `src/db/lifeStore.js` | 生活模块业务逻辑（纯函数） | 313 |
| `src/db/englishStore.js` | 英语 FSRS 纯函数 | 130 |
| `src/db/seed.js` | 种子数据初始化 | 121 |
| `src/utils/cognitionEngine.js` | 认知扭曲检测引擎（纯函数） | 648 |
| `src/hooks/useAsyncData.js` | 通用异步数据 Hook | 49 |
| `src/components/ui/index.jsx` | UI 组件库（20+ 组件） | 443 |
| `src/components/ui/icons.jsx` | 图标库（90+ 图标） | 181 |
| `src/components/work/TaskBoard.jsx` | 任务看板 | 473 |
| `src/components/work/WorkSummary.jsx` | 工作小结 | 355 |
| `src/pages/Dashboard.jsx` | 首页仪表盘 | 206 |
| `src/pages/Study.jsx` | 学习模块 | 395 |
| `src/pages/English.jsx` | 英语学习 | 258 |
| `src/pages/Medicine.jsx` | 用药提醒（全项目最大单文件） | 755 |
| `src/pages/Life.jsx` | 生活模块容器（4 子 Tab） | 63 |
| `src/pages/life/CognitionTab.jsx` | 认知重塑主界面 | 454 |
| `src/pages/life/FeedbackCard.jsx` | 认知反馈展示 | 353 |
| `src/pages/life/WeeklyTab.jsx` | 每周复盘 | 404 |
| `src/pages/life/NotesTab.jsx` | 随笔列表 | 320 |
| `src/pages/life/DailyTab.jsx` | 每日记录 | 298 |
| `src/pages/Review.jsx` | 每日复盘 | 232 |
| `server/index.js` | Express 后端（备选，已与主链路脱节） | 374 |
| `supabase/migrations/20260728000000_init.sql` | 初始表迁移（7 张） | 98 |
| `supabase/migrations/20261026000000_cognition_tables.sql` | 认知重塑两表（补录） | 59 |

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
- API 层额外用 `eq('user_id', userId)` 显式过滤（双保险）
- 用药模块额外使用 `(user_id)` 或 `(user_id, date)` 唯一约束防止重复
- `cognition_feedbacks.entry_id` 唯一约束 + `ON DELETE CASCADE`，条目删除时反馈自动清理

**已知易踩的坑**：
- **两套 mood 定义不要混用**：`src/pages/life/constants.js`（随笔用，happy/calm/tired/healed/sad/busy）与 `src/db/lifeStore.js` 的 `MOODS`（每日记录用，great/good/ok/low/bad）是独立的，各自对应不同表和组件。
- **用药余量有两处真相**：`medicine_state.remaining_pills` 只代表当前活跃瓶，`medicine_bottles.remaining_pills` 才是每瓶真实余量。切瓶前后必须同步。
- **`server/index.js` 已脱节**：它是早期备选后端，表结构没有 `user_id`，不要用它对接现有数据库。
- **`supabase-init.sql` 已过时**：初始化请只用 `supabase/migrations/`。
- **PWA 构建**：`vite-plugin-pwa` / workbox-build 曾出现构建失败，`vite.config.js` 留有 `DISABLE_PWA=1` 逃生开关。

**状态管理**：
- 无全局状态管理库（Redux/Zustand 等）
- 各页面组件通过 `useAsyncData` 自行管理数据状态
- 全局刷新通过 `window.dispatchEvent('app-data-changed')` 实现跨组件通信
- Toast 通过发布订阅模式（`showToast` / `ToastContainer`）实现全局提示