import { useState } from 'react'
import { BottomSheet, Button, Icon } from '../../components/ui'

const WEEKS = ['日', '一', '二', '三', '四', '五', '六']

function toStr(d) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

/**
 * 日历弹窗：选择指定日期
 * 用于替代原生 date input，提供更好的视觉与交互
 */
export default function NoteCalendar({ open, date, onClose, onSelect }) {
  const initial = date ? new Date(date) : new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  // 月份切换后同步外部 date
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    const now = new Date()
    // 不允许超过当月
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = toStr(new Date())
  const selected = date

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toStr(new Date(viewYear, viewMonth, d)))
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="选择日期">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
          aria-label="上个月"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <span className="text-base font-semibold text-slate-800">
          {viewYear} 年 {viewMonth + 1} 月
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition disabled:opacity-30"
          disabled={viewYear === new Date().getFullYear() && viewMonth === new Date().getMonth()}
          aria-label="下个月"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKS.map(w => (
          <div key={w} className="text-center text-xs text-slate-400 font-medium py-1">周{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />
          const isToday = d === today
          const isSelected = d === selected
          const isFuture = d > today
          return (
            <button
              key={d}
              onClick={() => !isFuture && onSelect?.(d)}
              disabled={isFuture}
              className={`aspect-square rounded-lg text-sm transition-all ${
                isSelected
                  ? 'bg-teal-500 text-white font-semibold shadow-sm'
                  : isToday
                  ? 'bg-teal-50 text-teal-600 font-medium'
                  : isFuture
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {Number(d.slice(8))}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          icon="calendar"
          onClick={() => onSelect?.(today)}
        >
          回到今天
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          取消
        </Button>
      </div>
    </BottomSheet>
  )
}
