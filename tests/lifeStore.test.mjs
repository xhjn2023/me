import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  toDateStr, shiftDate, getMonday, getWeekDates, weekRangeLabel, weekNumberLabel,
  prevWeek, nextWeek, normalizeDailyRecord, serializeDailyRecord,
  validateDailyRecord, isRecordFilled, expensesTotal, aggregateWeek, buildReviewDraft,
  moodOf, energyLabel
} from '../src/db/lifeStore.js'

// ─── 日期工具 ───
test('getMonday：把周中日期归一到周一', () => {
  // 2026-08-16 是周日 → 周一为 2026-08-10
  assert.equal(getMonday('2026-08-16'), '2026-08-10')
  // 2026-08-10 本身是周一 → 不变
  assert.equal(getMonday('2026-08-10'), '2026-08-10')
  // 2026-08-11 周二 → 周一
  assert.equal(getMonday('2026-08-11'), '2026-08-10')
})

test('getWeekDates：返回周一为起点的 7 天', () => {
  const dates = getWeekDates('2026-08-10')
  assert.equal(dates.length, 7)
  assert.equal(dates[0], '2026-08-10')
  assert.equal(dates[6], '2026-08-16')
})

test('shiftDate / prevWeek / nextWeek', () => {
  assert.equal(shiftDate('2026-08-10', 1), '2026-08-11')
  assert.equal(shiftDate('2026-08-10', -1), '2026-08-09')
  assert.equal(prevWeek('2026-08-10'), '2026-08-03')
  assert.equal(nextWeek('2026-08-10'), '2026-08-17')
})

test('weekRangeLabel / weekNumberLabel', () => {
  assert.equal(weekRangeLabel('2026-08-10'), '8月10日 - 8月16日')
  // 2026-08-10 那周是 ISO 第 33 周（2026-01-01 周四）
  assert.match(weekNumberLabel('2026-08-10'), /第 \d+ 周/)
})

// ─── 模型序列化 ───
test('normalizeDailyRecord：snake_case → camelCase + 类型归一', () => {
  const row = {
    id: 1, date: '2026-08-10', done_items: '写周报\n跑步',
    focus_hours: '2.5', mood: 'good', energy: '4',
    expenses: '[{"desc":"午饭","amount":30,"category":"餐饮"}]',
    tomorrow_task: '读一章书'
  }
  const rec = normalizeDailyRecord(row)
  assert.equal(rec.doneItems, '写周报\n跑步')
  assert.equal(rec.focusHours, 2.5)
  assert.equal(rec.energy, 4)
  assert.equal(rec.expenses.length, 1)
  assert.equal(rec.tomorrowTask, '读一章书')
})

test('serializeDailyRecord：camelCase → snake_case', () => {
  const rec = { date: '2026-08-10', doneItems: 'a', focusHours: 2, mood: 'ok', energy: 3, expenses: [], tomorrowTask: 'b' }
  const row = serializeDailyRecord(rec)
  assert.equal(row.done_items, 'a')
  assert.equal(row.focus_hours, 2)
  assert.equal(row.tomorrow_task, 'b')
})

test('validateDailyRecord：校验负时长', () => {
  assert.equal(validateDailyRecord({ date: '2026-08-10', focusHours: -1, expenses: [] }), '投入时长不能为负')
  assert.equal(validateDailyRecord({ date: '2026-08-10', focusHours: 25, expenses: [] }), '投入时长不能超过 24 小时')
  assert.equal(validateDailyRecord({ date: '2026-08-10', focusHours: 2, expenses: [] }), '')
})

test('isRecordFilled / expensesTotal', () => {
  assert.equal(isRecordFilled({ doneItems: '', focusHours: 0, mood: '', expenses: [], tomorrowTask: '' }), false)
  assert.equal(isRecordFilled({ doneItems: 'x', focusHours: 0, mood: '', expenses: [], tomorrowTask: '' }), true)
  const rec = { expenses: [{ amount: 12.5 }, { amount: 7.5 }] }
  assert.equal(expensesTotal(rec), 20)
})

// ─── 每周聚合 ───
const sample = [
  { date: '2026-08-10', doneItems: '写周报\n开会', focusHours: 6, mood: 'good', energy: 4, expenses: [{ desc: '午饭', amount: 30, category: '餐饮' }], tomorrowTask: '整理数据' },
  { date: '2026-08-11', doneItems: '整理数据', focusHours: 3, mood: 'ok', energy: 3, expenses: [{ desc: '打车', amount: 20, category: '交通' }], tomorrowTask: '整理数据' },
  { date: '2026-08-12', doneItems: '', focusHours: 0, mood: 'low', energy: 2, expenses: [], tomorrowTask: '' },
]

test('aggregateWeek：汇总统计', () => {
  const agg = aggregateWeek(sample, '2026-08-10')
  assert.equal(agg.recordedDays, 3)
  assert.equal(agg.totalHours, 9)
  assert.equal(agg.totalExpense, 50)
  assert.equal(agg.avgEnergy, 3) // (4+3+2)/3 = 3
  assert.equal(agg.moodCounts.good, 1)
  assert.equal(agg.moodCounts.ok, 1)
  assert.equal(agg.moodCounts.low, 1)
  // 低状态天：08-12 精力 2（低落）
  assert.equal(agg.lowDays.length, 1)
  assert.equal(agg.lowDays[0].date, '2026-08-12')
  // 完成事项（拆分行）
  assert.equal(agg.doneList.length, 3)
  // 投入最多的一天
  assert.equal(agg.bestDay.date, '2026-08-10')
  // 开销分类汇总
  assert.equal(agg.expenseByCategory['餐饮'], 30)
  assert.equal(agg.expenseByCategory['交通'], 20)
  // 明日事项列表（两条「整理数据」）
  assert.equal(agg.tomorrowList.length, 2)
})

test('aggregateWeek：空记录', () => {
  const agg = aggregateWeek([], '2026-08-10')
  assert.equal(agg.recordedDays, 0)
  assert.equal(agg.totalHours, 0)
  assert.equal(agg.avgEnergy, 0)
})

test('buildReviewDraft：生成亮点与问题草稿', () => {
  const draft = buildReviewDraft(sample, '2026-08-10', {})
  assert.ok(draft.highlights.includes('9 小时'))
  assert.ok(draft.highlights.includes('写周报'))
  // 问题：低状态天 + 反复推迟的「整理数据」
  assert.ok(draft.problems.includes('状态偏低'))
  assert.ok(draft.problems.includes('整理数据'))
  assert.equal(draft.improvement, '')
  assert.equal(draft.recordedDays, 3)
})

test('buildReviewDraft：保留已有内容不被覆盖', () => {
  const existing = { highlights: '我自己的亮点', problems: '', improvement: '早睡' }
  const draft = buildReviewDraft(sample, '2026-08-10', existing)
  assert.equal(draft.highlights, '我自己的亮点')
  assert.ok(draft.problems.includes('状态偏低'))
  assert.equal(draft.improvement, '早睡')
})

test('moodOf / energyLabel', () => {
  assert.equal(moodOf('great').label, '很棒')
  assert.equal(moodOf('unknown'), null)
  assert.equal(energyLabel(5), '爆满')
  assert.equal(energyLabel(99), '')
})
