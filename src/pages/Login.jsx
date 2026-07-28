import { useState } from 'react'
import { signIn, signUp, claimLegacyData } from '../db/auth'

export default function Login({ onSuccess }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const data = await signUp(email, password)
        // Supabase 默认开启邮箱验证时，需要用户去邮箱点击确认
        if (data.session) {
          // 已自动登录（未开启邮箱验证）
          await tryClaimLegacy()
          onSuccess?.()
        } else {
          setInfo('注册成功！请到邮箱点击确认链接完成验证。')
          setMode('signin')
        }
      } else {
        await signIn(email, password)
        await tryClaimLegacy()
        onSuccess?.()
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function tryClaimLegacy() {
    try {
      const result = await claimLegacyData()
      const total = Object.values(result || {}).reduce((s, n) => s + Number(n || 0), 0)
      if (total > 0) {
        console.log('已认领历史数据:', result)
      }
    } catch (e) {
      console.warn('认领历史数据失败:', e.message)
    }
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / 标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg">
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">个人工作台</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'signup' ? '创建账号开始使用' : '登录你的工作台'}
          </p>
        </div>

        {/* 表单卡片 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-6 card-shadow animate-fade-in space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">密码</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
          {info && (
            <div className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{info}</div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed btn-press transition"
          >
            {loading ? '处理中...' : mode === 'signup' ? '注册' : '登录'}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'signup' ? '已有账号？' : '还没有账号？'}
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup')
              setError('')
              setInfo('')
            }}
            className="ml-1 text-indigo-500 font-medium hover:underline"
          >
            {mode === 'signup' ? '去登录' : '注册新账号'}
          </button>
        </p>
      </div>
    </div>
  )
}

/** 翻译常见 Supabase Auth 错误信息 */
function translateError(msg) {
  if (!msg) return '操作失败'
  if (msg.includes('Invalid login credentials')) return '邮箱或密码错误'
  if (msg.includes('User already registered')) return '该邮箱已注册，请直接登录'
  if (msg.includes('Password should be at least')) return '密码至少 6 位'
  if (msg.includes('Email not confirmed')) return '邮箱未验证，请到邮箱点击确认链接'
  if (msg.includes('rate limit')) return '操作过于频繁，请稍后再试'
  return msg
}
