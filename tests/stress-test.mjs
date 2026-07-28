/**
 * 压力测试 - 工作台数据持久化层
 * 使用 fake-indexeddb 模拟浏览器 IndexedDB 环境
 * 测试内容：批量写入、读取、并发、大数据量、数据完整性、删除恢复
 */
import 'fake-indexeddb/auto'
import Dexie from 'dexie'

class WorkbenchDB extends Dexie {
  constructor() {
    super('MeWorkbenchDB_Test')
    this.version(2).stores({
      tasks: '++id, date, done, priority, category, time, createdAt',
      notes: '++id, updatedAt, pinned',
      journals: '++id, &date, mood',
      settings: '&key',
      courses: '++id, category, progress, updatedAt',
      reviews: '++id, &date, mood, physical, mental, intellectual, emotional',
      studyRecords: '++id, date, duration, category, createdAt',
      books: '++id, title, author, category, recommended',
      lifeRecords: '++id, date, type, content, createdAt',
      sideProjects: '++id, title, category, progress, createdAt'
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

  // 测试1: 批量写入任务（1000条）
  console.log('▶ 测试1: 批量写入 1000 条任务')
  const t1Start = Date.now()
  const batch = []
  for (let i = 0; i < 1000; i++) {
    batch.push({
      title: `压力测试任务 ${i}`,
      done: i % 3 === 0,
      priority: i % 2,
      category: ['工作', '学习', '生活', '副业'][i % 4],
      time: `${String(8 + (i % 14)).padStart(2, '0')}:00`,
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

  // 测试2: 查询性能
  console.log('▶ 测试2: 查询性能')
  const t2Start = Date.now()
  const dayTasks = await db.tasks.where('date').equals('2026-07-15').toArray()
  const t2Duration = Date.now() - t2Start
  assert('按日期索引查询返回结果', dayTasks.length > 0, `数量: ${dayTasks.length}`)
  assert('查询耗时可接受 (<500ms)', t2Duration < 500, `${t2Duration}ms`)

  // 测试3: 课程CRUD
  console.log('▶ 测试3: 课程数据CRUD')
  const courseId = await db.courses.add({
    title: '测试课程',
    instructor: '测试讲师',
    totalLessons: 30,
    currentLessons: 15,
    category: '人事专业',
    progress: 50,
    updatedAt: Date.now()
  })
  const course = await db.courses.get(courseId)
  assert('课程创建成功', course !== undefined)
  assert('课程数据正确', course.title === '测试课程' && course.progress === 50)
  
  await db.courses.update(courseId, { progress: 80 })
  const updatedCourse = await db.courses.get(courseId)
  assert('课程更新成功', updatedCourse.progress === 80)

  // 测试4: 复盘数据CRUD
  console.log('▶ 测试4: 复盘数据CRUD')
  const reviewId = await db.reviews.add({
    date: '2026-07-28',
    mood: 'happy',
    physical: 7.5,
    mental: 8.0,
    intellectual: 7.0,
    emotional: 8.5
  })
  const review = await db.reviews.get(reviewId)
  assert('复盘创建成功', review !== undefined)
  assert('复盘数据正确', review.mood === 'happy' && review.physical === 7.5)

  // 测试5: 学习记录
  console.log('▶ 测试5: 学习记录统计')
  const studyRecords = []
  for (let i = 0; i < 100; i++) {
    studyRecords.push({
      date: `2026-07-${String((i % 28) + 1).padStart(2, '0')}`,
      duration: 30 + (i % 60),
      category: ['人事专业', '超市经营', '内心能量'][i % 3],
      createdAt: Date.now() + i
    })
  }
  await db.studyRecords.bulkAdd(studyRecords)
  const totalStudy = await db.studyRecords.count()
  assert('学习记录批量写入成功', totalStudy >= 100, `数量: ${totalStudy}`)

  // 测试6: 生活记录CRUD
  console.log('▶ 测试6: 生活记录CRUD')
  const lifeId = await db.lifeRecords.add({
    date: '2026-07-28',
    type: '运动',
    content: '跑步30分钟',
    createdAt: Date.now()
  })
  const lifeRecord = await db.lifeRecords.get(lifeId)
  assert('生活记录创建成功', lifeRecord !== undefined)
  assert('生活记录类型正确', lifeRecord.type === '运动')

  // 测试7: 副业项目CRUD
  console.log('▶ 测试7: 副业项目CRUD')
  const sideId = await db.sideProjects.add({
    title: '小红书运营',
    category: '自媒体',
    progress: 60,
    createdAt: Date.now()
  })
  const sideProject = await db.sideProjects.get(sideId)
  assert('副业项目创建成功', sideProject !== undefined)
  assert('副业项目进度正确', sideProject.progress === 60)

  // 测试8: 书籍推荐
  console.log('▶ 测试8: 书籍推荐')
  const bookId = await db.books.add({
    title: '《人力资源管理》',
    author: '加里·德斯勒',
    category: '人事专业',
    recommended: true
  })
  const book = await db.books.get(bookId)
  assert('书籍创建成功', book !== undefined)
  assert('书籍标记推荐', book.recommended === true)

  // 测试9: 并发写入（50个并发）
  console.log('▶ 测试9: 并发写入 (50个并发)')
  const t9Start = Date.now()
  const concurrentOps = []
  for (let i = 0; i < 50; i++) {
    concurrentOps.push(db.sideProjects.add({
      title: `并发项目 ${i}`,
      category: '自媒体',
      progress: i,
      createdAt: Date.now() + i
    }))
  }
  const sideIds = await Promise.all(concurrentOps)
  const t9Duration = Date.now() - t9Start
  const sideCount = await db.sideProjects.count()
  assert('50个并发写入全部成功', sideIds.length === 50)
  assert('副业项目总数正确', sideCount >= 50)
  assert('并发写入耗时可接受 (<3s)', t9Duration < 3000, `${t9Duration}ms`)

  // 测试10: 数据完整性
  console.log('▶ 测试10: 数据完整性验证')
  const allTasks = await db.tasks.toArray()
  const verifiedTask = allTasks.find(t => t.category === '工作')
  assert('任务分类字段存在', verifiedTask !== undefined, '未找到工作分类任务')
  
  const allLifeRecords = await db.lifeRecords.toArray()
  assert('生活记录总数正确', allLifeRecords.length >= 1)

  // 测试11: 批量删除
  console.log('▶ 测试11: 批量删除')
  const beforeDelete = await db.tasks.count()
  const allTaskIds = await db.tasks.toCollection().primaryKeys()
  await db.tasks.bulkDelete(allTaskIds)
  const afterDelete = await db.tasks.count()
  assert('批量删除全部任务', afterDelete === 0, `删除前: ${beforeDelete}, 删除后: ${afterDelete}`)

  // 测试12: 数据持久化
  console.log('▶ 测试12: 数据持久化验证')
  const persistId = await db.lifeRecords.add({
    date: '2026-07-28',
    type: '运动',
    content: '持久化测试',
    createdAt: Date.now()
  })
  db.close()
  const db2 = new WorkbenchDB()
  const persisted = await db2.lifeRecords.get(persistId)
  assert('数据在重新打开后依然存在', persisted !== undefined)
  assert('数据内容完整', persisted && persisted.content === '持久化测试')

  // 测试13: 极限压力（混合数据）
  console.log('▶ 测试13: 极限压力测试')
  const t13Start = Date.now()
  await db2.transaction('rw', db2.tasks, db2.courses, db2.reviews, async () => {
    const stressTasks = []
    const stressCourses = []
    const stressReviews = []
    for (let i = 0; i < 2000; i++) {
      stressTasks.push({
        title: `极限任务${i}`,
        done: false,
        priority: 0,
        category: '工作',
        time: `${String(i % 24).padStart(2, '0')}:00`,
        date: '2026-07-28',
        createdAt: Date.now() + i
      })
      if (i % 2 === 0) {
        stressCourses.push({
          title: `课程${i}`,
          instructor: '讲师',
          totalLessons: 30,
          currentLessons: i % 30,
          category: '人事专业',
          progress: Math.round((i % 30 / 30) * 100),
          updatedAt: Date.now() + i
        })
      }
      if (i % 5 === 0) {
        stressReviews.push({
          date: `2026-06-${String((i % 28) + 1).padStart(2, '0')}`,
          mood: 'ok',
          physical: 7,
          mental: 7,
          intellectual: 7,
          emotional: 7
        })
      }
    }
    await db2.tasks.bulkAdd(stressTasks)
    await db2.courses.bulkAdd(stressCourses)
    const seenDates = new Set()
    const uniqueReviews = stressReviews.filter(r => {
      if (seenDates.has(r.date)) return false
      seenDates.add(r.date)
      return true
    })
    await db2.reviews.bulkAdd(uniqueReviews)
  })
  const t13Duration = Date.now() - t13Start
  const finalTasks = await db2.tasks.count()
  const finalCourses = await db2.courses.count()
  assert('极限写入任务成功', finalTasks >= 2000, `任务数: ${finalTasks}`)
  assert('极限写入课程成功', finalCourses >= 1000, `课程数: ${finalCourses}`)
  assert('极限写入耗时可接受 (<10s)', t13Duration < 10000, `${t13Duration}ms`)

  // 清理
  await db2.delete()

  // 汇总
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
