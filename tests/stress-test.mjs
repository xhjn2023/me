/**
 * 压力测试 - 工作台数据持久化层
 * 使用 fake-indexeddb 模拟浏览器 IndexedDB 环境
 * 测试内容：批量写入、读取、并发、大数据量、数据完整性、删除恢复
 */
import 'fake-indexeddb/auto'
import Dexie from 'dexie'

// 复刻数据库结构（与 src/db/database.js 一致）
class WorkbenchDB extends Dexie {
  constructor() {
    super('MeWorkbenchDB_Test')
    this.version(1).stores({
      tasks: '++id, date, done, priority, createdAt',
      notes: '++id, updatedAt, pinned',
      journals: '++id, &date, mood',
      settings: '&key'
    })
  }
}

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

async function run() {
  console.log('═══════════════════════════════════════')
  console.log('  工作台压力测试 - 开始')
  console.log('═══════════════════════════════════════\n')

  const db = new WorkbenchDB()

  // ─────────────────────────────────────
  // 测试1: 批量写入性能（1000条任务）
  // ─────────────────────────────────────
  console.log('▶ 测试1: 批量写入 1000 条任务')
  const t1Start = Date.now()
  const batch = []
  for (let i = 0; i < 1000; i++) {
    batch.push({
      title: `压力测试任务 ${i}`,
      done: i % 3 === 0,
      priority: i % 2,
      date: `2026-07-${String((i % 28) + 1).padStart(2, '0')}`,
      createdAt: Date.now() + i
    })
  }
  await db.tasks.bulkAdd(batch)
  const t1Duration = Date.now() - t1Start
  const count1 = await db.tasks.count()
  assert('批量写入1000条任务', count1 === 1000, `实际数量: ${count1}`)
  assert('写入耗时可接受 (<5s)', t1Duration < 5000, `${t1Duration}ms`)
  results.push(`     ⏱ 写入耗时: ${t1Duration}ms`)

  // ─────────────────────────────────────
  // 测试2: 批量读取与查询性能
  // ─────────────────────────────────────
  console.log('▶ 测试2: 查询性能（索引查询）')
  const t2Start = Date.now()
  const dayTasks = await db.tasks.where('date').equals('2026-07-15').toArray()
  const t2Duration = Date.now() - t2Start
  assert('按日期索引查询返回结果', dayTasks.length > 0, `数量: ${dayTasks.length}`)
  assert('查询耗时可接受 (<500ms)', t2Duration < 500, `${t2Duration}ms`)
  results.push(`     ⏱ 查询耗时: ${t2Duration}ms`)

  // ─────────────────────────────────────
  // 测试3: 并发写入（模拟多标签页同时操作）
  // ─────────────────────────────────────
  console.log('▶ 测试3: 并发写入 (50个并发)')
  const t3Start = Date.now()
  const concurrentOps = []
  for (let i = 0; i < 50; i++) {
    concurrentOps.push(db.notes.add({
      title: `并发笔记 ${i}`,
      content: `内容 ${'x'.repeat(100)}`,
      pinned: i % 5 === 0,
      updatedAt: Date.now() + i
    }))
  }
  const noteIds = await Promise.all(concurrentOps)
  const t3Duration = Date.now() - t3Start
  const noteCount = await db.notes.count()
  assert('50个并发写入全部成功', noteIds.length === 50 && noteCount === 50, `数量: ${noteCount}`)
  assert('并发写入无丢失', noteIds.every(id => id !== undefined), '存在undefined')
  assert('并发写入耗时可接受 (<3s)', t3Duration < 3000, `${t3Duration}ms`)
  results.push(`     ⏱ 并发耗时: ${t3Duration}ms`)

  // ─────────────────────────────────────
  // 测试4: 大文本笔记存储
  // ─────────────────────────────────────
  console.log('▶ 测试4: 大文本存储 (1MB笔记)')
  const bigContent = 'A'.repeat(1024 * 1024) // 1MB
  const bigNoteId = await db.notes.add({
    title: '大文本笔记',
    content: bigContent,
    pinned: false,
    updatedAt: Date.now()
  })
  const bigNote = await db.notes.get(bigNoteId)
  assert('1MB大文本写入成功', bigNote !== undefined)
  assert('1MB大文本内容完整', bigNote && bigNote.content.length === 1024 * 1024, `长度: ${bigNote?.content.length}`)

  // ─────────────────────────────────────
  // 测试5: 数据完整性 - 更新后保持一致
  // ─────────────────────────────────────
  console.log('▶ 测试5: 更新数据完整性')
  const taskId = noteIds[0]
  await db.notes.update(taskId, { title: '更新后的标题', pinned: true })
  const updated = await db.notes.get(taskId)
  assert('更新标题生效', updated.title === '更新后的标题')
  assert('更新pinned生效', updated.pinned === true)
  assert('未更新字段保持不变', updated.content.includes('内容'))

  // ─────────────────────────────────────
  // 测试6: 日记日期唯一约束
  // ─────────────────────────────────────
  console.log('▶ 测试6: 日记日期唯一约束')
  const today = '2026-07-28'
  await db.journals.add({ date: today, content: '今天日记', mood: 'good', updatedAt: Date.now() })
  let duplicateError = null
  try {
    await db.journals.add({ date: today, content: '重复日记', mood: 'ok', updatedAt: Date.now() })
  } catch (e) {
    duplicateError = e
  }
  assert('同日期日记被拒绝(唯一约束)', duplicateError !== null, '未触发约束')
  const journalCount = await db.journals.where('date').equals(today).count()
  assert('同日期仅保留一条', journalCount === 1, `数量: ${journalCount}`)

  // ─────────────────────────────────────
  // 测试7: 批量删除与恢复验证
  // ─────────────────────────────────────
  console.log('▶ 测试7: 批量删除')
  const allTaskIds = await db.tasks.toCollection().primaryKeys()
  await db.tasks.bulkDelete(allTaskIds)
  const afterDelete = await db.tasks.count()
  assert('批量删除全部任务', afterDelete === 0, `剩余: ${afterDelete}`)

  // ─────────────────────────────────────
  // 测试8: 数据持久化模拟（关闭再打开）
  // ─────────────────────────────────────
  console.log('▶ 测试8: 数据持久化（重新打开数据库）')
  // 先写入数据，记录id
  const persistId = await db.notes.add({ title: '持久化测试', content: '关掉再打开还在', pinned: false, updatedAt: Date.now() })
  // 关闭数据库
  db.close()
  // 重新打开（模拟重新打开App）
  const db2 = new WorkbenchDB()
  // 用主键直接查询（不依赖索引）
  const persisted = await db2.notes.get(persistId)
  assert('数据在重新打开后依然存在', persisted !== undefined)
  assert('数据内容完整', persisted && persisted.content === '关掉再打开还在')

  // ─────────────────────────────────────
  // 测试9: 极限压力（5000条混合数据）
  // ─────────────────────────────────────
  console.log('▶ 测试9: 极限压力 (5000条混合数据)')
  const t9Start = Date.now()
  const bigBatch = []
  for (let i = 0; i < 5000; i++) {
    if (i % 3 === 0) {
      bigBatch.push({ table: 'tasks', data: { title: `极限任务${i}`, done: false, priority: 0, date: '2026-07-28', createdAt: Date.now() + i } })
    } else if (i % 3 === 1) {
      bigBatch.push({ table: 'notes', data: { title: `极限笔记${i}`, content: `内容${i}`, pinned: false, updatedAt: Date.now() + i } })
    } else {
      bigBatch.push({ table: 'journals', data: { date: `2026-06-${String((i % 28) + 1).padStart(2, '0')}`, content: `日记${i}`, mood: 'ok', updatedAt: Date.now() + i } })
    }
  }
  // 使用事务批量写入
  await db2.transaction('rw', db2.tasks, db2.notes, db2.journals, async () => {
    const tasksBatch = bigBatch.filter(b => b.table === 'tasks').map(b => b.data)
    const notesBatch = bigBatch.filter(b => b.table === 'notes').map(b => b.data)
    const journalsBatch = bigBatch.filter(b => b.table === 'journals').map(b => b.data)
    await db2.tasks.bulkAdd(tasksBatch)
    await db2.notes.bulkAdd(notesBatch)
    // 日记有唯一约束，跳过重复日期
    const seenDates = new Set()
    const uniqueJournals = journalsBatch.filter(j => {
      if (seenDates.has(j.date)) return false
      seenDates.add(j.date)
      return true
    })
    await db2.journals.bulkAdd(uniqueJournals)
  })
  const t9Duration = Date.now() - t9Start
  const finalTasks = await db2.tasks.count()
  const finalNotes = await db2.notes.count()
  assert('极限写入5000条-任务正确', finalTasks >= 1666, `数量: ${finalTasks}`)
  assert('极限写入5000条-笔记正确', finalNotes >= 1666, `数量: ${finalNotes}`)
  assert('极限写入耗时可接受 (<10s)', t9Duration < 10000, `${t9Duration}ms`)
  results.push(`     ⏱ 极限写入耗时: ${t9Duration}ms`)

  // 清理
  await db2.delete()

  // ─────────────────────────────────────
  // 汇总
  // ─────────────────────────────────────
  console.log('\n═══════════════════════════════════════')
  console.log('  测试结果汇总')
  console.log('═══════════════════════════════════════')
  results.forEach(r => console.log(r))
  console.log('───────────────────────────────────────')
  console.log(`  通过: ${passed}  失败: ${failed}  总计: ${passed + failed}`)
  console.log('═══════════════════════════════════════\n')

  if (failed > 0) {
    console.error('❌ 压力测试未通过，存在失败项！')
    process.exit(1)
  } else {
    console.log('✅ 全部压力测试通过！')
    process.exit(0)
  }
}

run().catch(err => {
  console.error('测试执行异常:', err)
  process.exit(1)
})
