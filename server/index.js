import express from 'express'
import cors from 'cors'
import postgres from 'postgres'

const DATABASE_URL = "postgresql://postgres.cszkekdciqgimsvfgons:Aaxhjn2020.@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

const sql = postgres(DATABASE_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: { rejectUnauthorized: false }
})

const app = express()
app.use(cors())
app.use(express.json())

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ─── 自动建表 ───
async function initDB() {
  console.log('正在初始化数据库表...')
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT false,
      priority INTEGER DEFAULT 0,
      category TEXT DEFAULT '工作',
      time TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)`

  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      instructor TEXT DEFAULT '',
      total_lessons INTEGER DEFAULT 0,
      current_lessons INTEGER DEFAULT 0,
      category TEXT DEFAULT '',
      progress INTEGER DEFAULT 0,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category)`

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      mood TEXT DEFAULT 'ok',
      physical REAL DEFAULT 7.0,
      mental REAL DEFAULT 7.0,
      intellectual REAL DEFAULT 7.0,
      emotional REAL DEFAULT 7.0,
      completion INTEGER DEFAULT 0
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date)`

  await sql`
    CREATE TABLE IF NOT EXISTS study_records (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      category TEXT DEFAULT '',
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_study_date ON study_records(date)`

  await sql`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      category TEXT DEFAULT '',
      recommended BOOLEAN DEFAULT false
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS life_records (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT DEFAULT '',
      content TEXT DEFAULT '',
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_life_date ON life_records(date)`

  await sql`
    CREATE TABLE IF NOT EXISTS side_projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT DEFAULT '',
      progress INTEGER DEFAULT 0,
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `

  console.log('✅ 数据库表初始化完成')
}

// ─── Tasks API ───
app.get('/api/tasks', async (req, res) => {
  try {
    const { date, category } = req.query
    let rows
    if (date) {
      rows = category && category !== 'all'
        ? await sql`SELECT * FROM tasks WHERE date = ${date} AND category = ${category} ORDER BY done ASC, time ASC`
        : await sql`SELECT * FROM tasks WHERE date = ${date} ORDER BY done ASC, time ASC`
    } else {
      rows = await sql`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 200`
    }
    res.json(rows.map(r => snakeToCamel(r)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, done, priority, category, time, date, createdAt } = req.body
    const [row] = await sql`
      INSERT INTO tasks (title, done, priority, category, time, date, created_at)
      VALUES (${title}, ${done || false}, ${priority || 0}, ${category || '工作'}, ${time || ''}, ${date}, ${createdAt || Date.now()})
      RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const fields = req.body
    const sets = []
    const values = []
    const fieldMap = { done: 'done', priority: 'priority', title: 'title', category: 'category', time: 'time' }
    for (const [k, v] of Object.entries(fields)) {
      if (fieldMap[k]) { sets.push(`${fieldMap[k]} = $${values.length + 1}`); values.push(v) }
    }
    if (sets.length === 0) return res.json({ success: true })
    values.push(id)
    const [row] = await sql.unsafe(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values)
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await sql`DELETE FROM tasks WHERE id = ${req.params.id}`
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Courses API ───
app.get('/api/courses', async (req, res) => {
  try {
    const { category } = req.query
    const rows = category
      ? await sql`SELECT * FROM courses WHERE category = ${category} ORDER BY updated_at DESC`
      : await sql`SELECT * FROM courses ORDER BY updated_at DESC`
    res.json(rows.map(r => snakeToCamel(r)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/courses', async (req, res) => {
  try {
    const { title, instructor, totalLessons, currentLessons, category, progress, updatedAt } = req.body
    const [row] = await sql`
      INSERT INTO courses (title, instructor, total_lessons, current_lessons, category, progress, updated_at)
      VALUES (${title}, ${instructor || ''}, ${totalLessons || 0}, ${currentLessons || 0}, ${category || ''}, ${progress || 0}, ${updatedAt || Date.now()})
      RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { progress, currentLessons } = req.body
    const [row] = await sql`
      UPDATE courses SET
        progress = COALESCE(${progress ?? null}, progress),
        current_lessons = COALESCE(${currentLessons ?? null}, current_lessons),
        updated_at = ${Date.now()}
      WHERE id = ${id} RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await sql`DELETE FROM courses WHERE id = ${req.params.id}`
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Reviews API ───
app.get('/api/reviews', async (req, res) => {
  try {
    const { date } = req.query
    const rows = date
      ? await sql`SELECT * FROM reviews WHERE date = ${date}`
      : await sql`SELECT * FROM reviews ORDER BY date DESC LIMIT 30`
    res.json(rows.map(r => snakeToCamel(r)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/reviews', async (req, res) => {
  try {
    const { date, mood, physical, mental, intellectual, emotional, completion } = req.body
    const [row] = await sql`
      INSERT INTO reviews (date, mood, physical, mental, intellectual, emotional, completion)
      VALUES (${date}, ${mood || 'ok'}, ${physical || 7}, ${mental || 7}, ${intellectual || 7}, ${emotional || 7}, ${completion || 0})
      ON CONFLICT (date) DO UPDATE SET
        mood = EXCLUDED.mood, physical = EXCLUDED.physical, mental = EXCLUDED.mental,
        intellectual = EXCLUDED.intellectual, emotional = EXCLUDED.emotional, completion = EXCLUDED.completion
      RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Study Records API ───
app.get('/api/study-records', async (req, res) => {
  try {
    const { dates } = req.query
    let rows
    if (dates) {
      const arr = dates.split(',')
      rows = await sql`SELECT * FROM study_records WHERE date = ANY(${arr})`
    } else {
      rows = await sql`SELECT * FROM study_records ORDER BY created_at DESC LIMIT 100`
    }
    res.json(rows.map(r => snakeToCamel(r)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/study-records', async (req, res) => {
  try {
    const { date, duration, category, createdAt } = req.body
    const [row] = await sql`
      INSERT INTO study_records (date, duration, category, created_at)
      VALUES (${date}, ${duration || 0}, ${category || ''}, ${createdAt || Date.now()})
      RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Books API ───
app.get('/api/books', async (req, res) => {
  try {
    const { category } = req.query
    const rows = category
      ? await sql`SELECT * FROM books WHERE category = ${category}`
      : await sql`SELECT * FROM books`
    res.json(rows.map(r => snakeToCamel(r)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, category, recommended } = req.body
    const [row] = await sql`
      INSERT INTO books (title, author, category, recommended)
      VALUES (${title}, ${author || ''}, ${category || ''}, ${recommended || false})
      RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Life Records API ───
app.get('/api/life-records', async (req, res) => {
  try {
    const { date } = req.query
    const rows = date
      ? await sql`SELECT * FROM life_records WHERE date = ${date} ORDER BY created_at DESC`
      : await sql`SELECT * FROM life_records ORDER BY created_at DESC LIMIT 100`
    res.json(rows.map(r => snakeToCamel(r)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/life-records', async (req, res) => {
  try {
    const { date, type, content, createdAt } = req.body
    const [row] = await sql`
      INSERT INTO life_records (date, type, content, created_at)
      VALUES (${date}, ${type || ''}, ${content || ''}, ${createdAt || Date.now()})
      RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/life-records/:id', async (req, res) => {
  try {
    await sql`DELETE FROM life_records WHERE id = ${req.params.id}`
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── Side Projects API ───
app.get('/api/side-projects', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM side_projects ORDER BY created_at DESC`
    res.json(rows.map(r => snakeToCamel(r)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/side-projects', async (req, res) => {
  try {
    const { title, category, progress, createdAt } = req.body
    const [row] = await sql`
      INSERT INTO side_projects (title, category, progress, created_at)
      VALUES (${title}, ${category || ''}, ${progress || 0}, ${createdAt || Date.now()})
      RETURNING *
    `
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/side-projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { progress } = req.body
    const [row] = await sql`UPDATE side_projects SET progress = ${progress} WHERE id = ${id} RETURNING *`
    res.json(snakeToCamel(row))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/side-projects/:id', async (req, res) => {
  try {
    await sql`DELETE FROM side_projects WHERE id = ${req.params.id}`
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// snake_case -> camelCase
function snakeToCamel(row) {
  if (!row) return row
  const result = {}
  for (const [k, v] of Object.entries(row)) {
    const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = v
  }
  return result
}

// 启动
const PORT = process.env.PORT || 3001
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 后端服务运行在 http://localhost:${PORT}`)
    console.log(`   API 地址: http://localhost:${PORT}/api`)
  })
}).catch(err => {
  console.error('❌ 数据库初始化失败:', err.message)
  process.exit(1)
})
