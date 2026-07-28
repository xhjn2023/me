import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayStr, formatDateCN, getStreakDays } from '../db/database'

const MOODS = [
  { key: 'down', emoji: '😞', label: '低落' },
  { key: 'plain', emoji: '😐', label: '平淡' },
  { key: 'good', emoji: '😊', label: '不错' },
  { key: 'happy', emoji: '😄', label: '开心' },
  { key: 'great', emoji: '🤩', label: '超赞' }
]

const DIMENSIONS = [
  { key: 'physical', label: '体能', color: 'bg-green-400', icon: '💪' },
  { key: 'mental', label: '心力', color: 'bg-indigo-400', icon: '💜' },
  { key: 'intellectual', label: '脑力', color: 'bg-amber-400', icon: '🧠' },
  { key: 'emotional', label: '情绪', color: 'bg-pink-400', icon: '💕' }
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

  const review = useLiveQuery(() =>
    db.reviews.where('date').equals(today).first()
  , [today])

  const todayTasks = useLiveQuery(() =>
    db.tasks.where('date').equals(today).toArray()
  , [today]) || []

  useEffect(() => {
    getStreakDays(db.reviews, 'date').then(setStreakDays)
    if (review) {
      setMood(review.mood || 'happy')
      setDimensions({
        physical: review.physical || 7.5,
        mental: review.mental || 8.0,
        intellectual: review.intellectual || 7.0,
        emotional: review.emotional || 8.5
      })
    }
  }, [review?.id])

  async function saveReview() {
    const data = {
      date: today,
      mood,
      ...dimensions,
      completion: Math.round((todayTasks.filter(t => t.done).length / Math.max(todayTasks.length, 1)) * 100)
    }
    if (review) {
      await db.reviews.update(review.id, data)
    } else {
      await db.reviews.add(data)
    }
  }

  useEffect(() => {
    saveReview()
  }, [mood, dimensions])

  const doneCount = todayTasks.filter(t => t.done).length
  const totalCount = todayTasks.length
  const completion = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="animate-fade-in pb-24">
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">每日复盘</h1>
            <p className="text-sm text-white/80 mt-0.5">每日复盘 · 第{streakDays + 20}天</p>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              🔍
            </button>
            <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              🔔
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl p-5 text-white card-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20 text-6xl">📝</div>
          <p className="text-white/80 text-sm">{formatDateCN(today)}</p>
          <h2 className="text-2xl font-bold mt-1">每日复盘</h2>
          <div className="flex items-center gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{streakDays + 21}<span className="text-base text-white/70">天</span></p>
              <p className="text-xs text-white/70">连续复盘</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{completion}<span className="text-base text-white/70">%</span></p>
              <p className="text-xs text-white/70">今日完成率</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">😊</span>
            <h3 className="font-semibold text-gray-800">今日情绪</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">选择你此刻的心情</p>
          <div className="flex justify-between">
            {MOODS.map(m => (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl transition-all ${
                  mood === m.key
                    ? 'bg-indigo-50 scale-110 shadow-lg'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-3xl ${mood === m.key ? 'scale-110' : ''}`}>{m.emoji}</span>
                <span className={`text-xs ${mood === m.key ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="space-y-4">
            {DIMENSIONS.map(dim => (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{dim.label}</span>
                  <span className="text-sm font-medium text-gray-800">{dimensions[dim.key]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={dimensions[dim.key]}
                  onChange={e => setDimensions(prev => ({ ...prev, [dim.key]: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${getColorFromKey(dim.key)} ${(dimensions[dim.key] / 10) * 100}%, #f3f4f6 ${(dimensions[dim.key] / 10) * 100}%)`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h3 className="font-semibold text-gray-800">今日待办回顾</h3>
            </div>
            <span className="text-sm font-medium text-green-500 bg-green-50 px-3 py-1 rounded-full">
              {completion}%
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-4">完成 {doneCount}/{totalCount} 项</p>
          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">今日暂无待办任务</p>
            ) : (
              todayTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    task.done ? 'bg-gray-50' : 'bg-white border border-gray-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                    task.done ? 'bg-green-500' : 'border-2 border-gray-300'
                  }`}>
                    {task.done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.time || ''} · {task.done ? '已完成' : (task.category || '待完成')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getColorFromKey(key) {
  const colors = {
    physical: '#4ade80',
    mental: '#818cf8',
    intellectual: '#fbbf24',
    emotional: '#f472b6'
  }
  return colors[key] || '#818cf8'
}
