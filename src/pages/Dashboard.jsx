import { tasksApi, coursesApi, studyRecordsApi, todayStr, formatDateCN, getStreakDays } from '../db/database'
import { useAsyncData, triggerGlobalRefresh } from '../hooks/useAsyncData'
import { useEffect, useState, useCallback } from 'react'

export default function Dashboard({ onNavigate }) {
  const today = todayStr()
  const [streak, setStreak] = useState(0)
  const [studyTime, setStudyTime] = useState(0)

  const { data: todayTasks, refresh: refreshTasks } = useAsyncData(
    () => tasksApi.getByDate(today), [today]
  )
  const { data: allTasks } = useAsyncData(
    () => tasksApi.getByDate(today), [today]
  )

  useEffect(() => {
    if (allTasks) getStreakDays(allTasks, 'date').then(setStreak)
  }, [allTasks])

  useEffect(() => {
    const weekDates = getWeekDateRange()
    studyRecordsApi.getByDates(weekDates).then(records => {
      const total = records.reduce((sum, r) => sum + (r.duration || 0), 0)
      setStudyTime(Math.round(total / 60))
    })
  }, [])

  // 监听全局刷新
  const handleRefresh = useCallback(() => { refreshTasks() }, [refreshTasks])
  useEffect(() => {
    import('../hooks/useAsyncData').then(({ useGlobalRefresh }) => {
      // useGlobalRefresh 是在组件中调用的，这里用事件方式
    })
    const handler = () => refreshTasks()
    window.addEventListener('app-data-changed', handler)
    return () => window.removeEventListener('app-data-changed', handler)
  }, [refreshTasks])

  const tasks = todayTasks || []
  const doneCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length

  const now = new Date()
  const hour = now.getHours()
  let greeting = '早上好'
  if (hour >= 12 && hour < 18) greeting = '下午好'
  else if (hour >= 18) greeting = '晚上好'
  else if (hour < 6) greeting = '夜深了'

  return (
    <div className="animate-fade-in pb-24">
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white rounded-b-3xl">
        <p className="text-white/80 text-sm">{formatDateCN(today)}</p>
        <h1 className="text-2xl font-bold mt-1">{greeting}，加油工作</h1>
        <p className="text-lg mt-1">{totalCount > 0 ? '今天是充实的一天' : '开始规划今天吧'}</p>

        <div className="flex items-center gap-6 mt-4">
          <div>
            <p className="text-3xl font-bold">{doneCount}<span className="text-lg text-white/70">/{totalCount}</span></p>
            <p className="text-xs text-white/70">今日任务</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{studyTime}<span className="text-lg text-white/70">h</span></p>
            <p className="text-xs text-white/70">学习时长</p>
          </div>
          <div>
            <p className="text-3xl font-bold flex items-center gap-1">🔥{streak}</p>
            <p className="text-xs text-white/70">连续打卡</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'work', icon: '💼', label: '工作' },
              { key: 'study', icon: '📚', label: '学习' },
              { key: 'life', icon: '🌱', label: '生活' },
              { key: 'side', icon: '🚀', label: '副业' },
              { key: 'review', icon: '📝', label: '复盘' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="flex flex-col items-center gap-1 btn-press"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${getCategoryBg(item.key)}`}>
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-slate-800 mb-3">五大板块</h2>
        <div className="space-y-3">
          {[
            { key: 'work', icon: '💼', title: '工作', desc: '店长 · 人事 · 财务', gradient: 'from-blue-500 to-indigo-500' },
            { key: 'study', icon: '📚', title: '学习', desc: '人事专业 · 超市经营 · 内心能量 · 人生智慧', gradient: 'from-green-500 to-teal-500' },
            { key: 'life', icon: '🌱', title: '生活', desc: '饮食 · 运动', gradient: 'from-emerald-500 to-green-500' },
            { key: 'side', icon: '🚀', title: '副业', desc: '自媒体 · 其他项目', gradient: 'from-orange-500 to-red-500' },
            { key: 'review', icon: '📝', title: '复盘', desc: '每日总结 · 情绪记录', gradient: 'from-purple-500 to-pink-500' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="w-full bg-white rounded-2xl p-4 card-shadow flex items-center gap-3 btn-press hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl`}>
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </button>
          ))}
        </div>
      </div>
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

function getCategoryBg(key) {
  const map = {
    work: 'bg-blue-50', study: 'bg-green-50', life: 'bg-emerald-50',
    side: 'bg-orange-50', review: 'bg-purple-50'
  }
  return map[key] || 'bg-gray-50'
}
