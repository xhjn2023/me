/**
 * 认证模块 - 基于 Supabase Auth
 *
 * 提供：signUp / signIn / signOut / getSession / onAuthStateChange
 * 登录方式：邮箱 + 密码
 * Session 持久化由 supabase 客户端管理（localStorage）
 */

import { supabase } from './database'

export { supabase }

/** 获取当前会话（同步返回 session 对象，无则 null） */
export function getSession() {
  return supabase.auth.getSession()
}

/** 获取当前登录用户（同步返回 user 对象，无则 null） */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

/** 获取当前用户 ID（未登录抛错） */
export async function requireUserId() {
  const user = await getCurrentUser()
  if (!user) throw new Error('未登录，请先登录')
  return user.id
}

/** 注册 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin }
  })
  if (error) throw error
  return data
}

/** 登录 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

/** 登出 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** 监听认证状态变化 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null, session)
  })
  return () => subscription.unsubscribe()
}

/**
 * 认领历史匿名数据（user_id IS NULL 的数据归属到当前用户）
 * 通过 SECURITY DEFINER 函数绕过 RLS 限制，仅首次登录后调用
 * 返回 { 表名: 认领行数, ... }
 */
export async function claimLegacyData() {
  const user = await getCurrentUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase.rpc('claim_legacy_data', {
    target_user_id: user.id
  })
  if (error) throw error
  return data
}
