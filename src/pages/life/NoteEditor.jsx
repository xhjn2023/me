import { useState, useEffect } from 'react'
import { BottomSheet, Button, Textarea, Input, Icon, showToast, ConfirmDialog } from '../../components/ui'
import { MOODS, PRESET_TAGS, tagColor } from './constants'
import { lifeRecordsApi } from '../../db/database'

/**
 * 完整笔记编辑页（BottomSheet 全屏化）
 * - 新建：note = null，用 date 作为默认日期
 * - 编辑：note = object
 * 支持心情、标签、创建时间修改、删除
 */
export default function NoteEditor({ open, note, date, onClose, onSaved, onDeleted }) {
  const isEdit = !!note
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [saving, setSaving] = useState(false)

  // 打开时初始化字段
  useEffect(() => {
    if (!open) return
    if (note) {
      setContent(note.content || '')
      setMood(note.mood || '')
      setTags(Array.isArray(note.tags) ? note.tags : [])
      setCreatedAt(toLocalInput(note.created_at) || toLocalInput(Date.now()))
    } else {
      setContent('')
      setMood('')
      setTags([])
      setCreatedAt(toLocalInput(Date.now()))
    }
    setNewTag('')
  }, [open, note])

  function toLocalInput(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d - tz).toISOString().slice(0, 16)
  }
  function fromLocalInput(value) {
    if (!value) return Date.now()
    return new Date(value).getTime()
  }

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function addCustomTag() {
    const t = newTag.trim()
    if (!t) return
    if (tags.includes(t)) {
      setNewTag('')
      return
    }
    setTags(prev => [...prev, t])
    setNewTag('')
  }

  async function save() {
    const text = content.trim()
    if (!text) {
      showToast('请输入笔记内容', 'info')
      return
    }
    setSaving(true)
    try {
      const payload = {
        content: text,
        mood: mood || null,
        tags,
        createdAt: fromLocalInput(createdAt),
        type: '日记'
      }
      if (isEdit) {
        await lifeRecordsApi.update(note.id, payload)
        showToast('已更新', 'success')
      } else {
        await lifeRecordsApi.add({ ...payload, date })
        showToast('已记录', 'success')
      }
      window.dispatchEvent(new Event('app-data-changed'))
      onSaved?.()
    } catch (e) {
      console.error(e)
      showToast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    setConfirmDel(false)
    try {
      await lifeRecordsApi.delete(note.id)
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已删除', 'success')
      onDeleted?.()
    } catch {
      showToast('删除失败', 'error')
    }
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={isEdit ? '编辑笔记' : '新建笔记'}
        footer={
          <div className="flex items-center justify-between gap-2">
            {isEdit ? (
              <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirmDel(true)}>删除</Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>取消</Button>
              <Button variant="primary" size="sm" icon="check" loading={saving} onClick={save}>保存</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 正文 */}
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="记录此刻的想法、心情、琐事..."
            rows={6}
            autoFocus
          />

          {/* 心情 */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">心情</p>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMood(mood === m.key ? '' : m.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                    mood === m.key ? m.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  <span className="mr-1">{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 标签 */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">标签</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                    tags.includes(t) ? tagColor(t) : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
              {tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`px-2.5 py-1 rounded-md text-xs border ${tagColor(t)}`}
                >
                  #{t} <Icon name="x" size={10} className="inline" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                placeholder="自定义标签..."
                className="flex-1"
              />
              <Button variant="secondary" size="sm" icon="plus" onClick={addCustomTag}>添加</Button>
            </div>
          </div>

          {/* 创建时间 */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">创建时间</p>
            <Input
              type="datetime-local"
              value={createdAt}
              max={toLocalInput(Date.now())}
              onChange={e => setCreatedAt(e.target.value)}
            />
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={doDelete}
        title="删除这条笔记？"
        message="删除后无法恢复"
        confirmText="删除"
      />
    </>
  )
}
