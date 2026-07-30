import { useState, useRef, useEffect } from 'react'
import { BottomSheet, Button, Icon, showToast } from '../../components/ui'
import { toPng } from 'html-to-image'
import { MOOD_MAP, tagColor } from './constants'
import { formatDateCN } from '../../db/database'

/**
 * 海报生成弹窗
 * 把笔记渲染成可下载的图文海报
 */
export default function NotePoster({ open, note, onClose }) {
  const posterRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!open) {
      setDataUrl('')
      setGenerating(false)
    }
  }, [open])

  async function generate() {
    if (!posterRef.current) return
    setGenerating(true)
    try {
      const url = await toPng(posterRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true
      })
      setDataUrl(url)
      showToast('海报已生成', 'success')
    } catch (e) {
      console.error(e)
      showToast('生成失败', 'error')
    } finally {
      setGenerating(false)
    }
  }

  function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `笔记-${note?.date || todayStr()}.png`
    a.click()
    showToast('已保存', 'success')
  }

  if (!note) return null

  const mood = note.mood ? MOOD_MAP[note.mood] : null
  const tags = Array.isArray(note.tags) ? note.tags : []
  const dateLabel = note.date ? formatDateCN(note.date) : ''

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="分享海报"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>关闭</Button>
          {dataUrl ? (
            <Button variant="primary" size="sm" icon="download" onClick={download}>保存图片</Button>
          ) : (
            <Button variant="primary" size="sm" icon="sparkles" loading={generating} onClick={generate}>生成海报</Button>
          )}
        </div>
      }
    >
      {/* 海报预览容器 */}
      <div className="flex justify-center py-2">
        <div
          ref={posterRef}
          className="w-full max-w-sm p-6 rounded-3xl bg-gradient-to-br from-teal-50 via-white to-emerald-50 border border-teal-100"
          style={{ minHeight: '320px' }}
        >
          {/* 顶部标识 */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-teal-100">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center">
                <Icon name="notebookPen" size={14} />
              </span>
              <span className="text-sm font-semibold text-teal-700">日记·笔记</span>
            </div>
            {dateLabel && (
              <span className="text-xs text-teal-600">{dateLabel}</span>
            )}
          </div>

          {/* 心情 + 标签 */}
          {(mood || tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {mood && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-white text-slate-600 border border-slate-200">
                  {mood.emoji} {mood.label}
                </span>
              )}
              {tags.map(t => (
                <span
                  key={t}
                  className={`px-2 py-0.5 rounded-md text-xs border ${tagColor(t)}`}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* 正文 */}
          <p className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap break-words mb-4">
            {note.content}
          </p>

          {/* 底部签名 */}
          <div className="flex items-center justify-between pt-3 border-t border-teal-100">
            <span className="text-xs text-teal-500">记录生活的小事</span>
            {note.created_at && (
              <span className="text-[10px] text-slate-400">
                {new Date(note.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {dataUrl && (
        <div className="mt-3 text-center">
          <p className="text-xs text-slate-400 mb-2">海报已生成，点击「保存图片」下载</p>
          <img src={dataUrl} alt="海报预览" className="w-full rounded-xl border border-slate-200" />
        </div>
      )}
    </BottomSheet>
  )
}

function todayStr() {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}
