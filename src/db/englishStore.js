/**
 * 英语学习模块 - 业务层（纯函数，可单测）
 *
 * 复用开源方案：
 *   - ts-fsrs（FSRS 间隔重复算法）：决定每个单词下次复习时间
 *   - 本地词库 JSON（cet6 / kaoyan）：单词数据
 *   - Web Speech API（发音）：零依赖，页面层使用
 *
 * 本文件只依赖 ts-fsrs，不依赖 Supabase，保证纯函数可独立测试。
 * 数据读写由 English.jsx 组合 englishCardsApi（database.js）完成。
 */

import { createEmptyCard, fsrs, Rating } from 'ts-fsrs'

const scheduler = fsrs()

// ─── 词库元信息 ───
export const BOOKS = {
  cet6: { label: '六级核心', accent: 'sky', file: 'cet6' },
  kaoyan: { label: '考研高频', accent: 'violet', file: 'kaoyan' }
}

// ─── 评分档位（与 ts-fsrs Rating 对齐）───
export const RATINGS = [
  { rating: Rating.Again, key: 'again', label: '重来', desc: '没记住', color: 'rose' },
  { rating: Rating.Hard, key: 'hard', label: '困难', desc: '勉强想起', color: 'amber' },
  { rating: Rating.Good, key: 'good', label: '良好', desc: '记住了', color: 'emerald' },
  { rating: Rating.Easy, key: 'easy', label: '简单', desc: '很熟练', color: 'sky' }
]

// ─── 日期工具（纯函数，避免依赖 database.js）───
function todayStr() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

function dateOffsetStr(daysOffset, fromStr) {
  const base = fromStr ? new Date(fromStr) : new Date()
  if (daysOffset) base.setDate(base.getDate() + daysOffset)
  const tz = base.getTimezoneOffset() * 60000
  return new Date(base - tz).toISOString().slice(0, 10)
}

// ─── 卡片调度（纯函数）───

/** 创建一张全新的 FSRS 卡片 */
export function newCard() {
  return createEmptyCard()
}

/** 应用评分，返回更新后的卡片 */
export function reviewCard(card, rating, now = new Date()) {
  const result = scheduler.next(card, now, rating)
  return result.card
}

/** 预览四档评分各自的下次复习时间（用于展示） */
export function previewRatings(card, now = new Date()) {
  const preview = scheduler.repeat(card, now)
  return RATINGS.map(r => ({
    ...r,
    due: preview[r.rating].card.due
  }))
}

/** 从卡片列表筛选出已到期的卡片（due <= now） */
export function getDueCards(cards, now = new Date()) {
  const t = now.getTime()
  return cards.filter(c => {
    const due = c.due
    return !due || due.getTime() <= t
  })
}

/** 计算已掌握（进入 Review 状态且稳定）的卡片数 */
export function countMastered(cards) {
  return cards.filter(c => c.state === 2 && c.stability >= 1).length
}

// ─── 序列化（JS Date ⇄ 时间戳，用于存 Supabase JSONB）───

/** card（含 Date）→ 可序列化对象（时间戳数字） */
export function serializeCard(card) {
  return {
    due: card.due ? card.due.getTime() : 0,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    elapsed_days: card.elapsed_days ?? 0,
    scheduled_days: card.scheduled_days ?? 0,
    reps: card.reps ?? 0,
    lapses: card.lapses ?? 0,
    state: card.state ?? 0,
    last_review: card.last_review ? card.last_review.getTime() : null
  }
}

/** 反序列化：时间戳数字 → card（含 Date） */
export function deserializeCard(s) {
  if (!s) return newCard()
  return {
    due: s.due ? new Date(s.due) : null,
    stability: s.stability ?? 0,
    difficulty: s.difficulty ?? 0,
    elapsed_days: s.elapsed_days ?? 0,
    scheduled_days: s.scheduled_days ?? 0,
    reps: s.reps ?? 0,
    lapses: s.lapses ?? 0,
    state: s.state ?? 0,
    last_review: s.last_review ? new Date(s.last_review) : null
  }
}

// ─── 连续学习天数（纯函数，与 medicineStore 同款逻辑）───

/** 输入复习日期字符串集合，返回连续天数 */
export function computeStreak(dates) {
  if (!dates || dates.length === 0) return 0
  const set = new Set(dates)
  const today = todayStr()
  const yesterday = dateOffsetStr(-1)
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null
  if (!cursor) return 0
  let streak = 0
  while (set.has(cursor)) {
    streak++
    cursor = dateOffsetStr(-1, cursor)
  }
  return streak
}
