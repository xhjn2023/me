import { useState } from 'react'
import { lifeRecordsApi, todayStr } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  PageHeader, Card, Button, Textarea, BottomSheet,
  EmptyState, LoadingState, Icon, ConfirmDialog, showToast
} from '../components/ui'

// 生活模块已精简为「日记·笔记」：仅承载文字笔记的增删改查
// 历史健康追踪分类（运动/饮食/睡眠/健康/娱乐）已移除，数据库 type 字段保留 '日记' 兼容存量数据
export default function Life() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(null)   // { id, content }
  const [editText, setEditText] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const { data: records, loading, refresh } = useAsyncData(
    () => lifeRecordsApi.getByDate(selectedDate),
    [selectedDate]
  )
  const recordsList = records || []

  async function addRecord() {
    const text = input.trim()
    if (!text) {
      showToast('请输入笔记内容', 'info')
      return
    }
    try {
      await lifeRecordsApi.add({
        date: selectedDate,
        type: '日记',
        content: text,
        createdAt: Date.now()
      })
      setInput('')
      refresh()
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已记录', 'success')
    } catch {
      showToast('保存失败', 'error')
    }
  }

  function openEdit(record) {
    setEditing({ id: record.id, content: record.content })
    setEditText(record.content)
  }

  function closeEdit() {
    setEditing(null)
    setEditText('')
  }

  async function saveEdit() {
    const text = editText.trim()
    if (!text) {
      showToast('内容不能为空', 'info')
      return
    }
    if (text === editing.content) {
      closeEdit()
      return
    }
    try {
      await lifeRecordsApi.update(editing.id, { content: text })
      refresh()
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已更新', 'success')
      closeEdit()
    } catch {
      showToast('更新失败', 'error')
    }
  }

  async function deleteRecord(id) {
    try {
      await lifeRecordsApi.delete(id)
      refresh()
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已删除', 'success')
    } catch {
      showToast('删除失败', 'error')
    }
    setConfirmId(null)
  }

  function formatTime(ts) {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        title="日记·笔记"
        subtitle="记录日常思绪与随笔"
        accent="life"
        icon="notebookPen"
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

      {/* 快速录入区域：多行文本框 + 右侧加号按钮直接保存 */}
      <div className="px-4 mt-4">
        <Card className="p-3">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addRecord()
                }}
                placeholder="记录此刻的想法..."
                rows={2}
                className="border-transparent bg-slate-50 focus:bg-white"
              />
            </div>
            <Button
              onClick={addRecord}
              size="icon"
              icon="plus"
              aria-label="添加笔记"
              className="self-start h-10 w-10 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 shadow-teal-500/20 flex-shrink-0"
            />
          </div>
        </Card>
      </div>

      {/* 笔记列表：按 created_at 倒序（API 已排序） */}
      <div className="px-4 mt-4 space-y-2.5">
        {loading ? (
          <Card className="p-4"><LoadingState /></Card>
        ) : recordsList.length === 0 ? (
          <Card>
            <EmptyState
              icon="notebookPen"
              title="今日暂无笔记"
              description="在上方输入框写下第一段思绪"
            />
          </Card>
        ) : (
          recordsList.map(record => (
            <Card key={record.id} className="p-3.5 hover:border-slate-300 transition">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-teal-600 flex-shrink-0 mt-0.5">
                  <Icon name="penLine" size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                    {record.content}
                  </p>
                  {record.created_at && (
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {formatTime(record.created_at)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(record)}
                    className="text-slate-300 hover:text-teal-500 transition-colors p-1.5 rounded-md hover:bg-teal-50"
                    aria-label="编辑"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmId(record.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-rose-50"
                    aria-label="删除"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 编辑弹层：BottomSheet 作为「完整新建/编辑笔记页面」 */}
      <BottomSheet
        open={!!editing}
        onClose={closeEdit}
        title="编辑笔记"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={closeEdit}>取消</Button>
            <Button variant="primary" size="sm" icon="check" onClick={saveEdit}>保存</Button>
          </div>
        }
      >
        <Textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          placeholder="编辑笔记内容..."
          rows={8}
          autoFocus
          className="border-slate-200 bg-slate-50"
        />
      </BottomSheet>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => deleteRecord(confirmId)}
        title="删除这条笔记？"
        message="删除后无法恢复"
        confirmText="删除"
      />
    </div>
  )
}
