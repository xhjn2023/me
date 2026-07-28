import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cszkekdciqgimsvfgons.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_EgAro7H2v76ZHWTbzeN0vA_SToYDLgx'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
})

function todayStr() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

async function seed() {
  const today = todayStr()
  const yesterday = yesterdayStr()
  const now = Date.now()

  console.log('🌱 开始插入种子数据...')

  // Tasks
  const { error: taskErr } = await supabase.from('tasks').insert([
    { title: '晨会 · 同步今日目标', done: true, priority: 1, category: '工作', time: '08:30', date: today, created_at: now - 3600000 },
    { title: '巡店检查 · 货架陈列', done: true, priority: 1, category: '工作', time: '09:00', date: today, created_at: now - 7200000 },
    { title: '面试2名收银员', done: false, priority: 1, category: '工作', time: '14:00', date: today, created_at: now - 10800000 },
    { title: '核对月度供应商账单', done: false, priority: 1, category: '工作', time: '16:00', date: today, created_at: now - 14400000 },
    { title: '学习《零售管理》第2章', done: false, priority: 0, category: '学习', time: '20:00', date: today, created_at: now - 18000000 },
    { title: '发布小红书新品内容', done: false, priority: 0, category: '副业', time: '21:00', date: today, created_at: now - 21600000 },
    { title: '跑步30分钟', done: true, priority: 0, category: '生活', time: '07:00', date: today, created_at: now - 25200000 }
  ])
  if (taskErr) console.error('Tasks:', taskErr.message)
  else console.log('✅ Tasks 插入成功')

  // Courses
  const { error: courseErr } = await supabase.from('courses').insert([
    { title: '人力资源六级考证冲刺', instructor: '王教授', total_lessons: 60, current_lessons: 39, category: '人事专业', progress: 65, updated_at: now },
    { title: '劳动法实务精讲', instructor: '李律师', total_lessons: 30, current_lessons: 12, category: '人事专业', progress: 40, updated_at: now },
    { title: '超市经营管理实战', instructor: '张经理', total_lessons: 45, current_lessons: 20, category: '超市经营', progress: 44, updated_at: now },
    { title: '内心能量修炼', instructor: '陈导师', total_lessons: 20, current_lessons: 8, category: '内心能量', progress: 40, updated_at: now }
  ])
  if (courseErr) console.error('Courses:', courseErr.message)
  else console.log('✅ Courses 插入成功')

  // Books
  const { error: bookErr } = await supabase.from('books').insert([
    { title: '《人力资源管理》第15版', author: '加里·德斯勒', category: '人事专业', recommended: true },
    { title: '《零售管理精要》', author: '迈克尔·利维', category: '超市经营', recommended: true },
    { title: '《心流：最优体验心理学》', author: '米哈里·契克森米哈赖', category: '内心能量', recommended: true }
  ])
  if (bookErr) console.error('Books:', bookErr.message)
  else console.log('✅ Books 插入成功')

  // Reviews
  const { error: reviewErr } = await supabase.from('reviews').upsert([
    { date: today, mood: 'happy', physical: 7.5, mental: 8.0, intellectual: 7.0, emotional: 8.5, completion: 43 },
    { date: yesterday, mood: 'good', physical: 7.0, mental: 7.5, intellectual: 6.5, emotional: 8.0, completion: 90 }
  ], { onConflict: 'date' })
  if (reviewErr) console.error('Reviews:', reviewErr.message)
  else console.log('✅ Reviews 插入成功')

  // Study Records
  const { error: studyErr } = await supabase.from('study_records').insert([
    { date: today, duration: 90, category: '人事专业', created_at: now },
    { date: today, duration: 60, category: '超市经营', created_at: now - 3600000 },
    { date: yesterday, duration: 120, category: '人事专业', created_at: now - 86400000 }
  ])
  if (studyErr) console.error('Study:', studyErr.message)
  else console.log('✅ Study Records 插入成功')

  // Life Records
  const { error: lifeErr } = await supabase.from('life_records').insert([
    { date: today, type: '运动', content: '跑步30分钟', created_at: now },
    { date: today, type: '饮食', content: '三餐规律，多喝水', created_at: now - 7200000 }
  ])
  if (lifeErr) console.error('Life:', lifeErr.message)
  else console.log('✅ Life Records 插入成功')

  // Side Projects
  const { error: projectErr } = await supabase.from('side_projects').insert([
    { title: '小红书运营', category: '自媒体', progress: 60, created_at: now },
    { title: '副业项目规划', category: '副业', progress: 30, created_at: now - 86400000 }
  ])
  if (projectErr) console.error('Projects:', projectErr.message)
  else console.log('✅ Side Projects 插入成功')

  console.log('🎉 种子数据插入完成！')
}

seed().catch(err => { console.error('❌ 失败:', err.message); process.exit(1) })
