-- 生活模块 - 数据表创建（每日记录 + 每周复盘）
-- 在 Supabase Dashboard → SQL Editor 中执行

-- ─── 每日记录表（每用户每天一条，date 唯一）───
CREATE TABLE IF NOT EXISTS daily_records (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                      -- 'YYYY-MM-DD'
  done_items TEXT NOT NULL DEFAULT '',     -- 今天完成了什么（多行文本）
  focus_hours NUMERIC NOT NULL DEFAULT 0,  -- 有效投入时长（小时，可小数）
  mood TEXT NOT NULL DEFAULT '',           -- 情绪：great/good/ok/low/bad
  energy INTEGER NOT NULL DEFAULT 3,       -- 精力：1-5
  expenses JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{desc, amount, category}]
  tomorrow_task TEXT NOT NULL DEFAULT '',  -- 明日最重要的一件事
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_date ON daily_records(user_id, date);

-- ─── 每周复盘表（每用户每周一条，week_start 为周一日期，唯一）───
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,                -- 周一日期 'YYYY-MM-DD'
  highlights TEXT NOT NULL DEFAULT '',     -- 本周亮点回顾
  problems TEXT NOT NULL DEFAULT '',       -- 反复出现的问题与模式分析
  improvement TEXT NOT NULL DEFAULT '',    -- 下周计划改进的一件小事
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week ON weekly_reviews(user_id, week_start);

-- ─── 启用 RLS ───
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

-- ─── RLS 策略：用户只能操作自己的数据 ───
CREATE POLICY "Users can manage their own daily records" ON daily_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own weekly reviews" ON weekly_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
