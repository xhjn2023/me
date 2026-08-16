import postgres from 'postgres'

const DATABASE_URL = "postgresql://postgres.cszkekdciqgimsvfgons:Aaxhjn2020.@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } })

async function main() {
  console.log('正在创建认知重塑模块数据表...')

  // 用户思考/感想条目表
  await sql`
    CREATE TABLE IF NOT EXISTS cognition_entries (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      content TEXT NOT NULL,
      mood TEXT DEFAULT '',
      tags TEXT[] DEFAULT '{}',
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
      updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_cognition_entries_user_id ON cognition_entries(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_cognition_entries_date ON cognition_entries(date)`
  await sql`CREATE INDEX IF NOT EXISTS idx_cognition_entries_category ON cognition_entries(category)`

  // AI反馈表（每条思考对应一条反馈，可多次重新生成覆盖）
  await sql`
    CREATE TABLE IF NOT EXISTS cognition_feedbacks (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      entry_id INTEGER REFERENCES cognition_entries(id) ON DELETE CASCADE NOT NULL,
      biases JSONB DEFAULT '[]',
      evidence JSONB DEFAULT '{}',
      perspectives JSONB DEFAULT '[]',
      reframe TEXT DEFAULT '',
      challenges JSONB DEFAULT '[]',
      summary TEXT DEFAULT '',
      score INTEGER DEFAULT 0,
      raw_analysis TEXT DEFAULT '',
      created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
      UNIQUE (entry_id)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_cognition_feedbacks_user_id ON cognition_feedbacks(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_cognition_feedbacks_entry_id ON cognition_feedbacks(entry_id)`

  // 启用 RLS
  await sql`ALTER TABLE cognition_entries ENABLE ROW LEVEL SECURITY`
  await sql`ALTER TABLE cognition_feedbacks ENABLE ROW LEVEL SECURITY`

  // 删除旧策略（幂等）
  await sql`DROP POLICY IF EXISTS "cognition_entries_user_policy" ON cognition_entries`
  await sql`DROP POLICY IF EXISTS "cognition_feedbacks_user_policy" ON cognition_feedbacks`

  // RLS 策略：只能访问自己的数据
  await sql`
    CREATE POLICY "cognition_entries_user_policy" ON cognition_entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
  `
  await sql`
    CREATE POLICY "cognition_feedbacks_user_policy" ON cognition_feedbacks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
  `

  console.log('✅ 认知重塑模块数据表创建完成')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ 创建失败:', err.message)
  process.exit(1)
})
