import { useState } from 'react'
import { signIn, signUp, claimLegacyData } from '../db/auth'
import { Icon } from '../components/ui/icons'
import { Input, Button, showToast } from '../components/ui'

export default function Login({ onSuccess }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        if (data.session) {
          await tryClaimLegacy()
          showToast('注册成功', 'success')
          onSuccess?.()
        } else {
          setInfo('注册成功！请到邮箱点击确认链接完成验证。')
          setMode('signin')
        }
      } else {
        await signIn(email, password)
        await tryClaimLegacy()
        showToast('登录成功', 'success')
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #faf9ff 0%, #f5f3ff 50%, #ede9fe 100%)' }}
    >
      {/* 装饰性背景圆 */}
      <div className="absolute top-[-120px] right-[-80px] w-64 h-64 rounded-full gemini-gradient-soft opacity-10 blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-60px] w-52 h-52 rounded-full bg-primary-400/10 blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / 标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gemini-gradient flex items-center justify-center shadow-lg shadow-primary-500/30 animate-float">
            <Icon name="home" size={32} className="text-white" strokeWidth={2} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-primary-900 tracking-tight">个人工作台</h1>
          <p className="text-sm text-primary-500 mt-1">
            {mode === 'signup' ? '创建账号开始使用' : '登录你的工作台'}
          </p>
        </div>

        {/* 表单卡片（毛玻璃） */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-xl border border-primary-100/70 rounded-2xl p-6 shadow-gemini-md animate-scale-in space-y-4"
        >
          <Input
            label="邮箱"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon="mail"
            disabled={loading}
          />

          <div>
            <label className="block text-xs font-medium text-primary-700 mb-1.5">密码</label>
            <div className="relative">
              <Icon name="lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 位"
                disabled={loading}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-primary-50/50 border border-primary-200/60 rounded-xl text-primary-900 placeholder:text-primary-400 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/15 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition"
                tabIndex={-1}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50/80 border border-rose-200/60 rounded-lg px-3 py-2">
              <Icon name="alertCircle" size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50/80 border border-emerald-200/60 rounded-lg px-3 py-2">
              <Icon name="checkCircle" size={16} className="flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full"
            disabled={!email || !password}
            iconRight="logIn"
          >
            {mode === 'signup' ? '注册' : '登录'}
          </Button>
        </form>

        {/* 切换登录/注册 */}
        <p className="text-center text-sm text-primary-500 mt-6">
          {mode === 'signup' ? '已有账号？' : '还没有账号？'}
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup')
              setError('')
              setInfo('')
            }}
            className="ml-1 text-primary-600 font-semibold hover:text-primary-700 transition"
          >
            {mode === 'signup' ? '去登录' : '注册新账号'}
          </button>
        </p>
      </div>
    </div>
  )
}

function translateError(msg) {
  if (!msg) return '操作失败'
  if (msg.includes('Invalid login credentials')) return '邮箱或密码错误'
  if (msg.includes('User already registered')) return '该邮箱已注册，请直接登录'
  if (msg.includes('Password should be at least')) return '密码至少 6 位'
  if (msg.includes('Email not confirmed')) return '邮箱未验证，请到邮箱点击确认链接'
  if (msg.includes('rate limit')) return '操作过于频繁，请稍后再试'
  return msg
}