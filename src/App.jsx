import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Work from './pages/Work'
import Study from './pages/Study'
import Life from './pages/Life'
import SideWork from './pages/SideWork'
import Review from './pages/Review'
import Medicine from './pages/Medicine'
import Login from './pages/Login'
import { getCurrentUser, onAuthStateChange, signOut } from './db/auth'
import { initializeData } from './db/seed'
import { Icon } from './components/ui/icons'
import { ToastContainer, ConfirmDialog } from './components/ui'

const TABS = [
  { key: 'dashboard', label: '首页', icon: 'home', accent: 'indigo' },
  { key: 'work', label: '工作', icon: 'briefcase', accent: 'blue' },
  { key: 'study', label: '学习', icon: 'graduationCap', accent: 'emerald' },
  { key: 'life', label: '生活', icon: 'leaf', accent: 'teal' },
  { key: 'medicine', label: '用药', icon: 'pill', accent: 'rose' },
  { key: 'side', label: '副业', icon: 'rocket', accent: 'orange' },
  { key: 'review', label: '复盘', icon: 'clipboardList', accent: 'violet' },
]

const ACTIVE_COLOR = {
  indigo: 'text-primary-500',
  blue: 'text-blue-500',
  emerald: 'text-emerald-500',
  teal: 'text-teal-500',
  rose: 'text-rose-500',
  orange: 'text-orange-500',
  violet: 'text-violet-500',
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // 初始化：获取当前登录状态 + 监听 auth 变化
  useEffect(() => {
    let unsub = () => {}
    ;(async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setAuthLoading(false)
      unsub = onAuthStateChange((u) => {
        setUser(u)
      })
    })()
    return () => unsub()
  }, [])

  // 登录后才初始化种子数据（为新用户）
  useEffect(() => {
    if (user) {
      initializeData().catch(console.error)
    }
  }, [user])

  // 加载中
  if (authLoading) {
    return (
      <div className="gemini-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Icon name="loader" size={32} className="text-primary-500 animate-spin" />
          <p className="text-sm text-primary-400">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录：显示登录页
  if (!user) {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    )
  }

  const currentTab = TABS.find(t => t.key === tab)

  return (
    <div className="gemini-bg min-h-screen md:flex">
      {/* 桌面端左侧侧边栏 */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 glass-heavy border-r border-primary-100/50 z-30"
      >
        {/* Brand */}
        <div
          className="px-5 py-5 border-b border-primary-100/50"
          style={{ paddingTop: 'calc(var(--safe-top) + 1.25rem)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full gemini-gradient-soft shadow-sm shadow-primary-400/30" />
            <span className="text-sm font-semibold text-primary-700 tracking-wide">个人工作台</span>
          </div>
        </div>

        {/* 分类导航 */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
          <p className="px-3 mb-2 text-[10px] font-semibold text-primary-400/70 uppercase tracking-wider">分类</p>
          <div className="space-y-1">
            {TABS.map(({ key, label, icon, accent }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl btn-press transition relative ${
                    active ? 'bg-primary-50/80' : 'hover:bg-primary-50/50'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full gemini-gradient-soft" />
                  )}
                  <Icon
                    name={icon}
                    size={20}
                    fill={active ? 'currentColor' : 'none'}
                    className={active ? ACTIVE_COLOR[accent] || 'text-primary-500' : 'text-primary-400/70'}
                    strokeWidth={active ? 2 : 1.75}
                  />
                  <span
                    className={`text-sm ${
                      active ? `${ACTIVE_COLOR[accent] || 'text-primary-500'} font-semibold` : 'text-primary-600/80'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* 用户区 */}
        <div
          className="px-3 py-3 border-t border-primary-100/50"
          style={{ paddingBottom: 'calc(var(--safe-bottom) + 0.75rem)' }}
        >
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
            <span className="w-8 h-8 rounded-full gemini-gradient-soft flex items-center justify-center text-white text-xs font-medium shadow-sm shadow-primary-400/30 shrink-0">
              {(user.email || '?')[0].toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary-400">已登录</p>
              <p className="text-xs text-primary-800 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition btn-press shrink-0"
              title="退出登录"
            >
              <Icon name="logOut" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex-1 md:pl-64 max-w-md md:max-w-none mx-auto">
        {/* 移动端顶部用户栏 */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 glass-heavy border-b border-primary-100/50"
          style={{ paddingTop: 'var(--safe-top)', paddingBottom: '0.5rem' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 shadow-sm shadow-primary-400/30" />
            <span className="text-xs font-semibold text-primary-600 tracking-wide uppercase">{currentTab.label}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-primary-50/60 transition btn-press"
            >
              <span className="w-6 h-6 rounded-full gemini-gradient-soft flex items-center justify-center text-white text-xs font-medium shadow-sm shadow-primary-400/30">
                {(user.email || '?')[0].toUpperCase()}
              </span>
              <Icon name="chevronDown" size={14} className="text-primary-400" />
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg shadow-primary-500/10 border border-primary-100/60 py-1 z-50 animate-scale-in">
                  <div className="px-3 py-2 border-b border-primary-100/50">
                    <p className="text-xs text-primary-400">已登录</p>
                    <p className="text-sm text-primary-800 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      setShowLogoutConfirm(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Icon name="logOut" size={16} />
                    退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* 桌面端顶部标题栏 */}
        <header
          className="hidden md:flex sticky top-0 z-30 items-center justify-between px-8 glass-heavy border-b border-primary-100/50"
          style={{ paddingTop: 'var(--safe-top)', paddingBottom: '0.875rem' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 shadow-sm shadow-primary-400/30" />
            <span className="text-sm font-semibold text-primary-700">{currentTab.label}</span>
          </div>
        </header>

        <main className="min-h-screen pb-20 md:pb-10">
          <div className="md:max-w-3xl md:mx-auto md:px-8 md:py-6">
            <div key={tab} className="animate-fade-in">
              {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
              {tab === 'work' && <Work />}
              {tab === 'study' && <Study />}
              {tab === 'life' && <Life />}
              {tab === 'medicine' && <Medicine />}
              {tab === 'side' && <SideWork />}
              {tab === 'review' && <Review />}
            </div>
          </div>
        </main>

        {/* 移动端底部 Tab 导航（Gemini 毛玻璃风格） */}
        <nav
          className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-heavy border-t border-primary-100/50 shadow-[0_-4px_20px_rgba(139,92,246,0.06)]"
          style={{ paddingBottom: 'var(--safe-bottom)' }}
        >
          <div className="flex">
            {TABS.map(({ key, label, icon, accent }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex-1 flex flex-col items-center py-2.5 btn-press relative"
                >
                  {active && (
                    <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full gemini-gradient-soft" />
                  )}
                  <Icon
                    name={icon}
                    size={22}
                    fill={active ? 'currentColor' : 'none'}
                    className={active ? ACTIVE_COLOR[accent] || 'text-primary-500' : 'text-primary-400/60'}
                    strokeWidth={active ? 2 : 1.75}
                  />
                  <span
                    className={`text-[10px] mt-0.5 ${
                      active ? `${ACTIVE_COLOR[accent] || 'text-primary-500'} font-semibold` : 'text-primary-400/60'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      <ToastContainer />
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          try { await signOut() } catch (e) { console.error(e) }
        }}
        title="退出登录"
        message="退出后需要重新登录才能查看数据。"
        confirmText="退出"
      />
    </div>
  )
}