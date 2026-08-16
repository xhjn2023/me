/**
 * 生活模块 - 业务层（纯函数，可单测）
 *
 * 核心功能：每日记录 + 每周复盘
 * 本文件不依赖 Supabase，保证纯函数可独立测试。
 * 数据读写由 DailyTab/WeeklyTab 组合 dailyRecordsApi / weeklyReviewsApi（database.js）完成。
 */

// ─── 常量 ───

// 情绪档位
export const MOODS = [
  { key: 'great', label: '很棒', emoji: '😄', color: 'emerald', active: 'bg-emerald-500 text-white' },
  { key: 'good', label: '不错', emoji: '🙂', color: 'teal', active: 'bg-teal-500 text-white' },
  { key: 'ok', label: '一般', emoji: '😐', color: 'slate', active: 'bg-slate-500 text-white' },
  { key: 'low', label: '低落', emoji: '😔', color: 'amber', active: 'bg-amber-500 text-white' },
  { key: 'bad', label: '很差', emoji: '😞', color: 'rose', active: 'bg-rose-500 text-white' },
]

// 精力等级（1-5）
export const ENERGY_LEVELS = [
  { value: 1, label: '疲惫' },
  { value: 2, label: '较低' },
  { value: 3, label: '一般' },
  { value: 4, label: '充沛' },
  { value: 5, label: '爆满' },
]

// 开销分类
export const EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '日用', '娱乐', '医疗', '学习', '其他']

// 投入时长快捷选项（小时）
export const FOCUS_PRESETS = [0.5, 1, 2, 3, 4, 6, 8]

// ─── 日期工具（纯函数，避免依赖 database.js）───

/** Date → 'YYYY-MM-DD'（本地时区） */
export function toDateStr(d) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

export function todayStr() {
  return toDateStr(new Date())
}

/** 日期字符串 ± 天数 */
export function shiftDate(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

/** 某日期所在周的周一日期（周一为一周开始） */
export function getMonday(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay() || 7 // 周日=7
  d.setDate(d.getDate() - day + 1)
  return toDateStr(d)
}

/** 周一日期 → 本周 7 天日期数组 */
export function getWeekDates(monday) {
  const dates = []
  for (let i = 0; i < 7; i++) dates.push(shiftDate(monday, i))
  return dates
}

/** 周切换：上一周 / 下一周（返回新的周一日期） */
export function prevWeek(monday) {
  return shiftDate(monday, -7)
}
export function nextWeek(monday) {
  return shiftDate(monday, 7)
}

/** 周标题：如「8月10日 - 8月16日」 */
export function weekRangeLabel(monday) {
  const start = new Date(monday)
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  const fmt = d => `${d.getMonth() + 1}月${d.getDate()}日`
  return `${fmt(start)} - ${fmt(end)}`
}

/** 周序号（ISO 周）：如「第 33 周」 */
export function weekNumberLabel(monday) {
  const d = new Date(monday)
  // 复制日期并移到周四，再算 ISO 周数
  const target = new Date(d)
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(d.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstDayNr = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)
  const weekNo = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000))
  return `第 ${weekNo} 周`
}

// ─── 每日记录模型 ───

/** 新建空记录 */
export function emptyDailyRecord(date = todayStr()) {
  return {
    date,
    doneItems: '',
    focusHours: 0,
    mood: '',
    energy: 3,
    expenses: [],
    tomorrowTask: '',
  }
}

/** snake_case 行 → 前端模型（camelCase + 类型归一） */
export function normalizeDailyRecord(row) {
  if (!row) return null
  let expenses = row.expenses || []
  if (typeof expenses === 'string') {
    try { expenses = JSON.parse(expenses) } catch { expenses = [] }
  }
  return {
    id: row.id,
    date: row.date,
    doneItems: row.done_items ?? row.doneItems ?? '',
    focusHours: Number(row.focus_hours ?? row.focusHours ?? 0) || 0,
    mood: row.mood || '',
    energy: Number(row.energy ?? 3) || 3,
    expenses: Array.isArray(expenses) ? expenses : [],
    tomorrowTask: row.tomorrow_task ?? row.tomorrowTask ?? '',
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  }
}

/** 前端模型 → snake_case 行（写入 Supabase） */
export function serializeDailyRecord(rec) {
  return {
    date: rec.date,
    done_items: rec.doneItems || '',
    focus_hours: Number(rec.focusHours) || 0,
    mood: rec.mood || '',
    energy: Number(rec.energy) || 3,
    expenses: rec.expenses || [],
    tomorrow_task: rec.tomorrowTask || '',
  }
}

/** 校验每日记录，返回错误提示（空字符串表示通过） */
export function validateDailyRecord(rec) {
  if (!rec.date) return '缺少日期'
  if ((rec.focusHours ?? 0) < 0) return '投入时长不能为负'
  if (rec.focusHours > 24) return '投入时长不能超过 24 小时'
  for (const e of rec.expenses || []) {
    if (e.amount != null && (isNaN(Number(e.amount)) || Number(e.amount) < 0)) {
      return '开销金额不合法'
    }
  }
  return ''
}

/** 某天是否已填写（至少有一项内容） */
export function isRecordFilled(rec) {
  if (!rec) return false
  const hasExpense = (rec.expenses || []).length > 0
  return Boolean(
    (rec.doneItems || '').trim() ||
    (rec.focusHours || 0) > 0 ||
    rec.mood ||
    hasExpense ||
    (rec.tomorrowTask || '').trim()
  )
}

