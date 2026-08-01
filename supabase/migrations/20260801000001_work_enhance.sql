-- 工作模块增强：扩展 tasks 表 + 新建 work_summaries 表
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 1. 扩展 tasks 表
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo'
  CHECK (status IN ('todo', 'in_progress', 'done'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 迁移现有 done 字段到 status
UPDATE tasks SET status = CASE WHEN done = true THEN 'done' ELSE 'todo' END WHERE status = 'todo' OR status IS NULL;

-- 2. 新建 work_summaries 表
CREATE TABLE IF NOT EXISTS work_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  date TEXT NOT NULL,
  period_start TEXT DEFAULT '',
  period_end TEXT DEFAULT '',
  content TEXT DEFAULT '',
  completion TEXT DEFAULT '',
  problems TEXT DEFAULT '',
  solutions TEXT DEFAULT '',
  plan TEXT DEFAULT '',
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_summaries_unique ON work_summaries(user_id, type, date);
CREATE INDEX IF NOT EXISTS idx_work_summaries_type ON work_summaries(type);

-- 3. RLS 策略
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_summaries ENABLE ROW LEVEL SECURITY;

-- tasks 策略（先删除已存在的策略再创建）
DROP POLICY IF EXISTS "Allow all for anon" ON tasks;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- work_summaries 策略
DROP POLICY IF EXISTS "Users can manage their own summaries" ON work_summaries;
CREATE POLICY "Users can manage their own summaries" ON work_summaries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);