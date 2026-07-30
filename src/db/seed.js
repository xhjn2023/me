import { tasksApi, coursesApi, booksApi, reviewsApi, studyRecordsApi, lifeRecordsApi, sideProjectsApi, todayStr } from './database'
import { PHOTOGRAPHY_COURSES } from '../pages/study/courses'

// 摄影课程种子数据（剥离章节大纲，只存基础信息进数据库）
const PHOTO_SEED = PHOTOGRAPHY_COURSES.map(c => ({
  title: c.title,
  instructor: c.instructor,
  totalLessons: c.totalLessons,
  currentLessons: 0,
  category: c.category,
  progress: 0,
  updatedAt: Date.now()
}))

const SEED_DATA = {
  tasks: [
    { title: '晨会 · 同步今日目标', done: true, priority: 1, category: '工作', time: '08:30', createdAt: Date.now() - 3600000 },
    { title: '巡店检查 · 货架陈列', done: true, priority: 1, category: '工作', time: '09:00', createdAt: Date.now() - 7200000 },
    { title: '面试2名收银员', done: false, priority: 1, category: '工作', time: '14:00', createdAt: Date.now() - 10800000 },
    { title: '核对月度供应商账单', done: false, priority: 1, category: '工作', time: '16:00', createdAt: Date.now() - 14400000 },
    { title: '学习《零售管理》第2章', done: false, priority: 0, category: '学习', time: '20:00', createdAt: Date.now() - 18000000 },
    { title: '发布小红书新品内容', done: false, priority: 0, category: '副业', time: '21:00', createdAt: Date.now() - 21600000 },
    { title: '跑步30分钟', done: true, priority: 0, category: '生活', time: '07:00', createdAt: Date.now() - 25200000 }
  ],
  courses: [
    { title: '人力资源六级考证冲刺', instructor: '王教授', totalLessons: 60, currentLessons: 39, category: '人事专业', progress: 65, updatedAt: Date.now() },
    { title: '劳动法实务精讲', instructor: '李律师', totalLessons: 30, currentLessons: 12, category: '人事专业', progress: 40, updatedAt: Date.now() },
    { title: '超市经营管理实战', instructor: '张经理', totalLessons: 45, currentLessons: 20, category: '超市经营', progress: 44, updatedAt: Date.now() },
    { title: '内心能量修炼', instructor: '陈导师', totalLessons: 20, currentLessons: 8, category: '内心能量', progress: 40, updatedAt: Date.now() }
  ],
  books: [
    { title: '《人力资源管理》第15版', author: '加里·德斯勒', category: '人事专业', recommended: true },
    { title: '《零售管理精要》', author: '迈克尔·利维', category: '超市经营', recommended: true },
    { title: '《心流：最优体验心理学》', author: '米哈里·契克森米哈赖', category: '内心能量', recommended: true }
  ],
  studyRecords: [
    { date: todayStr(), duration: 90, category: '人事专业', createdAt: Date.now() },
    { date: todayStr(), duration: 60, category: '超市经营', createdAt: Date.now() - 3600000 },
    { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), duration: 120, category: '人事专业', createdAt: Date.now() - 86400000 }
  ],
  lifeRecords: [
    { date: todayStr(), type: '运动', content: '跑步30分钟', createdAt: Date.now() },
    { date: todayStr(), type: '饮食', content: '三餐规律，多喝水', createdAt: Date.now() - 7200000 }
  ],
  sideProjects: [
    { title: '小红书运营', category: '自媒体', progress: 60, createdAt: Date.now() },
    { title: '副业项目规划', category: '副业', progress: 30, createdAt: Date.now() - 86400000 }
  ]
}

export async function initializeData() {
  try {
    const existingCourses = await coursesApi.getAll()
    const isFirstInit = existingCourses.length === 0

    if (isFirstInit) {
      console.log('🌱 开始初始化种子数据...')
      const today = todayStr()

      // 检查今日是否已有任务
      const existingTasks = await tasksApi.getByDate(today)
      if (existingTasks.length === 0) {
        for (const task of SEED_DATA.tasks) {
          await tasksApi.add({ ...task, date: today })
        }
      }

      for (const course of [...SEED_DATA.courses, ...PHOTO_SEED]) {
        await coursesApi.add(course)
      }

      for (const book of SEED_DATA.books) {
        await booksApi.add(book)
      }

      const existingReviews = await reviewsApi.getAll()
      if (existingReviews.length === 0) {
        await reviewsApi.upsert({ date: todayStr(), mood: 'happy', physical: 7.5, mental: 8.0, intellectual: 7.0, emotional: 8.5, completion: 43 })
        await reviewsApi.upsert({ date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), mood: 'good', physical: 7.0, mental: 7.5, intellectual: 6.5, emotional: 8.0, completion: 90 })
      }

      const existingStudyRecords = await studyRecordsApi.getByDates([today])
      if (existingStudyRecords.length === 0) {
        for (const record of SEED_DATA.studyRecords) {
          await studyRecordsApi.add(record)
        }
      }

      const existingLifeRecords = await lifeRecordsApi.getByDate(today)
      if (existingLifeRecords.length === 0) {
        for (const record of SEED_DATA.lifeRecords) {
          await lifeRecordsApi.add(record)
        }
      }

      const existingSideProjects = await sideProjectsApi.getAll()
      if (existingSideProjects.length === 0) {
        for (const project of SEED_DATA.sideProjects) {
          await sideProjectsApi.add(project)
        }
      }

      console.log('✅ 种子数据初始化完成')
    } else {
      // 老用户增量补充：检查摄影课程是否已存在，缺失则插入
      const existingTitles = new Set(existingCourses.map(c => c.title))
      const missingPhoto = PHOTO_SEED.filter(c => !existingTitles.has(c.title))
      if (missingPhoto.length > 0) {
        console.log(`📷 增量补充 ${missingPhoto.length} 门摄影课程`)
        for (const course of missingPhoto) {
          await coursesApi.add(course)
        }
        console.log('✅ 摄影课程补充完成')
      } else {
        console.log('✅ 数据库已有数据，跳过初始化')
      }
    }
  } catch (err) {
    console.error('❌ 种子数据初始化失败:', err.message)
  }
}
