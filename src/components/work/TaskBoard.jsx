import { useState } from 'react'
import { tasksApi, todayStr } from '../../db/database'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  Card, ChipGroup, Button, Input, Textarea, Select, Badge,
  EmptyState, LoadingState, SectionHeader, BottomSheet, Icon, showToast, ConfirmDialog
} from '../ui'

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: '工作', label: '工作' },
  { key: '学习', label: '学习' },
  { key: '生活', label: '生活' },
  { key: '副业', label: '副业' }
]

const STATUS_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'done', label: '已完成' }
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: '所有优先级' },
  { value: 2, label: '高优先级' },
  { value: 1, label: '中优先级' },
  { value: 0, label: '低优先级' }
]

const SORT_OPTIONS = [
  { value: 'created_at', label: '创建时间' },
  { value: 'deadline', label: '截止日期' },
  { value: 'priority', label: '优先级' },
  { value: 'title', label: '标题' }
]

const STATUS_COLORS = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-600',
  done: 'bg-emerald-50 text-emerald-600'
}

const STATUS_LABELS = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成'
}

const PRIORITY_LABELS = {
  0: '低',
  1: '中',
  2: '高'
}

const PRIORITY_COLORS = {
  0: 'text-slate-400',
  1: 'text-amber-500',
  2: 'text-rose-500'
}

