// UI 基础组件库（Gemini 风格复刻）
// 设计语言：深紫主色、毛玻璃、大圆角、柔和阴影
import { useState, useEffect, useRef } from 'react'
import { Icon } from './icons'

// —— Card ——
export function Card({ children, className = '', as: Comp = 'div', ...rest }) {
  return (
    <Comp
      className={`bg-white/90 backdrop-blur-sm border border-primary-100/70 rounded-2xl shadow-gemini card-shadow-hover ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  )
}

// —— PageHeader（每页顶部渐变 header）——
// accent: 'dashboard'|'work'|'study'|'life'|'medicine'|'side'|'review'
const ACCENT_GRADIENTS = {
  dashboard: 'from-primary-500 via-primary-600 to-primary-700',
  work: 'from-primary-400 via-primary-500 to-primary-600',
  study: 'from-primary-500 via-primary-600 to-primary-700',
  life: 'from-primary-400 via-primary-500 to-primary-600',
  medicine: 'from-primary-500 via-primary-600 to-primary-700',
  side: 'from-primary-400 via-primary-500 to-primary-600',
  review: 'from-primary-600 via-primary-700 to-primary-800',
  auth: 'from-primary-700 via-primary-800 to-primary-900',
}

export function PageHeader({ title, subtitle, accent = 'dashboard', actions, icon }) {
  const gradient = ACCENT_GRADIENTS[accent] || ACCENT_GRADIENTS.dashboard
  return (
    <header
      className={`bg-gradient-to-br ${gradient} px-5 pt-6 pb-6 text-white rounded-b-[1.75rem] shadow-lg shadow-primary-500/20`}
      style={{ paddingTop: 'calc(1.5rem + var(--safe-top))' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && <Icon name={icon} size={20} className="text-white/80" />}
            <h1 className="text-xl font-bold tracking-tight truncate">{title}</h1>
          </div>
          {subtitle && (
            <p className="text-sm text-white/70 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

// —— Button ——
const BUTTON_VARIANTS = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 active:from-primary-700 active:to-primary-800 shadow-md shadow-primary-500/25',
  secondary: 'bg-primary-50/80 text-primary-700 hover:bg-primary-100/80 active:bg-primary-200/80 border border-primary-200/50',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50/50',
  danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 active:bg-rose-200',
  outline: 'bg-white/80 border border-primary-200/60 text-primary-700 hover:bg-primary-50/50 active:bg-primary-100/50',
}
const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1',
  md: 'px-4 py-2 text-sm rounded-xl gap-1.5',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  icon: 'p-2 rounded-xl',
}

export function Button({ variant = 'primary', size = 'md', icon, iconRight, loading, children, className = '', ...rest }) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <Icon name="loader" size={16} className="animate-spin" />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />
      )}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  )
}

// —— Input ——
export function Input({ label, error, hint, icon, className = '', ...rest }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-primary-700">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <Icon name={icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
        )}
        <input
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm bg-primary-50/50 border border-primary-200/60 rounded-xl text-primary-900 placeholder:text-primary-400 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/15 transition ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''} ${className}`}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {hint && !error && <p className="text-xs text-primary-400">{hint}</p>}
    </div>
  )
}

// —— Textarea ——
export function Textarea({ label, error, hint, className = '', rows = 3, ...rest }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-primary-700">{label}</label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-3 py-2.5 text-sm bg-primary-50/50 border border-primary-200/60 rounded-xl text-primary-900 placeholder:text-primary-400 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/15 transition resize-none ${error ? 'border-rose-300' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {hint && !error && <p className="text-xs text-primary-400">{hint}</p>}
    </div>
  )
}

// —— Select ——
export function Select({ label, children, className = '', ...rest }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-primary-700">{label}</label>
      )}
      <div className="relative">
        <select
          className={`w-full appearance-none px-3 py-2.5 pr-9 text-sm bg-primary-50/50 border border-primary-200/60 rounded-xl text-primary-900 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/15 transition ${className}`}
          {...rest}
        >
          {children}
        </select>
        <Icon name="chevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
      </div>
    </div>
  )
}

