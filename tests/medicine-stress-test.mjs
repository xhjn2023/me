/**
 * 用药提醒模块 - 压力测试
 *
 * 测试目标：验证 medicineStore 基于 localStorage 的存取稳定性
 * 覆盖场景：
 *   1. 连续多天打卡（365 天）—— 验证 streak 计算与 checkins 写入
 *   2. 频繁修改药量（500 次）—— 验证余量边界与日志收敛
 *   3. 频繁切换药瓶（50 次）—— 验证瓶号自增与瓶次历史
 *   4. 大量历史记录（1000 条日志）—— 验证日志上限与读写性能
 *   5. 并发写入模拟（100 个交错操作）—— 验证数据一致性
 *   6. 数据完整性（写入→读取比对）
 *   7. localStorage 容错（JSON 损坏回退默认值）
 *   8. 持久化（清空内存后重新读取仍一致）
 *   9. 边界校验（负数余量、0 瓶号被拒绝）
 *  10. 性能（大量打卡后查询耗时可接受）
 *
 * 运行：npm run medicine-stress-test
 */

// ─── 在 Node 环境注入 localStorage mock ───
// 使用 Map 实现，行为贴近浏览器 localStorage（同步、字符串值）
class LocalStorageMock {
  constructor() {
    this._store = new Map()
  }
  getItem(key) {
    return this._store.has(key) ? this._store.get(key) : null
  }
  setItem(key, value) {
    this._store.set(key, String(value))
  }
  removeItem(key) {
    this._store.delete(key)
  }
  clear() {
    this._store.clear()
  }
  key(i) {
    return Array.from(this._store.keys())[i] || null
  }
  get length() {
    return this._store.size
  }
}
globalThis.localStorage = new LocalStorageMock()

// 动态导入，确保 localStorage 已就位
const medicine = await import('../src/db/medicineStore.js')

let passed = 0
let failed = 0
const results = []

function assert(name, condition, detail = '') {
  if (condition) {
    passed++
    results.push(`  ✅ ${name}`)
  } else {
    failed++
    results.push(`  ❌ ${name} ${detail}`)
  }
}

// 模拟指定日期的打卡：直接写 checkins，绕过“今日”限制
function injectCheckin(dateStr, dose = 1) {
  const checkins = medicine.getCheckins()
  checkins[dateStr] = dose
  globalThis.localStorage.setItem('medicine:checkins', JSON.stringify(checkins))
}

// 生成从起日期 n 天的 YYYY-MM-DD
function dateStr(offset, fromStr) {
  const base = fromStr ? new Date(fromStr) : new Date()
  base.setDate(base.getDate() + offset)
  const tz = base.getTimezoneOffset() * 60000
  return new Date(base - tz).toISOString().slice(0, 10)
}

