-- 英语学习模块 - 数据表创建
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 单词卡片表（FSRS 间隔重复，每用户每单词一张卡）
CREATE TABLE IF NOT EXISTS english_cards (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  book TEXT DEFAULT 'cet6',
  fsrs_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  due BIGINT DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  last_review BIGINT,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user_id, word)
);
CREATE INDEX IF NOT EXISTS idx_english_cards_user ON english_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_english_cards_due ON english_cards(user_id, due);

-- 启用 RLS
ALTER TABLE english_cards ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能操作自己的单词卡
CREATE POLICY "Users can manage their own english cards" ON english_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
