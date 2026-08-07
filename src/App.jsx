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
import { Icon, IconFilled } from './components/ui/icons'
import { ToastContainer, ConfirmDialog } from './components/ui'

const TABS = [
  // 图标主题色（柔和多彩）+ 选中左侧竖条色
  { key: 'dashboard', label: '首页',   icon: 'home',          accent: 'indigo',  iconBg: 'bg-indigo-100 text-indigo-600',   barBg: 'bg-indigo-500' },
  { key: 'work',      label: '工作',   icon: 'briefcase',     accent: 'blue',    iconBg: 'bg-blue-100 text-blue-600',       barBg: 'bg-blue-500' },
  { key: 'study',     label: '学习',   icon: 'graduationCap', accent: 'emerald', iconBg: 'bg-emerald-100 text-emerald-600', barBg: 'bg-emerald-500' },
  { key: 'life',      label: '生活',   icon: 'leaf',          accent: 'teal',    iconBg: 'bg-teal-100 text-teal-600',       barBg: 'bg-teal-500' },
  { key: 'medicine',  label: '用药',   icon: 'pill',          accent: 'rose',    iconBg: 'bg-rose-100 text-rose-600',       barBg: 'bg-rose-500' },
  { key: 'side',      label: '副业',   icon: 'rocket',        accent: 'orange',  iconBg: 'bg-orange-100 text-orange-600',   barBg: 'bg-orange-500' },
  { key: 'review',    label: '复盘',   icon: 'clipboardList', accent: 'violet',  iconBg: 'bg-violet-100 text-violet-600',   barBg: 'bg-violet-500' },
]

const ACTIVE_COLOR = {
  indigo: 'text-indigo-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  teal: 'text-teal-600',
  rose: 'text-rose-600',
  orange: 'text-orange-600',
  violet: 'text-violet-600',
}

