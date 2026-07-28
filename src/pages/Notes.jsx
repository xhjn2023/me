import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'

export default function Notes() {
  const [editing, setEditing] = useState(null) // null | 'new' | noteId
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const notes = useLiveQuery(() =>
    db.notes.orderBy('updatedAt').reverse().toArray()
  ) || []

  async function saveNote() {
    const t = title.trim()
    const c = content.trim()
    if (!t && !c) {
      setEditing(null)
      return
    }
    if (editing === 'new') {
      await db.notes.add({
        title: t,
        content: c,
        pinned: false,
        updatedAt: Date.now()
      })
    } else {
      await db.notes.update(editing, {
        title: t,
        content: c,
        updatedAt: Date.now()
      })
    }
    setEditing(null)
    setTitle('')
    setContent('')
  }

  function openNew() {
    setTitle('')
    setContent('')
    setEditing('new')
  }

  function openEdit(note) {
    setTitle(note.title || '')
    setContent(note.content || '')
    setEditing(note.id)
  }

  async function deleteNote(id) {
    await db.notes.delete(id)
  }

  async function togglePin(id, pinned) {
    await db.notes.update(id, { pinned: !pinned })
  }

  // 编辑模式
  if (editing !== null) {
    return (
      <div className="animate-fade-in px-4 pt-3 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-sky-800">{editing === 'new' ? '新建笔记' : '编辑笔记'}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(null); setTitle(''); setContent('') }}
              className="px-4 py-2 text-sm text-gray-500"
            >
              取消
            </button>
            <button
              onClick={saveNote}
              className="px-4 py-2 bg-sky-400 text-white rounded-lg btn-press text-sm font-medium"
            >
              保存
            </button>
          </div>
        </div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="标题"
          className="w-full px-4 py-3 bg-white rounded-xl border border-sky-100 text-base font-medium focus:outline-none focus:border-sky-400 card-shadow mb-3"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="写点什么..."
          rows={12}
          className="w-full px-4 py-3 bg-white rounded-xl border border-sky-100 text-sm focus:outline-none focus:border-sky-400 card-shadow resize-none"
        />
      </div>
    )
  }

  // 列表模式
  return (
    <div className="animate-fade-in px-4 pt-3 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-sky-800">笔记</h1>
        <button
          onClick={openNew}
          className="w-10 h-10 bg-sky-400 text-white rounded-full btn-press card-shadow flex items-center justify-center text-xl"
        >
          +
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📝</p>
          <p className="text-sm text-gray-400">还没有笔记</p>
          <button onClick={openNew} className="mt-3 text-sm text-sky-500">写第一篇笔记</button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-white rounded-xl p-4 card-shadow btn-press cursor-pointer"
              onClick={() => openEdit(note)}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sky-800 flex-1">
                  {note.pinned && <span className="text-orange-400 mr-1">📌</span>}
                  {note.title || '无标题'}
                </h3>
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => togglePin(note.id, note.pinned)}
                    className="text-gray-300 hover:text-orange-400 text-sm px-1"
                  >
                    📌
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-gray-300 hover:text-red-400 text-sm px-1"
                  >
                    🗑
                  </button>
                </div>
              </div>
              {note.content && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{note.content}</p>
              )}
              <p className="text-xs text-gray-300 mt-2">
                {new Date(note.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
