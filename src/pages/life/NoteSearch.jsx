import { useState, useEffect } from 'react'
import { BottomSheet, Input, Icon, LoadingState, EmptyState, showToast } from '../../components/ui'
import { lifeRecordsApi, formatDateShort } from '../../db/database'
import { MOODS, MOOD_MAP, tagColor } from './constants'

/**
 * 全局搜索面板
 * 支持关键字 / 标签 / 心情 / 仅收藏
 */
export default function NoteSearch({ open, onClose, onOpenNote }) {
  const [keyword, setKeyword] = useState('')
  const [tag, setTag] = useState('')
  const [mood, setMood] = useState('')
  const [favoritedOnly, setFavoritedOnly] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [usedTags, setUsedTags] = useState([])

  // 打开时拉取已用标签（用 search 接口取一批数据后去重）
  useEffect(() => {
    if (!open) return
    lifeRecordsApi.search({ favoritedOnly: false })
      .then(rows => {
        const s = new Set()
        ;(rows || []).forEach(r => (r.tags || []).forEach(t => s.add(t)))
        setUsedTags([...s])
      })
      .catch(() => {})
  }, [open])

  // 防抖搜索
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const t = setTimeout(() => {
      lifeRecordsApi.search({ keyword, tag, mood, favoritedOnly })
        .then(rows => setResults(rows || []))
        .catch(() => {
          setResults([])
          showToast('搜索失败', 'error')
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [open, keyword, tag, mood, favoritedOnly])

  function reset() {
    setKeyword('')
    setTag('')
    setMood('')
    setFavoritedOnly(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="搜索笔记">
      <div className="space-y-3">
        {/* 关键字 */}
        <Input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="搜索笔记正文..."
          icon="search"
        />

        {/* 标签筛选 */}
        {usedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTag('')}
              className={`px-2.5 py-1 rounded-md text-xs border transition ${
                !tag ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              全部
            </button>
            {usedTags.map(t => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? '' : t)}
                className={`px-2.5 py-1 rounded-md text-xs border transition ${
                  tag === t ? tagColor(t) : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* 心情筛选 */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setMood('')}
            className={`px-2.5 py-1 rounded-md text-xs border transition ${
              !mood ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            全部心情
          </button>
          {MOODS.map(m => (
            <button
              key={m.key}
              onClick={() => setMood(mood === m.key ? '' : m.key)}
              className={`px-2.5 py-1 rounded-md text-xs border transition ${
                mood === m.key ? m.color : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* 仅收藏 */}
        <button
          onClick={() => setFavoritedOnly(v => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition ${
            favoritedOnly ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          <Icon name="star" size={12} /> 仅看收藏
        </button>

        {/* 结果 */}
        <div className="pt-2 border-t border-slate-100">
          {loading ? (
            <LoadingState />
          ) : results.length === 0 ? (
            <EmptyState icon="search" title="没有匹配的笔记" description="换个关键词试试" />
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              <p className="text-xs text-slate-400 sticky top-0 bg-white py-1">
                找到 {results.length} 条结果
              </p>
              {results.map(r => {
                const moodInfo = r.mood ? MOOD_MAP[r.mood] : null
                return (
                  <button
                    key={r.id}
                    onClick={() => onOpenNote?.(r)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-slate-400">{formatDateShort(r.date)}</span>
                      {moodInfo && <span className="text-[10px]">{moodInfo.emoji}</span>}
                      {r.favorited && <Icon name="star" size={10} className="text-amber-400" />}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{r.content}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {(keyword || tag || mood || favoritedOnly) && (
          <button
            onClick={reset}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition"
          >
            清空筛选条件
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
