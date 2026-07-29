import { useState } from 'react'
import { tasksApi, todayStr, formatDateCN } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  PageHeader, Card, Button, Input, Select, ChipGroup,
  EmptyState, LoadingState, SectionHeader, Icon, Badge
} from '../components/ui'

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: '工作', label: '工作' },
  { key: '学习', label: '学习' },
  { key: '生活', label: '生活' },
  { key: '副业', label: '副业' }
]

const CATEGORY_BADGE_COLOR = {
  '工作': 'blue',
  '学习': 'emerald',
  '生活': 'teal',
  '副业': 'orange'
}

const TIMELINE_ICON = {
  '工作': 'briefcase',
  '学习': 'bookOpen',
  '生活': 'leaf',
  '副业': 'rocket'
}

export default function Work() {
  const today = todayStr()
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('all')
  const [newCategory, setNewCategory] = useState('工作')

  const { data: rawTasks, loading: tasksLoading, refresh: refreshTasks } = useAsyncData(
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
      <PageHeader
        title="工作"
        subtitle={`${formatDateCN(today)}${totalCount > 0 ? ` · 今日 ${doneCount}/${totalCount}` : ''}`}
        accent="work"
        icon="briefcase"
      />

      {/* 任务列表卡片 */}
      <div className="px-4 -mt-4 relative z-10">
        <Card className="p-4 shadow-md">
          <ChipGroup
            items={CATEGORIES.map(c => ({ value: c.key, label: c.label }))}
            value={category}
            onChange={setCategory}
            color="indigo"
            className="mb-3"
          />

          <div className="flex gap-2 mb-4">
            <div className="flex-1 min-w-0">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="添加任务..."
              />
            </div>
            <div className="w-24 flex-shrink-0">
              <Select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              >
                <option value="工作">工作</option>
                <option value="学习">学习</option>
                <option value="生活">生活</option>
                <option value="副业">副业</option>
              </Select>
            </div>
            <Button
              icon="plus"
              size="icon"
              onClick={addTask}
              className="w-10 h-10 flex-shrink-0"
              aria-label="添加任务"
            />
          </div>

          {tasksLoading ? (
            <LoadingState text="加载任务..." />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon="clipboardList"
              title="暂无任务"
              description="添加一个开始今天的工作吧"
            />
          ) : (
            <div className="space-y-1.5">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    task.done ? 'bg-slate-50' : 'bg-white border border-slate-100'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id, task.done)}
                    className="flex-shrink-0 mt-0.5"
                    aria-label={task.done ? '标记为未完成' : '标记为已完成'}
                  >
                    <Icon
                      name={task.done ? 'checkCircle' : 'circle'}
                      size={20}
                      className={task.done ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.category && (
                        <Badge color={CATEGORY_BADGE_COLOR[task.category] || 'slate'}>
                          {task.category}
                        </Badge>
                      )}
                      {task.time && (
                        <span className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Icon name="clock" size={11} />
                          {task.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-slate-300 hover:text-rose-400 btn-press"
                    aria-label="删除任务"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 今日时间轴 */}
      <div className="px-4 mt-5">
        <SectionHeader title="今日时间轴" icon="clock" />
        <Card className="p-4">
          {timelineTasks.length === 0 ? (
            <EmptyState
              icon="clock"
              title="暂无时间安排"
              description="为任务设置时间后这里会显示"
            />
          ) : (
            <div className="space-y-4">
              {timelineTasks.map((task, index) => {
                const iconName = TIMELINE_ICON[task.category] || 'circle'
                const iconBg = task.done
                  ? 'bg-emerald-50 text-emerald-500'
                  : 'bg-indigo-50 text-indigo-500'
                return (
                  <div key={task.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                        <Icon name={iconName} size={18} />
                      </div>
                      {index < timelineTasks.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 mt-1" style={{ minHeight: '20px' }} />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-xs text-slate-400 flex items-center gap-0.5">
                        <Icon name="clock" size={11} />
                        {task.time}
                      </p>
                      <h3 className={`font-medium mt-0.5 ${task.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {task.done ? '已完成' : task.category}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