export default function TaskBoard() {
  const today = todayStr()
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [viewMode, setViewMode] = useState('daily') // daily | all

  // 表单状态
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState('工作')
  const [formPriority, setFormPriority] = useState(1)
  const [formDeadline, setFormDeadline] = useState('')
  const [formTime, setFormTime] = useState('')

  const { data: tasks, loading, refresh } = useAsyncData(
    () => tasksApi.getAll({
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter !== 'all' ? Number(priorityFilter) : undefined,
      sortBy,
      sortOrder
    }),
    [statusFilter, categoryFilter, priorityFilter, sortBy, sortOrder]
  )

  const { data: todayTasks, refresh: refreshToday } = useAsyncData(
    () => tasksApi.getByDate(today),
    [today]
  )

  function resetForm() {
    setFormTitle('')
    setFormDesc('')
    setFormCategory('工作')
    setFormPriority(1)
    setFormDeadline('')
    setFormTime('')
  }

  function openAdd() {
    resetForm()
    setEditingTask(null)
    setShowAdd(true)
  }

  function openEdit(task) {
    setEditingTask(task)
    setFormTitle(task.title)
    setFormDesc(task.description || '')
    setFormCategory(task.category || '工作')
    setFormPriority(task.priority ?? 1)
    setFormDeadline(task.deadline || '')
    setFormTime(task.time || '')
    setShowAdd(true)
  }

  async function handleSubmit() {
    if (!formTitle.trim()) {
      showToast('请输入任务标题', 'error')
      return
    }
    try {
      const data = {
        title: formTitle.trim(),
        description: formDesc.trim(),
        category: formCategory,
        priority: formPriority,
        deadline: formDeadline || '',
        time: formTime || '',
        date: formDeadline || today
      }
      if (editingTask) {
        await tasksApi.update(editingTask.id, data)
        showToast('任务已更新', 'success')
      } else {
        await tasksApi.add(data)
        showToast('任务已添加', 'success')
      }
      setShowAdd(false)
      refresh()
      refreshToday()
      window.dispatchEvent(new Event('app-data-changed'))
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  async function handleStatusChange(task, newStatus) {
    try {
      await tasksApi.updateStatus(task.id, newStatus)
      refresh()
      refreshToday()
      window.dispatchEvent(new Event('app-data-changed'))
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await tasksApi.delete(id)
      showToast('任务已删除', 'success')
      refresh()
      refreshToday()
      window.dispatchEvent(new Event('app-data-changed'))
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const taskList = tasks || []
  const todayList = todayTasks || []
  const doneCount = todayList.filter(t => t.done).length

  // 视图切换：今日只看 date=today 的任务，全部则显示全量（受筛选条件约束）
  const displayList = viewMode === 'daily'
    ? taskList.filter(t => t.date === today)
    : taskList

  // 任务统计（基于当前可见列表）
  const totalCount = displayList.length
  const todoCount = displayList.filter(t => t.status === 'todo' || (!t.status && !t.done)).length
  const inProgressCount = displayList.filter(t => t.status === 'in_progress').length
  const doneTotalCount = displayList.filter(t => t.status === 'done' || t.done).length

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">待办</p>
          <p className="text-lg font-bold text-slate-700 mt-0.5">{todoCount}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">进行中</p>
          <p className="text-lg font-bold text-blue-600 mt-0.5">{inProgressCount}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">已完成</p>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">{doneTotalCount}</p>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="flex items-center gap-2 mb-3">
        <ChipGroup
          items={[
            { value: 'daily', label: `今日 (${doneCount}/${todayList.length})` },
            { value: 'all', label: '全部' }
          ]}
          value={viewMode}
          onChange={setViewMode}
          color="indigo"
        />
        <div className="ml-auto flex gap-1">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700"
            title={sortOrder === 'asc' ? '升序' : '降序'}
          >
            <Icon name={sortOrder === 'asc' ? 'arrowUp' : 'arrowDown'} size={14} />
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <ChipGroup
            items={STATUS_OPTIONS.map(s => ({ value: s.key, label: s.label }))}
            value={statusFilter}
            onChange={setStatusFilter}
            color="indigo"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <ChipGroup
          items={CATEGORIES.map(c => ({ value: c.key, label: c.label }))}
          value={categoryFilter}
          onChange={setCategoryFilter}
          color="indigo"
        />
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 focus:outline-none focus:border-indigo-400"
        >
          {PRIORITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 添加按钮 */}
      <Button onClick={openAdd} icon="plus" size="md" className="w-full mb-4">
        添加任务
      </Button>

      {/* 任务列表 */}
      {loading ? (
        <LoadingState text="加载任务..." />
      ) : displayList.length === 0 ? (
        <EmptyState
          icon="clipboardList"
          title="暂无任务"
          description="点击上方按钮添加任务"
        />
      ) : (
        <div className="space-y-2">
          {displayList.map(task => {
            const status = task.status || (task.done ? 'done' : 'todo')
            const isOverdue = task.deadline && task.deadline < today && status !== 'done'
            return (
              <Card key={task.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  {/* 状态切换 */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const next = status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'done' : 'todo'
                        handleStatusChange(task, next)
                      }}
                      className="flex-shrink-0 mt-0.5"
                      title={`当前: ${STATUS_LABELS[status]}`}
                    >
                      {status === 'done' ? (
                        <Icon name="checkCircle" size={20} className="text-emerald-500" />
                      ) : status === 'in_progress' ? (
                        <Icon name="loader" size={20} className="text-blue-500" />
                      ) : (
                        <Icon name="circle" size={20} className="text-slate-300 hover:text-indigo-400" />
                      )}
                    </button>
                    {/* 快捷状态切换 */}
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                      {['todo', 'in_progress', 'done'].map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(task, s)}
                          className={`px-3 py-1 text-xs whitespace-nowrap hover:bg-slate-50 text-left ${
                            s === status ? 'font-semibold text-indigo-600' : 'text-slate-600'
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-medium ${status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </h3>
                      <Badge color={STATUS_COLORS[status].includes('emerald') ? 'emerald' : STATUS_COLORS[status].includes('blue') ? 'blue' : 'slate'}>
                        {STATUS_LABELS[status]}
                      </Badge>
                      {task.priority > 0 && (
                        <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || 'text-slate-400'}`}>
                          {PRIORITY_LABELS[task.priority]}优先级
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {task.category && (
                        <Badge color={
                          task.category === '工作' ? 'blue' : task.category === '学习' ? 'emerald' : task.category === '生活' ? 'teal' : 'orange'
                        }>
                          {task.category}
                        </Badge>
                      )}
                      {task.time && (
                        <span className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Icon name="clock" size={11} />
                          {task.time}
                        </span>
                      )}
                      {task.deadline && (
                        <span className={`text-xs flex items-center gap-0.5 ${
                          isOverdue ? 'text-rose-500 font-medium' : 'text-slate-400'
                        }`}>
                          <Icon name="calendar" size={11} />
                          {task.deadline}
                          {isOverdue && ' (已逾期)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(task)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition"
                      title="编辑"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(task)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                      title="删除"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      <BottomSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={editingTask ? '编辑任务' : '添加任务'}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowAdd(false)}>
              取消
            </Button>
            <Button size="md" className="flex-1" onClick={handleSubmit}>
              {editingTask ? '保存' : '添加'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <Input
            label="任务标题"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="输入任务标题"
            autoFocus
          />
          <Textarea
            label="任务描述"
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="描述任务详情（可选）"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="分类" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
              <option value="工作">工作</option>
              <option value="学习">学习</option>
              <option value="生活">生活</option>
              <option value="副业">副业</option>
            </Select>
            <Select label="优先级" value={formPriority} onChange={e => setFormPriority(Number(e.target.value))}>
              <option value={0}>低优先级</option>
              <option value={1}>中优先级</option>
              <option value={2}>高优先级</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="截止日期"
              type="date"
              value={formDeadline}
              onChange={e => setFormDeadline(e.target.value)}
            />
            <Input
              label="时间"
              type="time"
              value={formTime}
              onChange={e => setFormTime(e.target.value)}
            />
          </div>
        </div>
      </BottomSheet>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm.id)
          setDeleteConfirm(null)
        }}
        title="删除任务"
        message={`确定要删除"${deleteConfirm?.title}"吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        danger
      />
    </div>
  )
}