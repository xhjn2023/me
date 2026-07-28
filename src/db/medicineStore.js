/**
 * 用药提醒模块 - 持久化层
 *
 * 存储方案：localStorage（轻量、同步、无需后端依赖）
 * 数据结构：
 *   - state:    当前药瓶状态（瓶号 / 余量 / 配置项）
 *   - checkins: 打卡日集合 { 'YYYY-MM-DD': 每日剂量 }
 *   - logs:     操作日志数组（新增/修改/切换/打卡，倒序）
 *   - bottles:  历史瓶次记录（含开始/结束日期）
 *
 * 所有写入均带容错：JSON 解析失败回退默认值，写入失败打印日志并返回 false。
 * 所有外部入参均做边界校验：余量非负、瓶号 ≥ 1、剂量 ≥ 1。
 */

const STORAGE_KEYS = {
  state: 'medicine:state',
  checkins: 'medicine:checkins',
  logs: 'medicine:logs',
  bottles: 'medicine:bottles'
}

// 药品单瓶标准数量 30 颗（业务规则）
const STANDARD_BOTTLE_SIZE = 30

const DEFAULT_STATE = {
  bottleNumber: 1, // 当前服用第几瓶
  remainingPills: STANDARD_BOTTLE_SIZE, // 当前瓶剩余药片数量
  pillsPerBottle: STANDARD_BOTTLE_SIZE, // 单瓶标准数量
  dailyDose: 1, // 每日服药颗数
  reminderTime: '09:00', // 每日提醒时间
  lowThreshold: 5, // 余量低阈值（剩余 ≤ 该值时提示购药）
  createdAt: Date.now()
}

// ─── 底层读写工具 ───

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.error(`[medicineStore] 读取 ${key} 失败:`, err)
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.error(`[medicineStore] 写入 ${key} 失败:`, err)
    return false
  }
}

// ─── 日期工具 ───

function todayStr() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

// 基于 fromStr 计算偏移 daysOffset 天的日期字符串（不传 fromStr 则从今天起）
function dateOffsetStr(daysOffset, fromStr) {
  const base = fromStr ? new Date(fromStr) : new Date()
  if (daysOffset) base.setDate(base.getDate() + daysOffset)
  const tz = base.getTimezoneOffset() * 60000
  return new Date(base - tz).toISOString().slice(0, 10)
}

// ─── State 读写 ───

export function getState() {
  const saved = readJSON(STORAGE_KEYS.state, null)
  const merged = { ...DEFAULT_STATE, ...(saved || {}) }
  // 字段边界校验，避免脏数据
  merged.bottleNumber = clampInt(merged.bottleNumber, 1, 9999, 1)
  merged.remainingPills = clampInt(merged.remainingPills, 0, 9999, 0)
  merged.pillsPerBottle = clampInt(merged.pillsPerBottle, 1, 9999, STANDARD_BOTTLE_SIZE)
  merged.dailyDose = clampInt(merged.dailyDose, 1, 99, 1)
  merged.lowThreshold = clampInt(merged.lowThreshold, 0, 9999, 5)
  if (!merged.reminderTime) merged.reminderTime = '09:00'
  if (!merged.createdAt) merged.createdAt = Date.now()
  return merged
}

