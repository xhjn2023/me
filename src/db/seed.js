import { db, todayStr } from './database'

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
  reviews: [
    { date: todayStr(), mood: 'happy', physical: 7.5, mental: 8.0, intellectual: 7.0, emotional: 8.5, completion: 87 },
    { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), mood: 'good', physical: 7.0, mental: 7.5, intellectual: 6.5, emotional: 8.0, completion: 90 }
  ],
  studyRecords: [
    { date: todayStr(), duration: 90, category: '人事专业', createdAt: Date.now() },
    { date: todayStr(), duration: 60, category: '超市经营', createdAt: Date.now() - 3600000 },
    { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), duration: 120, category: '人事专业', createdAt: Date.now() - 86400000 }
  ],
  books: [
    { title: '《人力资源管理》第15版', author: '加里·德斯勒', category: '人事专业', recommended: true },
    { title: '《零售管理精要》', author: '迈克尔·利维', category: '超市经营', recommended: true },
    { title: '《心流：最优体验心理学》', author: '米哈里·契克森米哈赖', category: '内心能量', recommended: true }
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
  const existingCourses = await db.courses.count()
  if (existingCourses === 0) {
    for (const course of SEED_DATA.courses) {
      await db.courses.add(course)
    }
  }

  const existingBooks = await db.books.count()
  if (existingBooks === 0) {
    for (const book of SEED_DATA.books) {
      await db.books.add(book)
    }
  }

  const existingTasks = await db.tasks.where('date').equals(todayStr()).count()
  if (existingTasks === 0) {
    for (const task of SEED_DATA.tasks) {
      await db.tasks.add({ ...task, date: todayStr() })
    }
  }

  const existingReviews = await db.reviews.count()
  if (existingReviews === 0) {
    for (const review of SEED_DATA.reviews) {
      await db.reviews.add(review)
    }
  }

  const existingStudyRecords = await db.studyRecords.count()
  if (existingStudyRecords === 0) {
    for (const record of SEED_DATA.studyRecords) {
      await db.studyRecords.add(record)
    }
  }

  const existingLifeRecords = await db.lifeRecords.count()
  if (existingLifeRecords === 0) {
    for (const record of SEED_DATA.lifeRecords) {
      await db.lifeRecords.add(record)
    }
  }

  const existingSideProjects = await db.sideProjects.count()
  if (existingSideProjects === 0) {
    for (const project of SEED_DATA.sideProjects) {
      await db.sideProjects.add(project)
    }
  }
}
