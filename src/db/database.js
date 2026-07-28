import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cszkekdciqgimsvfgons.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_EgAro7H2v76ZHWTbzeN0vA_SToYDLgx'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
})

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

export async function getStreakDays(records, field) {
  if (!records || records.length === 0) return 0
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

// camelCase → snake_case 字段名转换，避免 PostgREST 报错
function toDbRow(data) {
  if (!data || typeof data !== 'object') return data
  const { createdAt, ...rest } = data
  return createdAt != null ? { ...rest, created_at: createdAt } : rest
}

// ─── Tasks ───
export const tasksApi = {
  async getByDate(date, category) {
    let q = supabase.from('tasks').select('*').eq('date', date)
    if (category && category !== 'all') q = q.eq('category', category)
    const { data, error } = await q.order('done', { ascending: true }).order('time', { ascending: true })
    if (error) throw error
    return data || []
  },
  async add(data) {
    const { data: row, error } = await supabase.from('tasks').insert(toDbRow(data)).select().single()
    if (error) throw error
    return row
  },
  async update(id, data) {
    const { data: row, error } = await supabase.from('tasks').update(data).eq('id', id).select().single()
    if (error) throw error
    return row
  },
  async delete(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  }
}

// ─── Courses ───
export const coursesApi = {
  async getAll(category) {
    let q = supabase.from('courses').select('*')
    if (category) q = q.eq('category', category)
    const { data, error } = await q.order('updated_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async add(data) {
    const { data: row, error } = await supabase.from('courses').insert(data).select().single()
    if (error) throw error
    return row
  },
  async update(id, data) {
    const { data: row, error } = await supabase.from('courses').update(data).eq('id', id).select().single()
    if (error) throw error
    return row
  },
  async delete(id) {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
  }
}

// ─── Reviews ───
export const reviewsApi = {
  async getByDate(date) {
    const { data, error } = await supabase.from('reviews').select('*').eq('date', date)
    if (error) throw error
    return (data && data[0]) || null
  },
  async getAll() {
    const { data, error } = await supabase.from('reviews').select('*').order('date', { ascending: false }).limit(30)
    if (error) throw error
    return data || []
  },
  async upsert(data) {
    const { data: row, error } = await supabase.from('reviews').upsert(data, { onConflict: 'date' }).select().single()
    if (error) throw error
    return row
  }
}

// ─── Study Records ───
export const studyRecordsApi = {
  async getByDates(dates) {
    const { data, error } = await supabase.from('study_records').select('*').in('date', dates)
    if (error) throw error
    return data || []
  },
  async add(data) {
    const { data: row, error } = await supabase.from('study_records').insert(data).select().single()
    if (error) throw error
    return row
  }
}

// ─── Books ───
export const booksApi = {
  async getAll(category) {
    let q = supabase.from('books').select('*')
    if (category) q = q.eq('category', category)
    const { data, error } = await q
    if (error) throw error
    return data || []
  },
  async add(data) {
    const { data: row, error } = await supabase.from('books').insert(data).select().single()
    if (error) throw error
    return row
  }
}

// ─── Life Records ───
export const lifeRecordsApi = {
  async getByDate(date) {
    const { data, error } = await supabase.from('life_records').select('*').eq('date', date).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async add(data) {
    const { data: row, error } = await supabase.from('life_records').insert(toDbRow(data)).select().single()
    if (error) throw error
    return row
  },
  async delete(id) {
    const { error } = await supabase.from('life_records').delete().eq('id', id)
    if (error) throw error
  }
}

// ─── Side Projects ───
export const sideProjectsApi = {
  async getAll() {
    const { data, error } = await supabase.from('side_projects').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async add(data) {
    const { data: row, error } = await supabase.from('side_projects').insert(toDbRow(data)).select().single()
    if (error) throw error
    return row
  },
  async update(id, data) {
    const { data: row, error } = await supabase.from('side_projects').update(data).eq('id', id).select().single()
    if (error) throw error
    return row
  },
  async delete(id) {
    const { error } = await supabase.from('side_projects').delete().eq('id', id)
    if (error) throw error
  }
}

// ─── Medicine State ───
export const medicineStateApi = {
  async get() {
    const { data, error } = await supabase.from('medicine_state').select('*').eq('id', 1).single()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },
  async upsert(data) {
    const { data: row, error } = await supabase
      .from('medicine_state')
      .upsert({ id: 1, ...data }, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return row
  }
}

// ─── Medicine Checkins ───
export const medicineCheckinsApi = {
  async getAll() {
    const { data, error } = await supabase.from('medicine_checkins').select('*')
    if (error) throw error
    const map = {}
    for (const row of data || []) map[row.date] = row.dose
    return map
  },
  async add(date, dose) {
    const { error } = await supabase.from('medicine_checkins').upsert({ date, dose }, { onConflict: 'date' })
    if (error) throw error
  },
  async remove(date) {
    const { error } = await supabase.from('medicine_checkins').delete().eq('date', date)
    if (error) throw error
  }
}

// ─── Medicine Bottles ───
export const medicineBottlesApi = {
  async getAll() {
    const { data, error } = await supabase.from('medicine_bottles').select('*').order('bottle_number', { ascending: true })
    if (error) throw error
    return (data || []).map(b => ({
      bottleNumber: b.bottle_number,
      startedAt: b.started_at,
      finishedAt: b.finished_at,
      totalPills: b.total_pills
    }))
  },
  async add(bottle) {
    const { error } = await supabase.from('medicine_bottles').insert({
      bottle_number: bottle.bottleNumber,
      started_at: bottle.startedAt,
      finished_at: bottle.finishedAt,
      total_pills: bottle.totalPills
    })
    if (error) throw error
  },
  async finish(bottleNumber) {
    const { error } = await supabase
      .from('medicine_bottles')
      .update({ finished_at: todayStr() })
      .eq('bottle_number', bottleNumber)
      .is('finished_at', null)
    if (error) throw error
  }
}

// ─── Medicine Logs ───
export const medicineLogsApi = {
  async getAll() {
    const { data, error } = await supabase.from('medicine_logs').select('*').order('timestamp', { ascending: false }).limit(200)
    if (error) throw error
    return (data || []).map(l => ({
      id: String(l.id),
      date: l.date,
      action: l.action,
      note: l.note || '',
      timestamp: l.timestamp
    }))
  },
  async add(action, note = '') {
    const { error } = await supabase.from('medicine_logs').insert({
      date: todayStr(),
      action,
      note,
      timestamp: Date.now()
    })
    if (error) throw error
  }
}
