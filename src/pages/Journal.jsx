import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayStr, formatDateCN } from '../db/database'

const MOODS = [
  { key: 'great', emoji: '😄', label: '很棒' },
  { key: 'good', emoji: '🙂', label: '不错' },
  { key: 'ok', emoji: '😐', label: '一般' },
  { key: 'down', emoji: '😕', label: '低落' },
  { key: 'bad', emoji: '😢', label: '糟糕' }
]

export default function Journal() {
  const today = todayStr()
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('ok')
  const [saved, setSaved] = useState(false)

  const journal = useLiveQuery(() =>
    db.journals.where('date').equals(today).first()
  , [today])

  useEffect(() => {
    if (journal) {
      setContent(journal.content || '')
      setMood(journal.mood || 'ok')
    }
  }, [journal?.id])

  async function save() {
    const data = { date: today, content: content.trim(), mood, updatedAt: Date.now() }
    if (journal) {
      await db.journals.update(journal.id, data)
    } else {
      await db.journals.add(data)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="animate-fade-in px-4 pt-3 pb-24">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-sky-800">今日日记</h1>
        <p className="text-sm text-sky-500 mt-0.5">{formatDateCN(today)}</p>
      </div>

      {/* 心情选择 */}
      <div className="bg-white rounded-2xl p-4 card-shadow mb-4">
        <p className="text-sm text-sky-700 font-medium mb-3">今天心情如何？</p>
        <div className="flex justify-between">
          {MOODS.map(m => (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl btn-press transition-all ${
                mood === m.key ? 'bg-sky-100 scale-110' : ''
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className={`text-xs ${mood === m.key ? 'text-sky-600 font-medium' : 'text-gray-400'}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 日记输入 */}
      <div className="bg-white rounded-2xl p-4 card-shadow mb-4">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="记录今天发生的事、想法、感受..."
          rows={10}
          className="w-full text-sm text-gray-700 focus:outline-none resize-none"
        />
      </div>

      {/* 保存按钮 */}
      <button
        onClick={save}
        className="w-full py-3.5 bg-sky-400 text-white rounded-xl btn-press card-shadow font-medium text-sm flex items-center justify-center gap-2"
      >
        {saved ? '✓ 已保存' : '保存日记'}
      </button>

      <p className="text-xs text-gray-300 text-center mt-3">
        数据自动保存在本地，关掉再打开还在
      </p>
    </div>
  )
}
