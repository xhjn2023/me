import { tasksApi, studyRecordsApi, todayStr, formatDateCN, getStreakDays } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, Stat, Card, Icon } from '../components/ui'
import WeatherCard from '../components/WeatherCard'
import { HEALING_QUOTES } from './healingQuotes'

const MODULES = [
  { key: 'work', icon: 'briefcase', label: '工作', desc: '店长 · 人事 · 财务', color: 'blue' },
  { key: 'study', icon: 'graduationCap', label: '学习', desc: '人事 · 超市 · 内心 · 智慧', color: 'emerald' },
  { key: 'life', icon: 'leaf', label: '生活', desc: '日记 · 运动 · 饮食 · 睡眠', color: 'teal' },
  { key: 'medicine', icon: 'pill', label: '用药', desc: '打卡 · 药瓶 · 历史', color: 'rose' },
  { key: 'side', icon: 'rocket', label: '副业', desc: '自媒体 · 其他项目', color: 'orange' },
  { key: 'review', icon: 'clipboardList', label: '复盘', desc: '情绪 · 四维评分', color: 'violet' },
]

const COLOR_BG = {
  blue: 'bg-blue-50 text-blue-500',
  emerald: 'bg-emerald-50 text-emerald-500',
  teal: 'bg-teal-50 text-teal-500',
  rose: 'bg-rose-50 text-rose-500',
  orange: 'bg-orange-50 text-orange-500',
  violet: 'bg-violet-50 text-violet-500',
  indigo: 'bg-indigo-50 text-indigo-500',
}

export default function Dashboard({ onNavigate }) {
  const today = todayStr()
  const [streak, setStreak] = useState(0)
  const [studyTime, setStudyTime] = useState(0)

  const { data: todayTasks, refresh: refreshTasks } = useAsyncData(
    () => tasksApi.getByDate(today), [today]
  )

  useEffect(() => {
    if (todayTasks) getStreakDays(todayTasks, 'date').then(setStreak)
  }, [todayTasks])

  useEffect(() => {
    const weekDates = getWeekDateRange()
    studyRecordsApi.getByDates(weekDates).then(records => {
      const total = records.reduce((sum, r) => sum + (r.duration || 0), 0)
      setStudyTime(Math.round(total / 60))
    })
  }, [])

  // 监听全局刷新
  useEffect(() => {
    const handler = () => refreshTasks()
    window.addEventListener('app-data-changed', handler)
    return () => window.removeEventListener('app-data-changed', handler)
  }, [refreshTasks])

  const tasks = todayTasks || []
  const doneCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length

  // 治愈短句：按天轮换，点击刷新换下一条
  const dayIndex = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    return Math.floor((now - start) / 86400000) % HEALING_QUOTES.length
  }, [])
  const [healingIdx, setHealingIdx] = useState(dayIndex)
  const healingQuote = HEALING_QUOTES[healingIdx]

  const now = new Date()
  const hour = now.getHours()
  let greeting = '早上好'
  if (hour >= 12 && hour < 18) greeting = '下午好'
  else if (hour >= 18) greeting = '晚上好'
  else if (hour < 6) greeting = '夜深了'

  return (
    <div className="animate-fade-in pb-4">
      <PageHeader
        title={`${greeting}`}
        subtitle={`${formatDateCN(today)} · ${totalCount > 0 ? `今日 ${doneCount}/${totalCount} 任务` : '开始规划今天吧'}`}
        accent="dashboard"
      />

      {/* 统计卡片 */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          <Stat
            label="今日任务"
            value={`${doneCount}/${totalCount}`}
            icon="listChecks"
            color="indigo"
            className="shadow-md"
          />
          <Stat
            label="本周学习"
            value={studyTime}
            unit="h"
            icon="clock"
            color="emerald"
            className="shadow-md"
          />
          <Stat
            label="连续打卡"
            value={streak}
            unit="天"
            icon="flame"
            color="orange"
            className="shadow-md"
          />
        </div>
      </div>

      {/* 每日天气 */}
      <WeatherCard />

      {/* 模块快捷入口 */}
      <div className="px-4 mt-5">
        <div className="grid grid-cols-3 gap-3">
          {MODULES.map(m => (
            <button
              key={m.key}
              onClick={() => onNavigate(m.key)}
              className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm hover:border-slate-300 active:scale-[0.97] transition btn-press"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${COLOR_BG[m.color]}`}>
                <Icon name={m.icon} size={20} />
              </div>
              <p className="text-sm font-medium text-slate-700 text-left">{m.label}</p>
              <p className="text-[10px] text-slate-400 text-left mt-0.5 leading-tight line-clamp-1">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 治愈板块：滚动短句 */}
      <div className="px-4 mt-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-rose-50 to-teal-50 border border-rose-100/60 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-rose-400 flex-shrink-0">
              <Icon name="moon" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-rose-400 mb-1 tracking-wide">HEALING · 治愈</p>
              <p className="text-sm text-slate-600 leading-relaxed">{healingQuote}</p>
            </div>
            <button
              onClick={() => setHealingIdx(i => (i + 1) % HEALING_QUOTES.length)}
              className="text-rose-300 hover:text-rose-500 transition flex-shrink-0 mt-1.5 p-1 rounded-md hover:bg-white/50"
              aria-label="换一条"
              title="换一条"
            >
              <Icon name="refreshCw" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 今日任务预览 */}
      {totalCount > 0 && (
        <div className="px-4 mt-5">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Icon name="listChecks" size={16} className="text-slate-400" />
                今日任务
              </h2>
              <button
                onClick={() => onNavigate('work')}
                className="text-xs text-indigo-500 flex items-center gap-0.5 hover:underline"
              >
                全部 <Icon name="chevronRight" size={12} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {tasks.slice(0, 4).map(task => (
                <div key={task.id} className="px-4 py-2.5 flex items-center gap-3">
                  <Icon
                    name={task.done ? 'checkCircle' : 'circle'}
                    size={16}
                    className={task.done ? 'text-emerald-500' : 'text-slate-300'}
                  />
                  <span className={`text-sm flex-1 ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function getWeekDateRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const start = new Date(now)
  start.setDate(now.getDate() - day + 1)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}