function clampInt(val, min, max, fallback) {
  const n = Math.floor(Number(val))
  if (Number.isNaN(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function saveState(patch) {
  const next = { ...getState(), ...patch }
  writeJSON(STORAGE_KEYS.state, next)
  return next
}

// ─── Checkins 打卡记录 ───

export function getCheckins() {
  return readJSON(STORAGE_KEYS.checkins, {})
}

export function isCheckedToday() {
  return Boolean(getCheckins()[todayStr()])
}

/**
 * 计算连续打卡天数：从今天向前数，若今天未打卡则从昨天起算，
 * 遇到断档即停止。返回 0 表示无连续记录。
 */
export function getStreak() {
  const checkins = getCheckins()
  const today = todayStr()
  const yesterday = dateOffsetStr(-1)
  let cursor = checkins[today] ? today : checkins[yesterday] ? yesterday : null
  if (!cursor) return 0
  let streak = 0
  while (checkins[cursor]) {
    streak++
    cursor = dateOffsetStr(-1, cursor)
  }
  return streak
}

export function getTotalCheckinDays() {
  return Object.keys(getCheckins()).length
}

// ─── Logs 操作日志 ───

export function getLogs() {
  return readJSON(STORAGE_KEYS.logs, [])
}

function pushLog(action, note = '') {
  const logs = getLogs()
  logs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: todayStr(),
    action,
    note,
    timestamp: Date.now()
  })
  // 限制日志上限，防止 localStorage 无限膨胀
  if (logs.length > 1000) logs.length = 1000
  writeJSON(STORAGE_KEYS.logs, logs)
}

// ─── Bottles 瓶次历史 ───

export function getBottles() {
  return readJSON(STORAGE_KEYS.bottles, [])
}

function startBottleRecord(bottleNumber, totalPills) {
  const bottles = getBottles()
  if (!bottles.find(b => b.bottleNumber === bottleNumber)) {
    bottles.unshift({
      bottleNumber,
      startedAt: todayStr(),
      finishedAt: null,
      totalPills
    })
    writeJSON(STORAGE_KEYS.bottles, bottles)
  }
}

function finishBottleRecord(bottleNumber) {
  const bottles = getBottles()
  const target = bottles.find(b => b.bottleNumber === bottleNumber && !b.finishedAt)
  if (target) {
    target.finishedAt = todayStr()
    writeJSON(STORAGE_KEYS.bottles, bottles)
  }
}

// ─── 业务操作 ───

/** 今日打卡：扣减当日剂量、写入打卡日、记录日志 */
export function checkinToday() {
  const today = todayStr()
  const checkins = getCheckins()
  if (checkins[today]) return { ok: false, reason: '今日已打卡' }
  const state = getState()
  const newRemaining = Math.max(0, state.remainingPills - state.dailyDose)
  checkins[today] = state.dailyDose
  writeJSON(STORAGE_KEYS.checkins, checkins)
  const next = saveState({ remainingPills: newRemaining })
  pushLog('checkin', `第${state.bottleNumber}瓶打卡，剩余${newRemaining}颗`)
  return { ok: true, state: next }
}

/** 取消今日打卡：恢复剂量、移除打卡日 */
export function uncheckinToday() {
  const today = todayStr()
  const checkins = getCheckins()
  if (!checkins[today]) return { ok: false, reason: '今日未打卡' }
  const state = getState()
  const restored = state.remainingPills + (checkins[today] || state.dailyDose)
  delete checkins[today]
  writeJSON(STORAGE_KEYS.checkins, checkins)
  const next = saveState({ remainingPills: Math.min(9999, restored) })
  pushLog('uncheckin', '取消今日打卡')
  return { ok: true, state: next }
}

/** 修改药瓶余量（非负校验） */
export function setRemainingPills(count) {
  const n = clampInt(count, 0, 9999, 0)
  const next = saveState({ remainingPills: n })
  pushLog('quantity_update', `余量修改为${n}颗`)
  return next
}

/** 手动修改瓶号（≥1 校验） */
export function setBottleNumber(num) {
  const n = clampInt(num, 1, 9999, 1)
  const next = saveState({ bottleNumber: n })
  pushLog('bottle_change', `切换至第${n}瓶`)
  return next
}

/** 切换新瓶：完成当前瓶记录、瓶号+1、余量重置为单瓶标准 */
export function switchToNextBottle() {
  const state = getState()
  finishBottleRecord(state.bottleNumber)
  const nextNo = state.bottleNumber + 1
  const next = saveState({
    bottleNumber: nextNo,
    remainingPills: state.pillsPerBottle
  })
  startBottleRecord(nextNo, state.pillsPerBottle)
  pushLog('bottle_switch', `第${state.bottleNumber}瓶完成，开启第${nextNo}瓶`)
  return next
}

/** 更新设置（含字段校验） */
export function updateSettings(patch) {
  const clean = { ...patch }
  if (clean.pillsPerBottle !== undefined) clean.pillsPerBottle = clampInt(clean.pillsPerBottle, 1, 9999, STANDARD_BOTTLE_SIZE)
  if (clean.dailyDose !== undefined) clean.dailyDose = clampInt(clean.dailyDose, 1, 99, 1)
  if (clean.lowThreshold !== undefined) clean.lowThreshold = clampInt(clean.lowThreshold, 0, 9999, 5)
  if (clean.bottleNumber !== undefined) clean.bottleNumber = clampInt(clean.bottleNumber, 1, 9999, 1)
  if (clean.remainingPills !== undefined) clean.remainingPills = clampInt(clean.remainingPills, 0, 9999, 0)
  const next = saveState(clean)
  pushLog('settings_update', '更新用药设置')
  return next
}

/** 预估吃完日期（基于余量与每日剂量）
 *  已打卡今日：剩余药片从明天起算，偏移 = days
 *  未打卡今日：今日含在消耗周期内，偏移 = days - 1
 */
export function estimateFinishDate(state) {
  const s = state || getState()
  const dose = s.dailyDose || 1
  if (s.remainingPills <= 0) return null
  const days = Math.ceil(s.remainingPills / dose)
  const offset = isCheckedToday() ? days : days - 1
  return dateOffsetStr(offset)
}

/** 是否低量（余量 ≤ 阈值） */
export function isLowSupply(state) {
  const s = state || getState()
  return s.remainingPills <= s.lowThreshold
}

/** 初始化：首次进入补一条当前瓶记录 */
export function initMedicine() {
  const state = getState()
  if (getBottles().length === 0) {
    startBottleRecord(state.bottleNumber, state.pillsPerBottle)
  }
  return state
}

/** 清空所有用药数据（用于重置/测试） */
export function clearAll() {
  Object.values(STORAGE_KEYS).forEach(key => {
    try { localStorage.removeItem(key) } catch (e) { /* 忽略 */ }
  })
}

export { STORAGE_KEYS, STANDARD_BOTTLE_SIZE }
