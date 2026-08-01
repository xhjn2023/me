import { useState, useEffect } from 'react'
import { workSummariesApi, todayStr } from '../../db/database'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  Card, ChipGroup, Button, Input, Textarea, Select, Badge,
  EmptyState, LoadingState, SectionHeader, BottomSheet, Icon, showToast, ConfirmDialog
} from '../ui'

const TYPE_OPTIONS = [
  { value: 'daily', label: '日小结' },
  { value: 'weekly', label: '周小结' },
  { value: 'monthly', label: '月小结' }
]

function getPeriodRange(type) {
  const now = new Date()
  const today = todayStr()
  if (type === 'daily') {
    return { date: today, periodStart: today, periodEnd: today }
  }
  if (type === 'weekly') {
    const day = now.getDay() || 7
    const start = new Date(now)
    start.setDate(now.getDate() - day + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return {
      date: today,
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10)
    }
  }
  // monthly
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    date: today,
    periodStart: monthStart.toISOString().slice(0, 10),
    periodEnd: monthEnd.toISOString().slice(0, 10)
  }
}

function formatDateCN(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function WorkSummary() {
  const today = todayStr()
  const [type, setType] = useState('daily')
  const [showHistory, setShowHistory] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // 表单状态
  const [content, setContent] = useState('')
  const [completion, setCompletion] = useState('')
  const [problems, setProblems] = useState('')
  const [solutions, setSolutions] = useState('')
  const [plan, setPlan] = useState('')

  const period = getPeriodRange(type)

  const { data: summary, loading, refresh } = useAsyncData(
    () => workSummariesApi.getByDate(today, type),
    [today, type]
  )

  const { data: historyList, loading: historyLoading, refresh: refreshHistory } = useAsyncData(
    () => workSummariesApi.getAll({ type, limit: 30 }),
    [type]
  )

  // 有数据时自动填充表单
  useEffect(() => {
    if (summary && !editing) {
      setContent(summary.content || '')
      setCompletion(summary.completion || '')
      setProblems(summary.problems || '')
      setSolutions(summary.solutions || '')
      setPlan(summary.plan || '')
    } else if (!summary && !editing) {
      setContent('')
      setCompletion('')
      setProblems('')
      setSolutions('')
      setPlan('')
    }
  }, [summary, editing])

  function resetForm() {
    setContent('')
    setCompletion('')
    setProblems('')
    setSolutions('')
    setPlan('')
  }

  async function handleSave() {
    if (!content.trim()) {
      showToast('请输入工作内容', 'error')
      return
    }
    try {
      await workSummariesApi.upsert({
        type,
        date: today,
        period_start: period.periodStart,
        period_end: period.periodEnd,
        content: content.trim(),
        completion: completion.trim(),
        problems: problems.trim(),
        solutions: solutions.trim(),
        plan: plan.trim()
      })
      showToast('工作小结已保存', 'success')
      setEditing(false)
      refresh()
      refreshHistory()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await workSummariesApi.delete(id)
      showToast('已删除', 'success')
      setDeleteConfirm(null)
      refresh()
      refreshHistory()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  function handleExport() {
    const records = historyList || []
    if (records.length === 0) {
      showToast('暂无数据可导出', 'error')
      return
    }
    const lines = records.map(r => {
      const dateLabel = r.type === 'daily'
        ? formatDateCN(r.date)
        : `${formatDateCN(r.period_start)} ~ ${formatDateCN(r.period_end)}`
      return [
        `=== ${dateLabel} (${r.type === 'daily' ? '日' : r.type === 'weekly' ? '周' : '月'}小结) ===`,
        `工作内容: ${r.content || '无'}`,
        `完成情况: ${r.completion || '无'}`,
        `遇到的问题: ${r.problems || '无'}`,
        `解决方案: ${r.solutions || '无'}`,
        `后续计划: ${r.plan || '无'}`,
        '---'
      ].join('\n')
    })

    const text = `工作小结导出 (${today})\n${'='.repeat(30)}\n\n${lines.join('\n')}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `工作小结_${today}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('导出成功', 'success')
  }

  return (
    <div>
      {/* 类型切换 */}
      <ChipGroup
        items={TYPE_OPTIONS.map(t => ({ value: t.value, label: t.label }))}
        value={type}
        onChange={v => { setType(v); setEditing(false) }}
        color="indigo"
        className="mb-4"
      />

      {/* 当前期间 */}
      {type !== 'daily' && (
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
          <Icon name="calendar" size={12} />
          统计周期: {formatDateCN(period.periodStart)} ~ {formatDateCN(period.periodEnd)}
        </p>
      )}

      {/* 编辑区域 */}
      <Card className="p-4 mb-4">
        <div className="space-y-3">
          <Textarea
            label="工作内容"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="描述今天/本周/本月的工作内容"
            rows={3}
          />
          <Textarea
            label="完成情况"
            value={completion}
            onChange={e => setCompletion(e.target.value)}
            placeholder="完成情况、达成目标等"
            rows={2}
          />
          <Textarea
            label="遇到的问题"
            value={problems}
            onChange={e => setProblems(e.target.value)}
            placeholder="工作中遇到的问题或困难"
            rows={2}
          />
          <Textarea
            label="解决方案"
            value={solutions}
            onChange={e => setSolutions(e.target.value)}
            placeholder="针对问题的解决方案"
            rows={2}
          />
          <Textarea
            label="后续计划"
            value={plan}
            onChange={e => setPlan(e.target.value)}
            placeholder="下一步的工作计划"
            rows={2}
          />
          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="md"
              icon="check"
              className="flex-1"
              onClick={handleSave}
            >
              保存
            </Button>
            {summary && (
              <Button
                variant="danger"
                size="md"
                icon="trash"
                onClick={() => setDeleteConfirm(summary)}
              >
                删除
              </Button>
            )}
          </div>
          {summary && !editing && (
            <p className="text-xs text-slate-400 text-center">
              上次保存: {new Date(summary.updated_at || summary.created_at).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
      </Card>

      {/* 历史记录 */}
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title={`历史${type === 'daily' ? '日' : type === 'weekly' ? '周' : '月'}小结`} icon="history" />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon="download"
            onClick={handleExport}
          >
            导出
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={showHistory ? 'chevronUp' : 'chevronDown'}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '收起' : '展开'}
          </Button>
        </div>
      </div>

      {showHistory && (
        <>
          {historyLoading ? (
            <LoadingState text="加载历史记录..." />
          ) : !historyList || historyList.length === 0 ? (
            <EmptyState
              icon="history"
              title="暂无历史记录"
              description="保存小结后这里会显示"
            />
          ) : (
            <div className="space-y-3">
              {historyList.map(record => {
                const dateLabel = record.type === 'daily'
                  ? formatDateCN(record.date)
                  : `${formatDateCN(record.period_start)} ~ ${formatDateCN(record.period_end)}`
                return (
                  <Card key={record.id} className="p-3.5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge color={record.type === 'daily' ? 'blue' : record.type === 'weekly' ? 'violet' : 'orange'}>
                          {record.type === 'daily' ? '日' : record.type === 'weekly' ? '周' : '月'}
                        </Badge>
                        <span className="text-xs text-slate-500">{dateLabel}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(record.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    {record.content && (
                      <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{record.content}</p>
                    )}
                    {record.problems && (
                      <p className="text-xs text-rose-500 mt-1 line-clamp-1">
                        问题: {record.problems}
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm.id)
          setDeleteConfirm(null)
        }}
        title="删除工作小结"
        message="确定要删除这条工作小结吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        danger
      />
    </div>
  )
}