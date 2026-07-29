import { useState } from 'react'
import { lifeRecordsApi, todayStr } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  PageHeader, Card, Button, Input, Textarea, ChipGroup,
  EmptyState, LoadingState, Icon
} from '../components/ui'

// 类型顺序固定不变：日记 → 运动 → 饮食 → 睡眠 → 健康 → 娱乐
const TYPES = [
  { key: '日记', icon: 'penLine', color: 'bg-amber-50 text-amber-600' },
  { key: '运动', icon: 'flame', color: 'bg-orange-50 text-orange-600' },
  { key: '饮食', icon: 'utensils', color: 'bg-orange-50 text-orange-600' },
  { key: '睡眠', icon: 'moon', color: 'bg-blue-50 text-blue-600' },
  { key: '健康', icon: 'heartPulse', color: 'bg-rose-50 text-rose-600' },
  { key: '娱乐', icon: 'gamepad', color: 'bg-violet-50 text-violet-600' }
]

export default function Life() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [input, setInput] = useState('')
  const [type, setType] = useState('日记')

  const { data: records, loading, refresh } = useAsyncData(
    () => lifeRecordsApi.getByDate(selectedDate),
    [selectedDate]
  )
  const recordsList = records || []

  async function addRecord() {
    const text = input.trim()
    if (!text) return
    await lifeRecordsApi.add({
      date: selectedDate,
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

  // 仅展示有记录的分组（过滤空分组）
  const groupedRecords = TYPES
    .map(t => ({
      ...t,
      records: recordsList.filter(r => r.type === t.key)
    }))
    .filter(g => g.records.length > 0)

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        title="生活"
        subtitle="记录健康生活每一天"
        accent="life"
        icon="leaf"
        actions={
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white/20 rounded-xl text-xs text-white backdrop-blur-sm focus:outline-none focus:bg-white/30 transition [color-scheme:light] border border-white/20"
          />
        }
      />

      {/* 添加记录卡片 */}
      <div className="px-4 mt-4">
        <Card className="p-4">
          <ChipGroup
            items={TYPES.map(t => ({ value: t.key, label: t.key }))}
            value={type}
            onChange={setType}
            color="teal"
            className="mb-3"
          />
          <div className="flex gap-2 items-start">
            {type === '日记' ? (
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="写下今天的想法、感受..."
                  rows={3}
                />
              </div>
            ) : (
              <div className="flex-1">
                <Input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRecord()}
                  placeholder={`记录${type}内容...`}
                />
              </div>
            )}
            <Button
              onClick={addRecord}
              size="icon"
              icon="plus"
              aria-label="添加记录"
              className="self-start h-10 w-10 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 shadow-teal-500/20 flex-shrink-0"
            />
          </div>
        </Card>
      </div>

      {/* 分组记录 */}
      <div className="px-4 mt-4 space-y-4">
        {loading ? (
          <Card className="p-4">
            <LoadingState />
          </Card>
        ) : groupedRecords.length === 0 ? (
          <Card>
            <EmptyState
              icon="leaf"
              title="今日暂无记录"
              description="选择类别，记录你的第一个生活点滴"
            />
          </Card>
        ) : (
          groupedRecords.map(group => (
            <Card key={group.key} className="overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${group.color}`}>
                    <Icon name={group.icon} size={15} />
                  </span>
                  <span className="font-medium text-slate-700 text-sm">{group.key}</span>
                </div>
                <span className="text-xs text-slate-400">{group.records.length} 项</span>
              </div>
              <div className="p-3 space-y-2">
                {group.records.map(record => (
                  <div
                    key={record.id}
                    className={`p-2.5 bg-slate-50 rounded-xl ${
                      group.key === '日记'
                        ? 'flex flex-col gap-1.5'
                        : 'flex items-center justify-between'
                    }`}
                  >
                    {group.key === '日记' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${group.color}`}>
                            <Icon name={group.icon} size={16} />
                          </span>
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                            aria-label="删除"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap pl-10">
                          {record.content}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${group.color}`}>
                            <Icon name={group.icon} size={16} />
                          </span>
                          <span className="text-sm text-slate-700 break-words">
                            {record.content}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1 flex-shrink-0"
                          aria-label="删除"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
