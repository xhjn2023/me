import Dexie from 'dexie'

class WorkbenchDB extends Dexie {
  constructor() {
    super('MeWorkbenchDB')

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

export const db = new WorkbenchDB()

export function todayStr() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

export function formatDateCN(dateStr) {
  const d = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function getWeekDates() {
  const now = new Date()
  const start = new Date(now)
  const day = now.getDay() || 7
  start.setDate(now.getDate() - day + 1)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const tz = d.getTimezoneOffset() * 60000
    dates.push(new Date(d - tz).toISOString().slice(0, 10))
  }
  return dates
}

export async function getStreakDays(table, field) {
  const records = await table.orderBy(field).reverse().toArray()
  if (records.length === 0) return 0
  const today = todayStr()
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  
  let streak = 0
  const dates = new Set(records.map(r => r[field]))
  
  if (!dates.has(today) && !dates.has(yesterday)) return 0
  
  let checkDate = dates.has(today) ? today : yesterday
  while (dates.has(checkDate)) {
    streak++
    const d = new Date(checkDate)
    d.setDate(d.getDate() - 1)
    checkDate = d.toISOString().slice(0, 10)
  }
  return streak
}