// —— Chip（分类选择）——
export function Chip({ active, onClick, children, color = 'primary', className = '' }) {
  const colorMap = {
    primary: active ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30' : '',
    indigo: active ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30' : '',
    emerald: active ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : '',
    teal: active ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30' : '',
    rose: active ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : '',
    orange: active ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : '',
    violet: active ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30' : '',
    blue: active ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30' : '',
  }
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all btn-press ${
        active ? colorMap[color] || colorMap.primary : 'bg-white/80 text-primary-600 border border-primary-200/60 hover:border-primary-300/80'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// —— ChipGroup（横向滚动）——
export function ChipGroup({ items, value, onChange, color = 'primary', className = '' }) {
  return (
    <div className={`flex gap-2 overflow-x-auto no-scrollbar pb-1 ${className}`}>
      {items.map(item => (
        <Chip
          key={typeof item === 'string' ? item : item.value}
          active={value === (typeof item === 'string' ? item : item.value)}
          onClick={() => onChange(typeof item === 'string' ? item : item.value)}
          color={color}
        >
          {typeof item === 'string' ? item : item.label}
        </Chip>
      ))}
    </div>
  )
}

// —— EmptyState ——
export function EmptyState({ icon = 'fileText', title, description, action, className = '' }) {
  return (
    <div className={`text-center py-10 px-4 ${className}`}>
      <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-100/50 flex items-center justify-center text-primary-400 mb-3">
        <Icon name={icon} size={24} />
      </div>
      <p className="text-sm font-medium text-primary-800">{title}</p>
      {description && <p className="text-xs text-primary-400 mt-1 leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// —— LoadingState ——
export function LoadingState({ text = '加载中...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 ${className}`}>
      <Icon name="loader" size={28} className="text-primary-500 animate-spin" />
      <p className="text-xs text-primary-400 mt-3">{text}</p>
    </div>
  )
}

// —— ErrorState ——
export function ErrorState({ message = '加载失败', onRetry, className = '' }) {
  return (
    <div className={`text-center py-10 px-4 ${className}`}>
      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 mb-3">
        <Icon name="alertCircle" size={24} />
      </div>
      <p className="text-sm text-primary-800">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" icon="refreshCw" onClick={onRetry} className="mt-3">
          重试
        </Button>
      )}
    </div>
  )
}

// —— BottomSheet（底部弹层，毛玻璃风格）——
export function BottomSheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-primary-900/30 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-t-[1.75rem] shadow-2xl shadow-primary-500/10 animate-slide-up max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-primary-100/60">
          <h3 className="text-base font-semibold text-primary-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-primary-400 hover:bg-primary-50/80 hover:text-primary-600 transition btn-press"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-primary-100/60 bg-primary-50/30">{footer}</div>}
      </div>
    </div>
  )
}

// —— ProgressBar ——
export function ProgressBar({ value = 0, max = 100, color = 'primary', showLabel = false, className = '' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const colorMap = {
    primary: 'from-primary-400 to-primary-500',
    indigo: 'from-primary-400 to-primary-500',
    emerald: 'from-emerald-400 to-emerald-500',
    teal: 'from-teal-400 to-teal-500',
    rose: 'from-rose-400 to-rose-500',
    orange: 'from-orange-400 to-orange-500',
    violet: 'from-violet-400 to-violet-500',
    blue: 'from-blue-400 to-blue-500',
    amber: 'from-amber-400 to-orange-500',
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-primary-100/60 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorMap[color] || colorMap.primary} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-primary-500 tabular-nums w-10 text-right">{Math.round(percent)}%</span>
      )}
    </div>
  )
}

// —— RangeSlider ——
export function RangeSlider({ value, onChange, min = 0, max = 100, step = 1, color = '#8b5cf6', disabled, className = '' }) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={e => onChange(Number(e.target.value))}
      className={`w-full ${className}`}
      style={{
        background: `linear-gradient(to right, ${color} ${((value - min) / (max - min)) * 100}%, #e2e8f0 ${((value - min) / (max - min)) * 100}%)`,
      }}
    />
  )
}

// —— Stat（统计卡片）——
export function Stat({ label, value, unit, icon, trend, color = 'primary', onClick, className = '' }) {
  const colorMap = {
    primary: 'text-primary-500 bg-primary-100/50',
    indigo: 'text-primary-500 bg-primary-100/50',
    emerald: 'text-emerald-500 bg-emerald-50',
    teal: 'text-teal-500 bg-teal-50',
    rose: 'text-rose-500 bg-rose-50',
    orange: 'text-orange-500 bg-orange-50',
    violet: 'text-violet-500 bg-violet-50',
    blue: 'text-blue-500 bg-blue-50',
    amber: 'text-amber-500 bg-amber-50',
  }
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`bg-white/90 backdrop-blur-sm border border-primary-100/70 rounded-2xl p-4 shadow-gemini text-left card-shadow-hover ${onClick ? 'active:scale-[0.98] transition' : ''} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-primary-500">{label}</span>
        {icon && (
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
            <Icon name={icon} size={14} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-primary-900 tabular-nums">{value}</span>
        {unit && <span className="text-sm text-primary-400">{unit}</span>}
      </div>
      {trend && <p className="text-xs mt-1">{trend}</p>}
    </Comp>
  )
}

// —— Badge ——
export function Badge({ children, color = 'primary', className = '' }) {
  const colorMap = {
    primary: 'bg-primary-100/70 text-primary-700',
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-primary-100/70 text-primary-700',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-600',
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colorMap[color] || colorMap.primary} ${className}`}>
      {children}
    </span>
  )
}

// —— SectionHeader ——
export function SectionHeader({ title, icon, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h2 className="text-base font-semibold text-primary-900 flex items-center gap-1.5">
        {icon && <Icon name={icon} size={16} className="text-primary-400" />}
        {title}
      </h2>
      {action}
    </div>
  )
}

// —— Toast（全局轻提示，Gemini 毛玻璃风格）——
let toastListeners = new Set()
export function showToast(message, type = 'info', duration = 2000) {
  toastListeners.forEach(fn => fn({ message, type, id: Date.now(), duration }))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, toast.duration || 2000)
    }
    toastListeners.add(handler)
    return () => toastListeners.delete(handler)
  }, [])

  const iconMap = { success: 'checkCircle', error: 'alertCircle', info: 'info' }
  const colorMap = {
    success: 'text-emerald-600 bg-emerald-50/90 border-emerald-200/60',
    error: 'text-rose-600 bg-rose-50/90 border-rose-200/60',
    info: 'text-primary-600 bg-primary-50/90 border-primary-200/60',
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none" style={{ paddingTop: 'var(--safe-top)' }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg backdrop-blur-md animate-scale-in ${colorMap[t.type] || colorMap.info}`}
        >
          <Icon name={iconMap[t.type] || iconMap.info} size={16} />
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// —— ConfirmDialog（确认弹窗，Gemini 毛玻璃风格）——
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = '确认', cancelText = '取消', danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-primary-900/30 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-primary-500/15 max-w-sm w-full p-5 animate-scale-in border border-primary-100/50"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-primary-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-primary-600 leading-relaxed mb-4">{message}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>{cancelText}</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={() => { onConfirm(); onClose() }}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}

export { Icon, IconFilled } from './icons'