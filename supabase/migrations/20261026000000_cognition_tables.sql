-- 生活模块 · 认知重塑（认知条目 + 引擎反馈）
-- 补录迁移：这两张表此前只在前端 database.js 中被访问，未纳入版本管理，
-- 原始建表很可能是在 Supabase Dashboard → SQL Editor 手动执行的。
-- 本文件保证幂等（IF NOT EXISTS + DROP POLICY IF EXISTS），可安全重复执行。
--
-- 对应代码：src/db/database.js → cognitionEntriesApi / cognitionFeedbacksApi
--           src/utils/cognitionEngine.js → analyzeReflection() 产出 feedback 结构
--           src/pages/life/CognitionTab.jsx → 唯一调用方

-- ─── 认知条目表（用户写下的一段想法，可同日多条）───
CREATE TABLE IF NOT EXISTS cognition_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                          -- 'YYYY-MM-DD'，来自 todayStr()
  content TEXT NOT NULL DEFAULT '',            -- 原始想法文本（前端要求 >= 15 字）
  category TEXT NOT NULL DEFAULT 'general',    -- general/work/relationship/self-growth/emotion/decision
  mood TEXT NOT NULL DEFAULT '',               -- anxious/sad/angry/confused/ashamed/hurt/fear/calm
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_cognition_entries_user_created
  ON cognition_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cognition_entries_user_category
  ON cognition_entries(user_id, category);

-- ─── 引擎反馈表（每条条目对应一份分析结果，重新生成时覆盖）───
-- entry_id 上必须有 UNIQUE 约束，前端 upsert 依赖 onConflict: 'entry_id'
-- 外键保证 cognitionFeedbacksApi.getAll() 里的
-- cognition_entries!inner(date, category) 关联查询可以正常解析
CREATE TABLE IF NOT EXISTS cognition_feedbacks (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER NOT NULL UNIQUE
    REFERENCES cognition_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biases JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{key,name,severity,desc,evidence,source}]
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,      -- {support:[], against:[]}
  perspectives JSONB NOT NULL DEFAULT '[]'::jsonb,  -- 替代视角列表
  reframe TEXT NOT NULL DEFAULT '',                 -- 认知重构后的表述
  challenges JSONB NOT NULL DEFAULT '[]'::jsonb,    -- 苏格拉底追问列表
  summary TEXT NOT NULL DEFAULT '',                 -- 一句话总评
  score INTEGER NOT NULL DEFAULT 0,                 -- 思辨得分，用于历史趋势统计
  raw_analysis TEXT NOT NULL DEFAULT '',            -- 引擎原始输出（feedback.rawAnalysis）
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_cognition_feedbacks_user_created
  ON cognition_feedbacks(user_id, created_at DESC);

-- ─── 启用 RLS ───
ALTER TABLE cognition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognition_feedbacks ENABLE ROW LEVEL SECURITY;

-- ─── RLS 策略：用户只能操作自己的数据 ───
DROP POLICY IF EXISTS "Users can manage their own cognition entries" ON cognition_entries;
CREATE POLICY "Users can manage their own cognition entries" ON cognition_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own cognition feedbacks" ON cognition_feedbacks;
CREATE POLICY "Users can manage their own cognition feedbacks" ON cognition_feedbacks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
