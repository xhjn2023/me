-- 用药模块 - 数据表创建
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 1. 药瓶状态表（每用户单行）
CREATE TABLE IF NOT EXISTS medicine_state (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bottle_number INTEGER DEFAULT 1,
  remaining_pills INTEGER DEFAULT 30,
  pills_per_bottle INTEGER DEFAULT 30,
  daily_dose INTEGER DEFAULT 1,
  reminder_time TEXT DEFAULT '09:00',
  low_threshold INTEGER DEFAULT 5,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_medicine_state_user ON medicine_state(user_id);

-- 2. 打卡记录表
CREATE TABLE IF NOT EXISTS medicine_checkins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  dose INTEGER DEFAULT 1,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_medicine_checkins_user ON medicine_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_checkins_date ON medicine_checkins(date);

-- 3. 瓶次历史表
CREATE TABLE IF NOT EXISTS medicine_bottles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bottle_number INTEGER NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  total_pills INTEGER
);
CREATE INDEX IF NOT EXISTS idx_medicine_bottles_user ON medicine_bottles(user_id);

-- 4. 操作日志表
CREATE TABLE IF NOT EXISTS medicine_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  action TEXT NOT NULL,
  note TEXT DEFAULT '',
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_user ON medicine_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_timestamp ON medicine_logs(timestamp DESC);

-- 启用 RLS
ALTER TABLE medicine_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能操作自己的数据
CREATE POLICY "Users can manage their own medicine state" ON medicine_state
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own checkins" ON medicine_checkins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bottles" ON medicine_bottles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own logs" ON medicine_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);