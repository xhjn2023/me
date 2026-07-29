import { useState, useEffect, useRef } from 'react'
import { reviewsApi, tasksApi, todayStr, formatDateCN, getStreakDays } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  PageHeader, Card, RangeSlider, EmptyState,
  SectionHeader, Badge, Icon, showToast
} from '../components/ui'

// 今日情绪：5 个按钮，emoji 改为 Icon（smile / meh / frown 等）
const MOODS = [
  { key: 'down',  icon: 'frown', label: '低落' },
  { key: 'plain', icon: 'meh',   label: '平淡' },
  { key: 'good',  icon: 'smile', label: '不错' },
  { key: 'happy', icon: 'star',  label: '开心' },
  { key: 'great', icon: 'flame', label: '超赞' }
]

// 四维评分：每维一个颜色，icon 用对应语义图标
const DIMENSIONS = [
  { key: 'physical',      label: '体能', icon: 'battery',    color: '#10b981', textClass: 'text-emerald-500' },
  { key: 'mental',        label: '心力', icon: 'heartPulse', color: '#6366f1', textClass: 'text-indigo-500' },
  { key: 'intellectual',  label: '脑力', icon: 'brain',      color: '#f59e0b', textClass: 'text-amber-500' },
  { key: 'emotional',     label: '情绪', icon: 'smile',      color: '#f43f5e', textClass: 'text-rose-500' }
]

export default function Review() {
  const today = todayStr()
  const [mood, setMood] = useState('happy')
  const [dimensions, setDimensions] = useState({
    physical: 7.5,
    mental: 8.0,
    intellectual: 7.0,
    emotional: 8.5
  })
  const [streakDays, setStreakDays] = useState(0)
  const skipSaveRef = useRef(true)

  const { data: review } = useAsyncData(() => reviewsApi.getByDate(today), [today])
  const { data: todayTasks } = useAsyncData(() => tasksApi.getByDate(today), [today])
  const { data: allReviews } = useAsyncData(() => reviewsApi.getAll(), [])

  const tasks = todayTasks || []

  // review 数据变化时，同步到本地 state（mood 和 dimensions）
  useEffect(() => {
    if (review) {
      skipSaveRef.current = true
      setMood(review.mood || 'happy')
      setDimensions({
        physical: review.physical || 7.5,
        mental: review.mental || 8.0,
        intellectual: review.intellectual || 7.0,
        emotional: review.emotional || 8.5
      })
    }
  }, [review?.id])

  // streakDays 通过 reviewsApi.getAll() 获取所有复盘记录后用 getStreakDays 计算
  useEffect(() => {
    if (allReviews) {
      getStreakDays(allReviews, 'date').then(setStreakDays)
    }
  }, [allReviews])

  // mood 和 dimensions 变化时自动保存（upsert），跳过初始化触发的保存
  // 加入 500ms 防抖，避免拖动滑块时频繁触发；保存成功后弹出 toast
  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    const doneCount = tasks.filter(t => t.done).length
    const completion = Math.round((doneCount / Math.max(tasks.length, 1)) * 100)
    const timer = setTimeout(() => {
      reviewsApi.upsert({
        date: today,
        mood,
        ...dimensions,
        completion
      }).then(() => showToast('已保存', 'success', 1000))
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, dimensions])

  const doneCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length
  const completion = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        accent="review"
        icon="clipboardList"
        title="每日复盘"
        subtitle={`第 ${streakDays} 天`}
      />

      {/* Hero 卡片：连续天数 + 完成率（移除 +20/+21 偏移） */}
      <div className="px-4 mt-4">
        <Card className="p-5 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 border-0 text-white shadow-md shadow-purple-500/20 relative overflow-hidden">
          <div className="absolute -top-3 -right-3 text-white/10 pointer-events-none">
            <Icon name="clipboardList" size={88} />
          </div>
          <p className="text-white/80 text-sm relative">{formatDateCN(today)}</p>
          <h2 className="text-xl font-bold mt-1 relative">每日复盘</h2>
          <div className="flex items-center gap-6 mt-4 relative">
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {streakDays}<span className="text-base text-white/70 ml-0.5">天</span>
              </p>
              <p className="text-xs text-white/70">连续复盘</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {completion}<span className="text-base text-white/70 ml-0.5">%</span>
              </p>
              <p className="text-xs text-white/70">今日完成率</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 今日情绪 */}
      <div className="px-4 mt-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="smile" size={18} className="text-violet-500" />
            <h3 className="font-semibold text-slate-800 text-sm">今日情绪</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">选择你此刻的心情</p>
          <div className="flex justify-between gap-1">
            {MOODS.map(m => (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-2xl flex-1 transition-all btn-press ${
                  mood === m.key
                    ? 'bg-indigo-50 scale-110 shadow-sm'
                    : 'hover:bg-slate-50'
                }`}
              >
                <Icon
                  name={m.icon}
                  size={26}
                  className={mood === m.key ? 'text-indigo-500' : 'text-slate-400'}
                />
                <span className={`text-xs ${mood === m.key ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* 四维评分 */}
      <div className="px-4 mt-4">
        <Card className="p-5">
          <SectionHeader title="四维评分" icon="zap" />
          <div className="space-y-4">
            {DIMENSIONS.map(dim => (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Icon name={dim.icon} size={14} className={dim.textClass} />
                    {dim.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">
                    {dimensions[dim.key]}
                  </span>
                </div>
                <RangeSlider
                  value={dimensions[dim.key]}
                  onChange={v => setDimensions(prev => ({ ...prev, [dim.key]: v }))}
                  min={1}
                  max={10}
                  step={0.5}
                  color={dim.color}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 今日待办回顾 */}
      <div className="px-4 mt-4">
        <Card className="p-5">
          <SectionHeader
            title="今日待办回顾"
            icon="listChecks"
            action={<Badge color="green">{completion}%</Badge>}
          />
          <p className="text-xs text-slate-400 mb-3 -mt-2">完成 {doneCount}/{totalCount} 项</p>
          {tasks.length === 0 ? (
            <EmptyState
              icon="listChecks"
              title="今日暂无待办任务"
              description="去工作页面添加任务吧"
            />
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    task.done ? 'bg-slate-50' : 'bg-white border border-slate-100'
                  }`}
                >
                  <Icon
                    name={task.done ? 'checkCircle' : 'circle'}
                    size={18}
                    className={task.done ? 'text-emerald-500' : 'text-slate-300'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {task.time || ''} · {task.done ? '已完成' : (task.category || '待完成')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
