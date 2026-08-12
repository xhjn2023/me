/**
 * 用药提醒模块 - 持久化层（Supabase）
 *
 * 数据表：
 *   - medicine_state:    当前药瓶状态（单行，id=1）
 *   - medicine_checkins: 打卡日集合 { date, dose }
 *   - medicine_bottles:  历史瓶次记录
 *   - medicine_logs:     操作日志
 *
 * 所有读操作返回 Promise，所有写入均通过 Supabase API。
 * 业务逻辑（streak/finishDate/lowSupply）保持纯函数，供组件直接调用。
 */

import {
  medicineStateApi,
  medicineCheckinsApi,
  medicineBottlesApi,
  medicineLogsApi
} from './database'

const STANDARD_BOTTLE_SIZE = 30

const DEFAULT_STATE = {
  bottleNumber: 1,
  remainingPills: STANDARD_BOTTLE_SIZE,
  pillsPerBottle: STANDARD_BOTTLE_SIZE,
  dailyDose: 1,
  reminderTime: '09:00',
  lowThreshold: 5,
  createdAt: Date.now()
}

// ─── 日期工具 ───

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

function clampInt(val, min, max, fallback) {
  const n = Math.floor(Number(val))
  if (Number.isNaN(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

// ─── State 读写 ───

export async function getState() {
  const saved = await medicineStateApi.get()
  if (!saved) return { ...DEFAULT_STATE }
  const merged = {
    bottleNumber: saved.bottle_number ?? DEFAULT_STATE.bottleNumber,
    remainingPills: saved.remaining_pills ?? DEFAULT_STATE.remainingPills,
    pillsPerBottle: saved.pills_per_bottle ?? DEFAULT_STATE.pillsPerBottle,
    dailyDose: saved.daily_dose ?? DEFAULT_STATE.dailyDose,
    reminderTime: saved.reminder_time ?? DEFAULT_STATE.reminderTime,
    lowThreshold: saved.low_threshold ?? DEFAULT_STATE.lowThreshold,
    createdAt: saved.created_at ?? DEFAULT_STATE.createdAt
  }
  merged.bottleNumber = clampInt(merged.bottleNumber, 1, 9999, 1)
  merged.remainingPills = clampInt(merged.remainingPills, 0, 9999, 0)
  merged.pillsPerBottle = clampInt(merged.pillsPerBottle, 1, 9999, STANDARD_BOTTLE_SIZE)
  merged.dailyDose = clampInt(merged.dailyDose, 1, 99, 1)
  merged.lowThreshold = clampInt(merged.lowThreshold, 0, 9999, 5)
  if (!merged.reminderTime) merged.reminderTime = '09:00'
  return merged
}

async function saveState(patch) {
  const current = await getState()
  const next = { ...current, ...patch }
  await medicineStateApi.upsert({
    bottle_number: next.bottleNumber,
    remaining_pills: next.remainingPills,
    pills_per_bottle: next.pillsPerBottle,
    daily_dose: next.dailyDose,
    reminder_time: next.reminderTime,
    low_threshold: next.lowThreshold,
    created_at: next.createdAt
  })
  return next
}

// ─── Checkins 打卡记录 ───

export async function getCheckins() {
  return medicineCheckinsApi.getAll()
}

export async function isCheckedToday() {
  const checkins = await getCheckins()
  return Boolean(checkins[todayStr()])
}

/**
 * 计算连续打卡天数（纯函数，供组件从已加载的 checkins 计算）
 */
export function computeStreak(checkins) {
  if (!checkins) return 0
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

export async function getStreak() {
  const checkins = await getCheckins()
  return computeStreak(checkins)
}

export async function getTotalCheckinDays() {
  const checkins = await getCheckins()
  return Object.keys(checkins).length
}

// ─── Logs 操作日志 ───

export async function getLogs() {
  return medicineLogsApi.getAll()
}

async function pushLog(action, note = '') {
  await medicineLogsApi.add(action, note)
}

// ─── Bottles 瓶次历史 ───

export async function getBottles() {
  return medicineBottlesApi.getAll()
}

async function startBottleRecord(bottleNumber, totalPills) {
  const bottles = await getBottles()
  if (!bottles.find(b => b.bottleNumber === bottleNumber)) {
    await medicineBottlesApi.add({
      bottleNumber,
      startedAt: todayStr(),
      finishedAt: null,
      totalPills
    })
  }
}

async function finishBottleRecord(bottleNumber) {
  await medicineBottlesApi.finish(bottleNumber)
}

// ─── 业务操作 ───

/**
 * 通用打卡：今日打卡与补打卡共用同一套逻辑。
 * - 不允许对未来日期打卡
 * - 同一日期不可重复打卡（medicine_checkins 以 user_id+date 唯一约束）
 * - 完全复用原有流程：扣减当日剂量、写入打卡日、记录日志
 */
async function performCheckin(date, { makeup = false } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, reason: '日期格式不正确' }
  }
  const today = todayStr()
  if (date > today) {
    return { ok: false, reason: makeup ? '不能对未来日期补打卡' : '不能对未来日期打卡' }
  }
  const checkins = await getCheckins()
  if (checkins[date]) {
    return { ok: false, reason: makeup ? '该日期已打卡' : '今日已打卡' }
  }
  const state = await getState()
  const newRemaining = Math.max(0, state.remainingPills - state.dailyDose)
  await medicineCheckinsApi.add(date, state.dailyDose, makeup)
  const next = await saveState({ remainingPills: newRemaining })
  const note = `第${state.bottleNumber}瓶打卡，剩余${newRemaining}颗`
  await pushLog(makeup ? 'makeup_checkin' : 'checkin', makeup ? `补打卡 ${date}，${note}` : note)
  return { ok: true, state: next, date }
}

/** 今日打卡（复用通用打卡流程） */
export async function checkinToday() {
  return performCheckin(todayStr())
}

/** 补打卡：为过去某天补记一次打卡，与今日打卡共用扣量 / 写日志逻辑 */
export async function makeupCheckin(date) {
  return performCheckin(date, { makeup: true })
}

/** 取消今日打卡：恢复剂量、移除打卡日 */
export async function uncheckinToday() {
  const today = todayStr()
  const checkins = await getCheckins()
  if (!checkins[today]) return { ok: false, reason: '今日未打卡' }
  const state = await getState()
  const restored = state.remainingPills + (checkins[today]?.dose || state.dailyDose)
  await medicineCheckinsApi.remove(today)
  const next = await saveState({ remainingPills: Math.min(9999, restored) })
  await pushLog('uncheckin', '取消今日打卡')
  return { ok: true, state: next }
}

/** 修改药瓶余量（非负校验） */
export async function setRemainingPills(count) {
  const n = clampInt(count, 0, 9999, 0)
  const next = await saveState({ remainingPills: n })
  await pushLog('quantity_update', `余量修改为${n}颗`)
  return next
}

/** 手动修改瓶号（≥1 校验） */
export async function setBottleNumber(num) {
  const n = clampInt(num, 1, 9999, 1)
  const next = await saveState({ bottleNumber: n })
  await pushLog('bottle_change', `切换至第${n}瓶`)
  return next
}

/** 切换新瓶：完成当前瓶记录、瓶号+1、余量重置为单瓶标准 */
export async function switchToNextBottle() {
  const state = await getState()
  await finishBottleRecord(state.bottleNumber)
  const nextNo = state.bottleNumber + 1
  const next = await saveState({
    bottleNumber: nextNo,
    remainingPills: state.pillsPerBottle
  })
  await startBottleRecord(nextNo, state.pillsPerBottle)
  await pushLog('bottle_switch', `第${state.bottleNumber}瓶完成，开启第${nextNo}瓶`)
  return next
}

/** 更新设置（含字段校验） */
export async function updateSettings(patch) {
  const clean = { ...patch }
  if (clean.pillsPerBottle !== undefined) clean.pillsPerBottle = clampInt(clean.pillsPerBottle, 1, 9999, STANDARD_BOTTLE_SIZE)
  if (clean.dailyDose !== undefined) clean.dailyDose = clampInt(clean.dailyDose, 1, 99, 1)
  if (clean.lowThreshold !== undefined) clean.lowThreshold = clampInt(clean.lowThreshold, 0, 9999, 5)
  if (clean.bottleNumber !== undefined) clean.bottleNumber = clampInt(clean.bottleNumber, 1, 9999, 1)
  if (clean.remainingPills !== undefined) clean.remainingPills = clampInt(clean.remainingPills, 0, 9999, 0)
  const next = await saveState(clean)
  await pushLog('settings_update', '更新用药设置')
  return next
}

/** 预估吃完日期（纯函数，需传入 checkedToday 状态）
 *  已打卡今日：剩余药片从明天起算，偏移 = days
 *  未打卡今日：今日含在消耗周期内，偏移 = days - 1
 */
export function estimateFinishDate(state, checkedToday) {
  const dose = state?.dailyDose || 1
  if (!state || state.remainingPills <= 0) return null
  const days = Math.ceil(state.remainingPills / dose)
  const offset = checkedToday ? days : days - 1
  return dateOffsetStr(offset)
}

/** 是否低量（余量 ≤ 阈值） */
export function isLowSupply(state) {
  const s = state || {}
  return s.remainingPills <= (s.lowThreshold ?? 0)
}

/** 初始化：首次进入补一条当前瓶记录 + 初始化状态行 */
export async function initMedicine() {
  let state = await getState()
  // 如果 state 表为空，插入默认行
  const exists = await medicineStateApi.get()
  if (!exists) {
    await medicineStateApi.upsert({
      bottle_number: state.bottleNumber,
      remaining_pills: state.remainingPills,
      pills_per_bottle: state.pillsPerBottle,
      daily_dose: state.dailyDose,
      reminder_time: state.reminderTime,
      low_threshold: state.lowThreshold,
      created_at: state.createdAt
    })
  }
  // 首次进入补一条当前瓶记录
  const bottles = await getBottles()
  if (bottles.length === 0) {
    await startBottleRecord(state.bottleNumber, state.pillsPerBottle)
  }
  return state
}

/**
 * 导出全部用药数据为可序列化对象
 * 包含：state（当前状态）/ checkins（打卡记录）/ bottles（瓶次历史）/ logs（操作日志）
 * 同时附带元信息（导出时间、版本号），便于后续做导入或迁移
 */
export async function exportData() {
  const [state, checkins, bottles, logs] = await Promise.all([
    getState(),
    getCheckins(),
    getBottles(),
    getLogs()
  ])
  return {
    meta: {
      module: 'medicine',
      version: 1,
      exportedAt: new Date().toISOString()
    },
    state,
    checkins,
    bottles,
    logs
  }
}

export { STANDARD_BOTTLE_SIZE }
