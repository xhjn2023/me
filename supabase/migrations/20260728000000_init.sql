-- Supabase 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行

-- Tasks 表
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  category TEXT DEFAULT '工作',
  time TEXT DEFAULT '',
  date TEXT NOT NULL,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- Courses 表
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT DEFAULT '',
  total_lessons INTEGER DEFAULT 0,
  current_lessons INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  progress INTEGER DEFAULT 0,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

-- Reviews 表
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  mood TEXT DEFAULT 'ok',
  physical REAL DEFAULT 7.0,
  mental REAL DEFAULT 7.0,
  intellectual REAL DEFAULT 7.0,
  emotional REAL DEFAULT 7.0,
  completion INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date);

-- Study Records 表
CREATE TABLE IF NOT EXISTS study_records (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_study_date ON study_records(date);

-- Books 表
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  category TEXT DEFAULT '',
  recommended BOOLEAN DEFAULT false
);

-- Life Records 表
CREATE TABLE IF NOT EXISTS life_records (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT DEFAULT '',
  content TEXT DEFAULT '',
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_life_date ON life_records(date);

-- Side Projects 表
CREATE TABLE IF NOT EXISTS side_projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  progress INTEGER DEFAULT 0,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- 启用 RLS（行级安全）
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_projects ENABLE ROW LEVEL SECURITY;

-- 允许匿名访问（开发阶段，生产环境应限制）
CREATE POLICY "Allow all for anon" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON study_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON life_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON side_projects FOR ALL USING (true) WITH CHECK (true);
