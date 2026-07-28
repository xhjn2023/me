import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayStr } from '../db/database'

export default function Tasks() {
  const today = todayStr()
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all') // all | active | done

  const tasks = useLiveQuery(async () => {
    let collection = db.tasks.where('date').equals(today)
    let items = await collection.toArray()
    if (filter === 'active') items = items.filter(t => !t.done)
    if (filter === 'done') items = items.filter(t => t.done)
    // 按优先级降序，创建时间升序
    items.sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.createdAt - b.createdAt)
    return items
  }, [today, filter]) || []

  async function addTask() {
    const text = input.trim()
    if (!text) return
    await db.tasks.add({
      title: text,
      done: false,
      priority: 0,
      date: today,
      createdAt: Date.now()
    })
    setInput('')
  }

  async function toggleTask(id, done) {
    await db.tasks.update(id, { done: !done })
  }

  async function deleteTask(id) {
    await db.tasks.delete(id)
  }

  async function setPriority(id, priority) {
    await db.tasks.update(id, { priority })
  }

  return (
    <div className="animate-fade-in px-4 pt-3 pb-24">
      <h1 className="text-xl font-bold text-sky-800 mb-4">今日任务</h1>

      {/* 输入框 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="添加一个任务..."
          className="flex-1 px-4 py-3 bg-white rounded-xl border border-sky-100 text-sm focus:outline-none focus:border-sky-400 card-shadow"
        />
        <button
          onClick={addTask}
          className="px-5 py-3 bg-sky-400 text-white rounded-xl btn-press card-shadow font-medium text-sm"
        >
          添加
        </button>
      </div>

      {/* 过滤标签 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: '全部' },
          { key: 'active', label: '未完成' },
          { key: 'done', label: '已完成' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === tab.key
                ? 'bg-sky-400 text-white'
                : 'bg-white text-sky-500 card-shadow'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🌸</p>
            <p className="text-sm text-gray-400">今天还没有任务</p>
          </div>
        )}
        {tasks.map(task => (
          <div
            key={task.id}
            className="bg-white rounded-xl p-3 card-shadow flex items-center gap-3 animate-fade-in"
          >
            {/* 完成勾选 */}
            <button
              onClick={() => toggleTask(task.id, task.done)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center btn-press flex-shrink-0 ${
                task.done ? 'bg-sky-400 border-sky-400' : 'border-gray-300'
              }`}
            >
              {task.done && <span className="text-white text-xs">✓</span>}
            </button>

            {/* 任务文本 */}
            <span
              className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}
              onClick={() => setPriority(task.id, task.priority === 1 ? 0 : 1)}
            >
              {task.priority === 1 && <span className="text-orange-400 mr-1">★</span>}
              {task.title}
            </span>

            {/* 删除 */}
            <button
              onClick={() => deleteTask(task.id)}
              className="text-gray-300 hover:text-red-400 text-sm btn-press"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
