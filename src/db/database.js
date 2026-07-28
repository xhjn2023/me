import Dexie from 'dexie'

/**
 * 工作台数据库 - 基于 Dexie (IndexedDB 封装)
 * 数据保存在浏览器本地，关掉再打开依然存在
 */
class WorkbenchDB extends Dexie {
  constructor() {
    super('MeWorkbenchDB')

    // 版本1：初始结构
    this.version(1).stores({
      // 任务表：id 主键，date 索引用于按天查询
      tasks: '++id, date, done, priority, createdAt',
      // 笔记表：id 主键，updatedAt 索引用于排序
      notes: '++id, updatedAt, pinned',
      // 日记表：id 主键，date 唯一索引（每天一篇）
      journals: '++id, &date, mood',
      // 设置表：key 主键
      settings: '&key'
    })
  }
}

export const db = new WorkbenchDB()

// 今日日期字符串 YYYY-MM-DD
export function todayStr() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

// 格式化日期为中文
export function formatDateCN(dateStr) {
  const d = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}