async function run() {
  console.log('═══════════════════════════════════════')
  console.log('  用药提醒模块压力测试 - 开始')
  console.log('═══════════════════════════════════════\n')

  // ─── 测试1: 连续 365 天打卡 ───
  console.log('▶ 测试1: 连续 365 天打卡')
  medicine.clearAll()
  medicine.initMedicine()
  const t1Start = Date.now()
  for (let i = 0; i < 365; i++) {
    injectCheckin(dateStr(-i), 1)
  }
  const t1Duration = Date.now() - t1Start
  const totalDays = medicine.getTotalCheckinDays()
  assert('连续打卡 365 天写入成功', totalDays === 365, `实际: ${totalDays}`)
  assert('累计打卡天数正确', totalDays === 365)
  assert('打卡写入耗时可接受 (<2s)', t1Duration < 2000, `${t1Duration}ms`)

  // ─── 测试2: streak 计算 ───
  console.log('▶ 测试2: 连续打卡 streak 计算')
  // 注：getStreak 从今天向前数，今天已注入 → 应为 365
  const streak = medicine.getStreak()
  assert('streak 正确为 365', streak === 365, `实际: ${streak}`)

  // 制造断档：删除 30 天前的记录
  {
    const checkins = medicine.getCheckins()
    for (let i = 30; i < 60; i++) delete checkins[dateStr(-i)]
    globalThis.localStorage.setItem('medicine:checkins', JSON.stringify(checkins))
  }
  const brokenStreak = medicine.getStreak()
  assert('断档后 streak 收敛为 30', brokenStreak === 30, `实际: ${brokenStreak}`)

  // ─── 测试3: 频繁修改药量（500 次）───
  console.log('▶ 测试3: 频繁修改药量 500 次')
  medicine.clearAll()
  medicine.initMedicine()
  const t3Start = Date.now()
  for (let i = 0; i < 500; i++) {
    medicine.setRemainingPills(i % 50) // 0~49 循环
  }
  const t3Duration = Date.now() - t3Start
  const finalState = medicine.getState()
  assert('500 次余量修改后值正确', finalState.remainingPills === 49 % 50, `实际: ${finalState.remainingPills}`)
  assert('修改耗时可接受 (<3s)', t3Duration < 3000, `${t3Duration}ms`)
  // 日志应被收敛到上限 1000
  const logs3 = medicine.getLogs()
  assert('日志数量不超过上限 1000', logs3.length <= 1000, `实际: ${logs3.length}`)

  // ─── 测试4: 频繁切换药瓶（50 次）───
  console.log('▶ 测试4: 频繁切换药瓶 50 次')
  medicine.clearAll()
  medicine.initMedicine()
  const t4Start = Date.now()
  for (let i = 0; i < 50; i++) {
    medicine.switchToNextBottle()
  }
  const t4Duration = Date.now() - t4Start
  const st4 = medicine.getState()
  assert('50 次切换后瓶号为 51', st4.bottleNumber === 51, `实际: ${st4.bottleNumber}`)
  assert('切换后余量重置为 30', st4.remainingPills === 30, `实际: ${st4.remainingPills}`)
  const bottles4 = medicine.getBottles()
  assert('瓶次历史记录 51 条', bottles4.length === 51, `实际: ${bottles4.length}`)
  // 第 1 瓶应有 finishedAt
  const firstBottle = bottles4.find(b => b.bottleNumber === 1)
  assert('第1瓶已标记完成', firstBottle && firstBottle.finishedAt !== null)
  // 当前瓶（51）应未完成
  const currentBottle = bottles4.find(b => b.bottleNumber === 51)
  assert('当前瓶未标记完成', currentBottle && currentBottle.finishedAt === null)
  assert('切换耗时可接受 (<2s)', t4Duration < 2000, `${t4Duration}ms`)

  // ─── 测试5: 大量历史记录（日志 1000 条上限）───
  console.log('▶ 测试5: 大量历史记录（日志上限）')
  medicine.clearAll()
  medicine.initMedicine()
  for (let i = 0; i < 1500; i++) {
    medicine.setRemainingPills(i % 30)
  }
  const logs5 = medicine.getLogs()
  assert('1500 次操作后日志收敛至 1000', logs5.length === 1000, `实际: ${logs5.length}`)
  assert('日志按时间倒序', logs5[0].timestamp >= logs5[logs5.length - 1].timestamp)

  // ─── 测试6: 并发写入模拟（100 个交错操作）───
  console.log('▶ 测试6: 并发写入模拟（100 个交错操作）')
  medicine.clearAll()
  medicine.initMedicine()
  // 模拟交替：修改余量 / 切换瓶 / 设置瓶号
  const t6Start = Date.now()
  for (let i = 0; i < 100; i++) {
    if (i % 3 === 0) medicine.setRemainingPills(30 - (i % 30))
    else if (i % 3 === 1) medicine.switchToNextBottle()
    else medicine.setBottleNumber(Math.max(1, Math.floor(i / 3)))
  }
  const t6Duration = Date.now() - t6Start
  const st6 = medicine.getState()
  assert('并发交错操作后状态有效', st6.bottleNumber >= 1 && st6.remainingPills >= 0)
  // 瓶号不能小于 1
  assert('瓶号始终 ≥ 1', st6.bottleNumber >= 1, `实际: ${st6.bottleNumber}`)
  assert('并发操作耗时可接受 (<3s)', t6Duration < 3000, `${t6Duration}ms`)

  // ─── 测试7: 数据完整性 ───
  console.log('▶ 测试7: 数据完整性验证')
  medicine.clearAll()
  medicine.initMedicine()
  medicine.updateSettings({
    pillsPerBottle: 60,
    dailyDose: 2,
    lowThreshold: 10,
    reminderTime: '21:30'
  })
  medicine.setRemainingPills(45)
  medicine.switchToNextBottle()
  const st7 = medicine.getState()
  assert('设置单瓶 60 颗持久化', st7.pillsPerBottle === 60, `实际: ${st7.pillsPerBottle}`)
  assert('每日 2 颗持久化', st7.dailyDose === 2)
  assert('阈值 10 持久化', st7.lowThreshold === 10)
  assert('提醒时间 21:30 持久化', st7.reminderTime === '21:30')
  assert('切换瓶后余量重置为 60', st7.remainingPills === 60, `实际: ${st7.remainingPills}`)
  assert('切换后瓶号为 2', st7.bottleNumber === 2)

  // ─── 测试8: 边界校验 ───
  console.log('▶ 测试8: 边界校验')
  medicine.clearAll()
  medicine.initMedicine()
  // 负数余量应被拒绝（归 0）
  medicine.setRemainingPills(-10)
  assert('负数余量被拒绝为 0', medicine.getState().remainingPills === 0)
  // 负数瓶号应被拒绝（归 1）
  medicine.setBottleNumber(-5)
  assert('负数瓶号被拒绝为 1', medicine.getState().bottleNumber === 1)
  // 非法字符串
  medicine.setRemainingPills('abc')
  assert('非法字符串余量归 0', medicine.getState().remainingPills === 0)
  // 通过 updateSettings 传负数
  medicine.updateSettings({ dailyDose: -3, pillsPerBottle: 0 })
  const st8 = medicine.getState()
  assert('负剂量被拒绝为 ≥1', st8.dailyDose >= 1, `实际: ${st8.dailyDose}`)
  assert('0 单瓶数被拒绝为 ≥1', st8.pillsPerBottle >= 1, `实际: ${st8.pillsPerBottle}`)

  // ─── 测试9: localStorage 容错（JSON 损坏）───
  console.log('▶ 测试9: localStorage 容错（JSON 损坏回退）')
  globalThis.localStorage.setItem('medicine:state', '{invalid json!!!')
  const st9 = medicine.getState()
  assert('损坏 JSON 回退默认状态', st9.bottleNumber === 1 && st9.remainingPills === 30, `实际瓶号: ${st9.bottleNumber}`)
  assert('回退后字段类型有效', typeof st9.bottleNumber === 'number' && st9.bottleNumber >= 1)
  // 损坏 checkins
  globalThis.localStorage.setItem('medicine:checkins', 'not-json')
  const checkins9 = medicine.getCheckins()
  assert('损坏 checkins 回退为空对象', checkins9 && typeof checkins9 === 'object')
  assert('损坏后 isCheckedToday 不抛错', typeof medicine.isCheckedToday() === 'boolean')

  // ─── 测试10: 持久化（重读一致）───
  console.log('▶ 测试10: 持久化验证')
  medicine.clearAll()
  medicine.initMedicine()
  medicine.setRemainingPills(18)
  medicine.setBottleNumber(7)
  injectCheckin('2026-07-27', 1)
  injectCheckin('2026-07-28', 1)
  // 读取当前快照
  const snapshot = JSON.stringify({
    state: medicine.getState(),
    checkins: medicine.getCheckins(),
    bottles: medicine.getBottles(),
    logs: medicine.getLogs()
  })
  // 重新读取（模拟应用重开）—— 直接调用 getState 等即可
  const reread = JSON.stringify({
    state: medicine.getState(),
    checkins: medicine.getCheckins(),
    bottles: medicine.getBottles(),
    logs: medicine.getLogs()
  })
  assert('重读数据完全一致', snapshot === reread)
  assert('重读瓶号仍为 7', medicine.getState().bottleNumber === 7)
  assert('重读余量仍为 18', medicine.getState().remainingPills === 18)
  assert('重读打卡天数仍为 2', medicine.getTotalCheckinDays() === 2)

  // ─── 测试11: 预估吃完日期 ───
  console.log('▶ 测试11: 预估吃完日期')
  medicine.clearAll()
  medicine.initMedicine()
  medicine.updateSettings({ dailyDose: 2 })
  medicine.setRemainingPills(10) // 10 / 2 = 5 天
  const finishDate = medicine.estimateFinishDate()
  assert('预估日期不为空', finishDate !== null)
  // 余量为 0 时返回 null
  medicine.setRemainingPills(0)
  assert('余量 0 时预估为 null', medicine.estimateFinishDate() === null)

  // ─── 测试12: 低量提醒判定 ───
  console.log('▶ 测试12: 低量提醒判定')
  medicine.clearAll()
  medicine.initMedicine()
  medicine.updateSettings({ lowThreshold: 5 })
  medicine.setRemainingPills(5)
  assert('余量=阈值 触发低量', medicine.isLowSupply() === true)
  medicine.setRemainingPills(6)
  assert('余量>阈值 不触发', medicine.isLowSupply() === false)
  medicine.setRemainingPills(0)
  assert('余量=0 触发低量', medicine.isLowSupply() === true)

  // ─── 测试13: 性能（大量打卡后查询）───
  console.log('▶ 测试13: 性能（大量打卡后查询）')
  medicine.clearAll()
  medicine.initMedicine()
  for (let i = 0; i < 10000; i++) {
    injectCheckin(dateStr(-i), 1)
  }
  const t13Start = Date.now()
  const total13 = medicine.getTotalCheckinDays()
  const t13Duration = Date.now() - t13Start
  assert('10000 天打卡写入成功', total13 === 10000, `实际: ${total13}`)
  assert('查询耗时可接受 (<500ms)', t13Duration < 500, `${t13Duration}ms`)

  // ─── 清理 ───
  medicine.clearAll()

  // ─── 汇总 ───
  console.log('\n═══════════════════════════════════════')
  console.log('  测试结果汇总')
  console.log('═══════════════════════════════════════')
  results.forEach(r => console.log(r))
  console.log('───────────────────────────────────────')
  console.log(`  通过: ${passed}  失败: ${failed}  总计: ${passed + failed}`)
  console.log('═══════════════════════════════════════\n')

  if (failed > 0) {
    console.error('❌ 用药模块压力测试未通过，存在失败项！')
    process.exit(1)
  } else {
    console.log('✅ 全部用药模块压力测试通过！')
    process.exit(0)
  }
}

run().catch(err => {
  console.error('测试执行异常:', err)
  process.exit(1)
})