// 桌面端顶部成就徽章（mock，后续可接真实数据）
const BADGES = [
  { icon: 'trophy',   label: '7',   filled: false, className: 'text-amber-500 bg-amber-50' },
  { icon: 'star',     label: '43',  filled: true,  className: 'text-yellow-500 bg-yellow-50' },
  { icon: 'heart',    label: '1',   filled: true,  className: 'text-pink-500 bg-pink-50' },
  { icon: 'sparkles', label: 'Lv1', filled: false, className: 'text-emerald-500 bg-emerald-50' },
]

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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9ff]">
        <div className="flex flex-col items-center gap-3">
          <Icon name="loader" size={32} className="text-blue-500 animate-spin" />
          <p className="text-sm text-blue-400">加载中...</p>
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
  const userName = user.email?.split('@')[0] || '我'

  return (
    <div className="min-h-screen bg-[#f5f9ff] flex text-slate-800">
      {/* 左侧窄侧边栏（图标在上 + 文字在下；移动端 w-16，桌面端 w-20） */}
      <aside
        className="flex flex-col fixed inset-y-0 left-0 w-16 md:w-20 bg-white/75 backdrop-blur-xl border-r border-slate-100 z-30"
      >
        {/* 顶部：返回 + 头像 + 昵称 */}
        <div
          className="flex flex-col items-center gap-1 pt-2 pb-3 md:pt-3 md:pb-4 border-b border-slate-100"
          style={{ paddingTop: 'calc(var(--safe-top) + 0.5rem)' }}
        >
          <button className="self-start ml-2 md:ml-3 p-1 rounded-full text-slate-400 hover:bg-slate-100 transition btn-press">
            <Icon name="chevronLeft" size={16} />
          </button>
          <div className="relative w-9 h-9 md:w-11 md:h-11 shrink-0">
            <span className="w-full h-full rounded-full gemini-gradient-soft flex items-center justify-center text-white text-xs md:text-sm font-medium shadow-sm shadow-indigo-300/40 ring-2 ring-white">
              {(user.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] font-medium text-slate-600 truncate max-w-[56px] md:max-w-[72px] leading-tight">{userName}</p>
        </div>

        {/* 分类导航 */}
        <nav className="flex-1 py-2 md:py-3 overflow-y-auto no-scrollbar">
          <div className="space-y-0.5 md:space-y-1 px-1.5 md:px-2">
            {TABS.map(({ key, label, icon, iconBg, barBg, accent }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="w-full flex flex-col items-center gap-0.5 md:gap-1 py-2 md:py-2.5 rounded-xl btn-press transition relative"
                >
                  {active && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-7 md:h-8 w-1 rounded-full ${barBg}`} />
                  )}
                  <span
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center transition shadow-sm ${
                      active ? iconBg : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-500'
                    }`}
                  >
                    <Icon
                      name={icon}
                      size={18}
                      className="md:w-5 md:h-5"
                      fill={active ? 'currentColor' : 'none'}
                      strokeWidth={active ? 2 : 1.75}
                    />
                  </span>
                  <span
                    className={`text-[9px] md:text-[10px] leading-tight ${
                      active ? `${ACTIVE_COLOR[accent]} font-semibold` : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* 底部：退出 */}
        <div
          className="py-2 md:py-3 border-t border-slate-100"
          style={{ paddingBottom: 'calc(var(--safe-bottom) + 0.5rem)' }}
        >
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex flex-col items-center gap-0.5 md:gap-1 py-1.5 md:py-2 text-slate-400 hover:text-rose-500 transition btn-press mx-auto max-w-[52px] md:max-w-[60px] rounded-xl"
            title="退出登录"
          >
            <span className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-slate-50 hover:bg-rose-50 flex items-center justify-center transition">
              <Icon name="logOut" size={16} className="md:w-[18px] md:h-[18px]" />
            </span>
            <span className="text-[9px] md:text-[10px]">退出</span>
          </button>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex-1 pl-16 md:pl-20 max-w-none mx-auto">
        {/* 移动端顶部栏 */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 bg-white/80 backdrop-blur-xl border-b border-slate-100"
          style={{ paddingTop: 'var(--safe-top)', paddingBottom: '0.5rem' }}
        >
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-xl ${currentTab.iconBg} flex items-center justify-center shadow-sm`}>
              <Icon name={currentTab.icon} size={16} fill="currentColor" />
            </span>
            <span className={`text-xs font-semibold ${ACTIVE_COLOR[currentTab.accent]}`}>{currentTab.label}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition btn-press"
            >
              <span className="w-6 h-6 rounded-full gemini-gradient-soft flex items-center justify-center text-white text-xs font-medium">
                {(user.email || '?')[0].toUpperCase()}
              </span>
              <Icon name="chevronDown" size={14} className="text-slate-400" />
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg shadow-slate-500/10 border border-slate-100 py-1 z-50 animate-scale-in">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400">已登录</p>
                    <p className="text-sm text-slate-800 truncate">{user.email}</p>
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

        {/* 桌面端顶部栏：分类标题 + 任务/签到 + 成就徽章 */}
        <header
          className="hidden md:flex sticky top-0 z-30 items-center gap-4 px-8 bg-white/70 backdrop-blur-xl border-b border-slate-100"
          style={{ paddingTop: 'var(--safe-top)', paddingBottom: '0.75rem' }}
        >
          {/* 左：分类标题（带图标） */}
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-xl ${currentTab.iconBg} flex items-center justify-center shadow-sm`}>
              <Icon name={currentTab.icon} size={18} fill="currentColor" strokeWidth={2} />
            </span>
            <span className={`text-sm font-semibold ${ACTIVE_COLOR[currentTab.accent]}`}>{currentTab.label}</span>
          </div>

          {/* 中：任务进度 + 签到标签 */}
          <div className="flex items-center gap-2 ml-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm">
              <Icon name="calendar" size={14} className="text-blue-500" />
              <span className="text-[11px] font-semibold text-slate-700">7/10</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
              <Icon name="gift" size={14} className="text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600">已签</span>
            </span>
          </div>

          <div className="flex-1" />

          {/* 右：成就徽章（奖牌 / 星星 / 爱心 / 等级） */}
          <div className="flex items-center gap-2">
            {BADGES.map(({ icon, label, filled, className }, i) => {
              const Cmp = filled ? IconFilled : Icon
              return (
                <span
                  key={i}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full ${className} border border-white shadow-sm`}
                >
                  <Cmp name={icon} size={14} />
                  <span className="text-[11px] font-semibold">{label}</span>
                </span>
              )
            })}
          </div>
        </header>

        <main className="min-h-screen pb-10">
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

// 简单工具：判断图标是否有填充态（避免运行时警告）
function filledPathsCheck(name) {
  return ['home', 'heart', 'star', 'bookmark', 'bell'].includes(name)
}
