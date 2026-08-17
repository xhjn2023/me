import { useState } from 'react'
import { lifeRecordsApi, todayStr, formatDateCN } from '../../db/database'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  Card, Button, Icon, EmptyState, LoadingState, ErrorState,
  BottomSheet, showToast
} from '../../components/ui'
import NoteCard from './NoteCard'
import NoteEditor from './NoteEditor'
import NoteCalendar from './NoteCalendar'
import NoteSearch from './NoteSearch'
import NotePoster from './NotePoster'

// 生活模块「随笔」：轻量化随笔记事本
// - 快速录入 + 完整编辑页（心情/标签/创建时间）
// - 列表卡片支持置顶/收藏/归档/海报/长按操作
export default function NotesTab() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [quickInput, setQuickInput] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorNote, setEditorNote] = useState(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [posterNote, setPosterNote] = useState(null)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [archivedList, setArchivedList] = useState([])
  const [archivedLoading, setArchivedLoading] = useState(false)

  // 在线优先：失败时返回空数组，UI 降级展示空状态而非崩溃
  const { data: records, loading, error, refresh } = useAsyncData(
    () => lifeRecordsApi.getByDate(selectedDate).catch(() => []),
    [selectedDate]
  )
  const recordsList = records || []

  // 日期前后切换（不允许超过今天）
  function shiftDate(days) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    const tz = d.getTimezoneOffset() * 60000
    const next = new Date(d - tz).toISOString().slice(0, 10)
    if (next > todayStr()) return
    setSelectedDate(next)
  }

  // 快速保存：有文字 → 短句笔记；空白 → 打开完整编辑页
  async function quickSave() {
    const text = quickInput.trim()
    if (!text) {
      setEditorNote(null)
      setEditorOpen(true)
      return
    }
    try {
      await lifeRecordsApi.add({
        date: selectedDate,
        type: '日记',
        content: text,
        createdAt: Date.now()
      })
      setQuickInput('')
      refresh()
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已记录', 'success')
    } catch {
      showToast('保存失败，请检查网络', 'error')
    }
  }

  function openEditor(note) {
    setEditorNote(note)
    setEditorOpen(true)
  }

  // 卡片更多操作
  async function handleAction(action, note) {
    try {
      if (action === 'edit') {
        openEditor(note)
      } else if (action === 'pin') {
        await lifeRecordsApi.togglePin(note.id, !note.pinned)
        refresh()
        showToast(note.pinned ? '已取消置顶' : '已置顶', 'success')
      } else if (action === 'favorite') {
        await lifeRecordsApi.toggleFavorite(note.id, !note.favorited)
        refresh()
        showToast(note.favorited ? '已取消收藏' : '已收藏', 'success')
      } else if (action === 'poster') {
        setPosterNote(note)
      } else if (action === 'archive') {
        await lifeRecordsApi.toggleArchive(note.id, !note.archived)
        refresh()
        showToast(note.archived ? '已取消归档' : '已归档', 'success')
      } else if (action === 'delete') {
        await lifeRecordsApi.delete(note.id)
        refresh()
        showToast('已删除', 'success')
      }
      window.dispatchEvent(new Event('app-data-changed'))
    } catch {
      showToast('操作失败', 'error')
    }
  }

  async function openArchived() {
    setArchivedOpen(true)
    setArchivedLoading(true)
    try {
      const list = await lifeRecordsApi.getByDate(selectedDate, { includeArchived: true })
      setArchivedList((list || []).filter(r => r.archived))
    } catch {
      setArchivedList([])
    } finally {
      setArchivedLoading(false)
    }
  }

  function openNoteFromSearch(note) {
    setSearchOpen(false)
    setSelectedDate(note.date)
    setTimeout(() => openEditor(note), 150)
  }

  const isToday = selectedDate === todayStr()

  return (
    <div className="animate-fade-in pb-24">
      {/* 标题栏：浅薄荷绿渐变 */}
      <header className="mx-4 mt-2 px-4 pt-4 pb-3 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-emerald-50 border border-teal-100/60 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-teal-600 flex-shrink-0">
              <Icon name="notebookPen" size={18} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">随笔</h1>
              <p className="text-xs text-slate-500 mt-0.5">记录日常思绪与灵感</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-teal-600 hover:bg-white/70 transition"
              aria-label="搜索"
            >
              <Icon name="search" size={16} />
            </button>
            <button
              onClick={openArchived}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-teal-600 hover:bg-white/70 transition"
              aria-label="归档"
            >
              <Icon name="package" size={16} />
            </button>
          </div>
        </div>

        {/* 日期切换：左右箭头 + 中间点击打开日历 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-teal-100/60">
          <button
            onClick={() => shiftDate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition"
            aria-label="前一天"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          <button
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/70 transition"
          >
            <Icon name="calendar" size={14} className="text-teal-600" />
            <span className="text-sm font-medium text-slate-700">{formatDateCN(selectedDate)}</span>
          </button>
          <button
            onClick={() => shiftDate(1)}
            disabled={isToday}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="后一天"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </header>

      {/* 快速录入区域 */}
      <div className="px-4 mt-4">
        <Card className="p-2.5 flex gap-2 items-center">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-teal-500 flex-shrink-0">
            <Icon name="penLine" size={15} />
          </span>
          <input
            type="text"
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') quickSave() }}
            placeholder="随手记下当下心情、琐事、灵感…"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={quickSave}
            className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white flex items-center justify-center transition shadow-sm shadow-teal-500/20 flex-shrink-0"
            aria-label="添加笔记"
          >
            <Icon name="plus" size={18} />
          </button>
        </Card>
        <p className="text-[11px] text-slate-400 mt-1.5 px-1">
          {quickInput.trim() ? '回车或点 + 快速保存' : '空白时点 + 进入完整编辑'}
        </p>
      </div>

      {/* 笔记列表 */}
      <div className="px-4 mt-3 space-y-2.5">
        {error ? (
          <Card className="p-4">
            <ErrorState message="加载失败，请检查网络" onRetry={refresh} />
          </Card>
        ) : loading ? (
          <Card className="p-4"><LoadingState /></Card>
        ) : recordsList.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center text-teal-400 mb-4 border border-teal-100">
              <Icon name="notebookPen" size={36} />
            </div>
            <p className="text-base font-medium text-slate-600">今日暂无记录</p>
            <p className="text-sm text-slate-400 mt-1">试着写下第一件生活小事吧 ✍</p>
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={() => { setEditorNote(null); setEditorOpen(true) }}
              className="mt-4 bg-teal-500 hover:bg-teal-600 shadow-teal-500/20"
            >
              新建笔记
            </Button>
          </div>
        ) : (
          recordsList.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={openEditor}
              onToggleFavorite={n => handleAction('favorite', n)}
              onAction={handleAction}
              historyTexts={recordsList.filter(n => n.id !== note.id).map(n => n.content).filter(Boolean)}
            />
          ))
        )}
      </div>

      {/* 完整编辑页 */}
      <NoteEditor
        open={editorOpen}
        note={editorNote}
        date={selectedDate}
        onClose={() => setEditorOpen(false)}
        onSaved={() => { refresh(); setEditorOpen(false) }}
        onDeleted={() => { refresh(); setEditorOpen(false) }}
      />

      {/* 日历弹窗 */}
      <NoteCalendar
        open={calendarOpen}
        date={selectedDate}
        onClose={() => setCalendarOpen(false)}
        onSelect={d => { setSelectedDate(d); setCalendarOpen(false) }}
      />

      {/* 全局搜索 */}
      <NoteSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenNote={openNoteFromSearch}
      />

      {/* 海报生成 */}
      <NotePoster
        open={!!posterNote}
        note={posterNote}
        onClose={() => setPosterNote(null)}
      />

      {/* 归档列表 */}
      <BottomSheet
        open={archivedOpen}
        onClose={() => setArchivedOpen(false)}
        title={`归档笔记 · ${formatDateCN(selectedDate)}`}
      >
        {archivedLoading ? (
          <LoadingState />
        ) : archivedList.length === 0 ? (
          <EmptyState icon="package" title="当日无归档笔记" description="归档后的笔记会显示在这里" />
        ) : (
          <div className="space-y-2">
            {archivedList.map(note => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                onClick={() => { setArchivedOpen(false); openEditor(note) }}
              >
                <p className="text-sm text-slate-700 line-clamp-2">{note.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400">
                    {note.created_at && new Date(note.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('archive', note); setArchivedOpen(false) }}
                    className="text-xs text-teal-600 hover:underline"
                  >
                    取消归档
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