/** 当日开销总额 */
export function expensesTotal(rec) {
  return (rec?.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
}

/** 情绪对象 */
export function moodOf(key) {
  return MOODS.find(m => m.key === key) || null
}

/** 精力文案 */
export function energyLabel(value) {
  return (ENERGY_LEVELS.find(e => e.value === value) || {}).label || ''
}

// ─── 每周聚合（每日记录 → 复盘参考数据）───

/**
 * 聚合一周的每日记录，输出复盘所需的汇总数据。
 * @param {Array} records 一周的每日记录（normalizeDailyRecord 后的数组）
 * @param {string} monday 本周周一日期，用于对齐 7 天
 */
export function aggregateWeek(records = [], monday) {
  const days = getWeekDates(monday)
  const byDate = {}
  for (const r of records) byDate[r.date] = r

  const filled = []
  for (const d of days) {
    const r = byDate[d]
    if (r && isRecordFilled(r)) filled.push(r)
  }

  const totalHours = filled.reduce((s, r) => s + (r.focusHours || 0), 0)
  const totalExpense = filled.reduce((s, r) => s + expensesTotal(r), 0)
  const energyDays = filled.filter(r => (r.energy || 0) > 0)
  const avgEnergy = energyDays.length
    ? Math.round((energyDays.reduce((s, r) => s + r.energy, 0) / energyDays.length) * 10) / 10
    : 0

  // 情绪分布
  const moodCounts = {}
  for (const m of MOODS) moodCounts[m.key] = 0
  for (const r of filled) if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1

  // 低落/低精力天数（潜在问题线索）
  const lowDays = filled
    .filter(r => (r.mood === 'low' || r.mood === 'bad') || (r.energy > 0 && r.energy <= 2))
    .map(r => ({ date: r.date, mood: r.mood, energy: r.energy }))

  // 投入最多的一天
  let bestDay = null
  for (const r of filled) {
    if (!bestDay || (r.focusHours || 0) > (bestDay.focusHours || 0)) bestDay = r
  }

  // 全部完成事项（逐行拆分）
  const doneList = []
  for (const r of filled) {
    const lines = (r.doneItems || '').split('\n').map(s => s.trim()).filter(Boolean)
    for (const line of lines) doneList.push({ date: r.date, text: line })
  }

  // 全部「明日最重要的事」（可能反复出现 → 模式线索）
  const tomorrowList = []
  for (const r of filled) {
    const t = (r.tomorrowTask || '').trim()
    if (t) tomorrowList.push({ date: r.date, text: t })
  }

  // 开销明细（按分类汇总）
  const expenseByCategory = {}
  for (const r of filled) {
    for (const e of r.expenses || []) {
      const cat = e.category || '其他'
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (Number(e.amount) || 0)
    }
  }

  return {
    monday,
    days,
    recordedDays: filled.length,
    totalHours: Math.round(totalHours * 10) / 10,
    totalExpense: Math.round(totalExpense * 100) / 100,
    avgEnergy,
    moodCounts,
    lowDays,
    bestDay,
    doneList,
    tomorrowList,
    expenseByCategory,
  }
}

/**
 * 根据一周每日记录自动生成复盘草稿（亮点 / 问题 / 改进建议）。
 * 已填写内容的字段保留用户原文，不再覆盖。
 */
export function buildReviewDraft(records = [], monday, existing = {}) {
  const agg = aggregateWeek(records, monday)
  const hlLines = []
  const pbLines = []

  if (!existing.highlights && agg.recordedDays > 0) {
    hlLines.push(`· 本周共记录 ${agg.recordedDays} 天，累计有效投入 ${agg.totalHours} 小时`)
    if (agg.bestDay && agg.bestDay.focusHours > 0) {
      hlLines.push(`· 投入最多的一天：${agg.bestDay.date}（${agg.bestDay.focusHours} 小时）`)
    }
    const top = agg.doneList.slice(0, 5).map(d => `  - ${d.text}`)
    if (top.length) hlLines.push(`· 完成的主要事项：\n${top.join('\n')}`)
    else hlLines.push('· 本周完成事项：待补充')
  }

  if (!existing.problems && agg.recordedDays > 0) {
    if (agg.lowDays.length) {
      const desc = agg.lowDays.map(d => {
        const mood = moodOf(d.mood)
        return `${d.date.slice(5)}（${mood ? mood.label : '—'} / 精力${d.energy}）`
      }).join('、')
      pbLines.push(`· 状态偏低的 ${agg.lowDays.length} 天：${desc}，注意作息与负荷`)
    } else {
      pbLines.push('· 本周无明显低状态日，整体节奏平稳')
    }
    // 重复出现的「明日最重要的事」→ 可能的拖延模式
    const freq = {}
    for (const t of agg.tomorrowList) freq[t.text] = (freq[t.text] || 0) + 1
    const repeated = Object.entries(freq).filter(([, n]) => n >= 2).map(([text, n]) => `「${text}」出现 ${n} 次`)
    if (repeated.length) pbLines.push(`· 反复推迟的事项：${repeated.join('；')}`)
  }

  const highlights = existing.highlights || (agg.recordedDays > 0 ? hlLines.join('\n') : '')
  const problems = existing.problems || (agg.recordedDays > 0 ? pbLines.join('\n') : '')

  // 改进建议：默认留空，由用户自己写（只做提示）
  const improvement = existing.improvement || ''

  return { highlights, problems, improvement, recordedDays: agg.recordedDays }
}
