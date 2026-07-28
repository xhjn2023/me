import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayStr, formatDateCN } from '../db/database'

export default function Dashboard({ onNavigate }) {
  const today = todayStr()

  const todayTasks = useLiveQuery(() =>
    db.tasks.where('date').equals(today).toArray()
  , [today]) || []

  const notes = useLiveQuery(() =>
    db.notes.orderBy('updatedAt').reverse().limit(5).toArray()
  ) || []

  const journal = useLiveQuery(() =>
    db.journals.where('date').equals(today).first()
  , [today])

  const doneCount = todayTasks.filter(t => t.done).length
  const totalCount = todayTasks.length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const now = new Date()
  const hour = now.getHours()
  let greeting = '早上好'
  if (hour >= 12 && hour < 18) greeting = '下午好'
  else if (hour >= 18) greeting = '晚上好'
  else if (hour < 6) greeting = '夜深了'

  return (
    <div className="animate-fade-in px-4 pt-3 pb-24">
      {/* 头部问候 */}
      <div className="mb-5">
        <p className="text-sm text-sky-600">{formatDateCN(today)}</p>
        <h1 className="text-2xl font-bold text-sky-800 mt-1">{greeting} 👋</h1>
      </div>

      {/* 今日任务进度卡片 */}
      <div
        className="bg-gradient-to-br from-sky-400 to-sky-500 rounded-2xl p-5 text-white card-shadow btn-press cursor-pointer mb-4"
        onClick={() => onNavigate('tasks')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sky-100 text-sm">今日任务</p>
            <p className="text-3xl font-bold mt-1">{doneCount}<span className="text-lg text-sky-200">/{totalCount}</span></p>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* 快捷入口网格 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <QuickCard icon="📝" label="写笔记" count={notes.length} onClick={() => onNavigate('notes')} />
        <QuickCard icon="📖" label="今日日记" count={journal ? '已写' : '未写'} onClick={() => onNavigate('journal')} />
      </div>

      {/* 最近笔记预览 */}
      <div className="bg-white rounded-2xl p-4 card-shadow mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sky-800">最近笔记</h2>
          <button className="text-xs text-sky-500" onClick={() => onNavigate('notes')}>全部 →</button>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">还没有笔记，去写一篇吧</p>
        ) : (
          <div className="space-y-2">
            {notes.map(note => (
              <div key={note.id} className="flex items-center gap-2 py-1">
                <span className={`w-1.5 h-1.5 rounded-full ${note.pinned ? 'bg-sky-400' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600 truncate">{note.title || note.content.slice(0, 20)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 今日日记预览 */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h2 className="font-semibold text-sky-800 mb-2">今日日记</h2>
        {journal ? (
          <p className="text-sm text-gray-600 line-clamp-3">{journal.content}</p>
        ) : (
          <button
            className="text-sm text-sky-500 py-2"
            onClick={() => onNavigate('journal')}
          >
            记录今天的心情 →
          </button>
        )}
      </div>
    </div>
  )
}

function QuickCard({ icon, label, count, onClick }) {
  return (
    <div
      className="bg-white rounded-2xl p-4 card-shadow btn-press cursor-pointer flex flex-col items-center justify-center"
      onClick={onClick}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-sm font-medium text-sky-700">{label}</span>
      <span className="text-xs text-gray-400 mt-0.5">{count}</span>
    </div>
  )
}
