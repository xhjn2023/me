import { useState } from 'react'
import { lifeRecordsApi, todayStr } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'

const TYPES = [
  { key: '运动', icon: '🏃', color: 'bg-green-100 text-green-600' },
  { key: '饮食', icon: '🍎', color: 'bg-orange-100 text-orange-600' },
  { key: '睡眠', icon: '😴', color: 'bg-blue-100 text-blue-600' },
  { key: '健康', icon: '💊', color: 'bg-pink-100 text-pink-600' },
  { key: '娱乐', icon: '🎮', color: 'bg-purple-100 text-purple-600' }
]

export default function Life() {
  const today = todayStr()
  const [input, setInput] = useState('')
  const [type, setType] = useState('运动')

  const { data: records, refresh } = useAsyncData(() => lifeRecordsApi.getByDate(today), [today])
  const recordsList = records || []

  async function addRecord() {
    const text = input.trim()
    if (!text) return
    await lifeRecordsApi.add({
      date: today,
      type,
      content: text,
      createdAt: Date.now()
    })
    setInput('')
    refresh()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  async function deleteRecord(id) {
    await lifeRecordsApi.delete(id)
    refresh()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  const groupedRecords = TYPES.map(t => ({
    ...t,
    records: recordsList.filter(r => r.type === t.key)
  }))

  return (
    <div className="animate-fade-in pb-24">
      <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-5 text-white rounded-b-3xl">
        <h1 className="text-xl font-bold">生活</h1>
        <p className="text-sm text-white/80 mt-0.5">记录健康生活每一天</p>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  type === t.key
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t.icon} {t.key}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRecord()}
              placeholder={`记录${type}内容...`}
              className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:bg-gray-100"
            />
            <button
              onClick={addRecord}
              className="w-10 h-10 bg-green-500 text-white rounded-xl btn-press flex items-center justify-center text-lg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {groupedRecords.map(group => (
          <div key={group.key} className="bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{group.icon}</span>
                <span className="font-medium text-gray-700">{group.key}</span>
              </div>
              <span className="text-xs text-gray-400">{group.records.length} 项</span>
            </div>
            <div className="p-4">
              {group.records.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">暂无记录</p>
              ) : (
                <div className="space-y-2">
                  {group.records.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${group.color}`}>
                          {group.icon}
                        </span>
                        <span className="text-sm text-gray-700">{record.content}</span>
                      </div>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="text-gray-300 hover:text-red-400 text-xs"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
