/**
 * 用药数据迁移脚本
 * 从 localStorage 迁移到 Supabase
 *
 * 使用方式：
 *   1. 先在浏览器中确保应用已登录，localStorage 中有数据
 *   2. 然后在浏览器中执行：node scripts/migrate-medicine.mjs
 *
 * 注意：此脚本需要配合浏览器使用，
 * 因为 localStorage 只在浏览器中可用。
 * 请使用下面的迁移页面方式。
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://cszkekdciqgimsvfgons.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_EgAro7H2v76ZHWTbzeN0vA_SToYDLgx'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
})

async function main() {
  const [,, email, password] = process.argv

  if (!email || !password) {
    console.log('用法: node scripts/migrate-medicine.mjs <email> <password>')
    console.log('')
    console.log('请先通过浏览器打开应用并登录，确保用药数据在 localStorage 中。')
    console.log('然后打开浏览器开发者工具 (F12) → Console，执行:')
    console.log('')
    console.log('  copy(JSON.stringify({')
    console.log("    state: localStorage.getItem('medicine:state'),")
    console.log("    checkins: localStorage.getItem('medicine:checkins'),")
    console.log("    bottles: localStorage.getItem('medicine:bottles'),")
    console.log("    logs: localStorage.getItem('medicine:logs')")
    console.log('  }))')
    console.log('')
    console.log('将输出的 JSON 保存到 data/medicine-local.json 文件后，再运行本脚本。')
    process.exit(1)
  }

  // 登录
  console.log('🔐 登录 Supabase...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email, password
  })
  if (authError) {
    console.error('❌ 登录失败:', authError.message)
    process.exit(1)
  }
  const userId = authData.user.id
  console.log(`✅ 已登录: ${authData.user.email} (${userId})`)

  // 读取本地数据文件
  const dataPath = join(__dirname, '..', 'data', 'medicine-local.json')
  if (!existsSync(dataPath)) {
    console.error('❌ 未找到数据文件 data/medicine-local.json')
    console.log('请先在浏览器中提取 localStorage 数据（见上方说明）')
    process.exit(1)
  }

  const raw = JSON.parse(readFileSync(dataPath, 'utf-8'))
  const localData = {
    state: raw.state ? JSON.parse(raw.state) : null,
    checkins: raw.checkins ? JSON.parse(raw.checkins) : null,
    bottles: raw.bottles ? JSON.parse(raw.bottles) : null,
    logs: raw.logs ? JSON.parse(raw.logs) : null
  }

  console.log('📦 读取到的数据:')
  console.log(`   medicine_state: ${localData.state ? '✓' : '无'}`)
  console.log(`   medicine_checkins: ${localData.checkins ? Object.keys(localData.checkins).length + ' 条' : '无'}`)
  console.log(`   medicine_bottles: ${localData.bottles ? localData.bottles.length + ' 条' : '无'}`)
  console.log(`   medicine_logs: ${localData.logs ? localData.logs.length + ' 条' : '无'}`)

  if (!localData.state && !localData.checkins && !localData.bottles && !localData.logs) {
    console.log('⚠️  没有数据需要迁移')
    return
  }

  console.log('\n🚀 开始迁移...')

  const summary = { state: false, checkins: 0, bottles: 0, logs: 0 }

  // 1. 迁移 medicine_state
  if (localData.state) {
    const s = localData.state
    const { error } = await supabase.from('medicine_state').upsert({
      user_id: userId,
      bottle_number: s.bottleNumber ?? 1,
      remaining_pills: s.remainingPills ?? 30,
      pills_per_bottle: s.pillsPerBottle ?? 30,
      daily_dose: s.dailyDose ?? 1,
      reminder_time: s.reminderTime ?? '09:00',
      low_threshold: s.lowThreshold ?? 5,
      created_at: s.createdAt ?? Date.now()
    }, { onConflict: 'user_id' })
    if (error) throw new Error(`medicine_state: ${error.message}`)
    summary.state = true
    console.log('✅ medicine_state 迁移完成')
  }

  // 2. 迁移 medicine_checkins
  if (localData.checkins) {
    for (const [date, dose] of Object.entries(localData.checkins)) {
      const { error } = await supabase.from('medicine_checkins').upsert({
        user_id: userId, date, dose: dose ?? 1
      }, { onConflict: 'user_id,date' })
      if (error) throw new Error(`medicine_checkins[${date}]: ${error.message}`)
      summary.checkins++
    }
    console.log(`✅ medicine_checkins 迁移 ${summary.checkins} 条`)
  }

  // 3. 迁移 medicine_bottles
  if (localData.bottles && Array.isArray(localData.bottles)) {
    for (const b of localData.bottles) {
      const { error } = await supabase.from('medicine_bottles').insert({
        user_id: userId,
        bottle_number: b.bottleNumber ?? 1,
        started_at: b.startedAt ?? null,
        finished_at: b.finishedAt ?? null,
        total_pills: b.totalPills ?? 30
      })
      if (error) throw new Error(`medicine_bottles: ${error.message}`)
      summary.bottles++
    }
    console.log(`✅ medicine_bottles 迁移 ${summary.bottles} 条`)
  }

  // 4. 迁移 medicine_logs
  if (localData.logs && Array.isArray(localData.logs)) {
    for (const l of localData.logs) {
      const { error } = await supabase.from('medicine_logs').insert({
        user_id: userId,
        date: l.date ?? '',
        action: l.action ?? '',
        note: l.note ?? '',
        timestamp: l.timestamp ?? Date.now()
      })
      if (error) throw new Error(`medicine_logs: ${error.message}`)
      summary.logs++
    }
    console.log(`✅ medicine_logs 迁移 ${summary.logs} 条`)
  }

  console.log('\n🎉 迁移完成!')
  console.log(`   药瓶状态: ${summary.state ? '✓' : '无'}`)
  console.log(`   打卡记录: ${summary.checkins} 条`)
  console.log(`   瓶次历史: ${summary.bottles} 条`)
  console.log(`   操作日志: ${summary.logs} 条`)
}

main().catch(err => {
  console.error('❌ 迁移失败:', err.message)
  process.exit(1)
})