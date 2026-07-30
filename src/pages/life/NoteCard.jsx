import { useState, useRef } from 'react'
import { Card, BottomSheet, Icon, ConfirmDialog, showToast } from '../../components/ui'
import { MOOD_MAP, tagColor } from './constants'

const LONG_PRESS_MS = 500

/**
 * 单条笔记卡片
 * - 点击卡片：进入详情编辑
 * - 长按卡片：唤起快捷操作弹窗
 * - 右侧：收藏按钮 + 更多按钮
 */
export default function NoteCard({
  note,
  onOpen,
  onToggleFavorite,
  onAction  // (action, note) => void  action: edit|pin|favorite|poster|archive|delete
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const pressTimer = useRef(null)
  const longPressed = useRef(false)

  function startPress() {
    longPressed.current = false
    pressTimer.current = setTimeout(() => {
      longPressed.current = true
      navigator.vibrate?.(50)
      setMenuOpen(true)
    }, LONG_PRESS_MS)
  }
  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }
  function handleClick() {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    onOpen?.(note)
  }

  function handleFavorite(e) {
    e.stopPropagation()
    onToggleFavorite?.(note)
  }
  function handleMore(e) {
    e.stopPropagation()
    setMenuOpen(true)
  }

  function runAction(action) {
    setMenuOpen(false)
    if (action === 'delete') {
      setConfirmDel(true)
      return
    }
    onAction?.(action, note)
  }

  const mood = note.mood ? MOOD_MAP[note.mood] : null
  const tags = Array.isArray(note.tags) ? note.tags : []
  const wordCount = (note.content || '').replace(/\s/g, '').length
  const timeStr = note.created_at
    ? new Date(note.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : ''

  const menuItems = [
    { action: 'edit',     icon: 'edit',      label: '编辑笔记' },
    { action: 'pin',      icon: 'bookmark',  label: note.pinned ? '取消置顶' : '置顶笔记' },
    { action: 'favorite', icon: 'star',      label: note.favorited ? '取消收藏' : '收藏笔记' },
    { action: 'poster',   icon: 'download',  label: '分享生成图片' },
    { action: 'archive',  icon: 'archive',   label: note.archived ? '取消归档' : '归档笔记' },
    { action: 'delete',   icon: 'trash',     label: '删除笔记', danger: true }
  ]

  return (
    <>
      <Card
        className={`p-3.5 transition cursor-pointer select-none hover:shadow-md active:scale-[0.99] ${
          note.pinned ? 'border-teal-300 bg-teal-50/30' : ''
        }`}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onClick={handleClick}
      >
        {/* 顶部标签行 */}
        {(note.pinned || mood || tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {note.pinned && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-teal-100 text-teal-700">
                <Icon name="bookmark" size={10} /> 置顶
              </span>
            )}
            {mood && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                <span>{mood.emoji}</span>{mood.label}
              </span>
            )}
            {tags.map(t => (
              <span
                key={t}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${tagColor(t)}`}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 正文 + 右侧操作 */}
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm text-slate-700 leading-relaxed line-clamp-2 whitespace-pre-wrap break-words">
            {note.content}
          </p>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleFavorite}
              className={`p-1.5 rounded-md transition-colors ${
                note.favorited
                  ? 'text-amber-500 hover:bg-amber-50'
                  : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
              }`}
              aria-label="收藏"
            >
              <Icon name="star" size={16} />
            </button>
            <button
              onClick={handleMore}
              className="p-1.5 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="更多"
            >
              <Icon name="moreVertical" size={16} />
            </button>
          </div>
        </div>

        {/* 底部信息行 */}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
          {timeStr && <span>{timeStr}</span>}
          {timeStr && wordCount > 0 && <span>·</span>}
          {wordCount > 0 && <span>{wordCount} 字</span>}
        </div>
      </Card>

      {/* 更多菜单 / 长按快捷操作 */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="笔记操作">
        <div className="space-y-1">
          {menuItems.map(item => (
            <button
              key={item.action}
              onClick={() => runAction(item.action)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={() => { setConfirmDel(false); onAction?.('delete', note) }}
        title="删除这条笔记？"
        message="删除后无法恢复"
        confirmText="删除"
      />
    </>
  )
}
