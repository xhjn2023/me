import { useState } from 'react'
import { tasksApi, todayStr, formatDateCN } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: '工作', label: '工作' },
  { key: '学习', label: '学习' },
  { key: '生活', label: '生活' },
  { key: '副业', label: '副业' }
]

const CATEGORY_COLORS = {
  '工作': 'bg-blue-100 text-blue-600',
  '学习': 'bg-green-100 text-green-600',
  '生活': 'bg-emerald-100 text-emerald-600',
  '副业': 'bg-orange-100 text-orange-600'
}

export default function Work() {
  const today = todayStr()
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('all')
  const [newCategory, setNewCategory] = useState('工作')

  const { data: rawTasks, refresh: refreshTasks } = useAsyncData(
    () => tasksApi.getByDate(today, category === 'all' ? undefined : category),
    [today, category]
  )

  const { data: rawTimelineTasks, refresh: refreshTimeline } = useAsyncData(
    () => tasksApi.getByDate(today),
    [today]
  )

  const tasks = (rawTasks || []).slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (a.time || '').localeCompare(b.time || '')
  })

  const timelineTasks = (rawTimelineTasks || [])
    .filter(t => t.time)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  async function addTask() {
    const text = input.trim()
    if (!text) return
    await tasksApi.add({
      title: text,
      done: false,
      priority: 0,
      category: newCategory,
      time: '',
      date: today,
      createdAt: Date.now()
    })
    setInput('')
    refreshTasks()
    refreshTimeline()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  async function toggleTask(id, done) {
    await tasksApi.update(id, { done: !done })
    refreshTasks()
    refreshTimeline()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  async function deleteTask(id) {
    await tasksApi.delete(id)
    refreshTasks()
    refreshTimeline()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  const doneCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length

  return (
    <div className="animate-fade-in pb-24">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-5 text-white rounded-b-3xl">
        <h1 className="text-xl font-bold">个人工作台</h1>
        <p className="text-sm text-white/80 mt-0.5">{formatDateCN(today)}</p>
      </div>

      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  category === cat.key
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="添加任务..."
              className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:bg-gray-100"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none"
            >
              <option value="工作">工作</option>
              <option value="学习">学习</option>
              <option value="生活">生活</option>
              <option value="副业">副业</option>
            </select>
            <button
              onClick={addTask}
              className="w-10 h-10 bg-indigo-500 text-white rounded-xl btn-press flex items-center justify-center text-lg"
            >
              +
            </button>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p className="text-3xl mb-2">📋</p>
                <p>暂无任务，添加一个吧</p>
              </div>
            )}
            {tasks.map(task => (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  task.done ? 'bg-gray-50' : 'bg-white border border-gray-100'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id, task.done)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                    task.done ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}
                >
                  {task.done && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.category && (
                      <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[task.category] || 'bg-gray-100 text-gray-500'}`}>
                        {task.category}
                      </span>
                    )}
                    {task.time && (
                      <span className="text-xs text-gray-400">· {task.time}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-300 hover:text-red-400 text-xs btn-press"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-slate-800 mb-3">今日时间轴</h2>
        <div className="bg-white rounded-2xl p-4 card-shadow">
          {timelineTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <p className="text-2xl mb-2">⏰</p>
              <p>暂无时间安排</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineTasks.map((task, index) => (
                <div key={task.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      task.done ? 'bg-green-100' : 'bg-indigo-100'
                    }`}>
                      {task.category === '工作' ? '💼' : task.category === '学习' ? '📚' : task.category === '生活' ? '🌱' : '🚀'}
                    </div>
                    {index < timelineTasks.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 mt-1" style={{ minHeight: '20px' }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-xs text-gray-400">{task.time}</p>
                    <h3 className={`font-medium ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.done ? '已完成' : task.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
