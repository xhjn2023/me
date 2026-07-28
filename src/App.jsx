import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Journal from './pages/Journal'

const TABS = [
  { key: 'dashboard', label: '首页', icon: HomeIcon },
  { key: 'tasks', label: '任务', icon: CheckIcon },
  { key: 'notes', label: '笔记', icon: NoteIcon },
  { key: 'journal', label: '日记', icon: BookIcon }
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="app-bg max-w-md mx-auto min-h-screen relative">
      {/* 页面内容 */}
      <main className="min-h-screen">
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'tasks' && <Tasks />}
        {tab === 'notes' && <Notes />}
        {tab === 'journal' && <Journal />}
      </main>

      {/* 底部导航栏 */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-sky-100"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex flex-col items-center py-2.5 btn-press"
            >
              <Icon active={tab === key} />
              <span
                className={`text-xs mt-0.5 ${
                  tab === key ? 'text-sky-500 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

/* 底部导航图标 */
function HomeIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#5B9BD5' : 'none'} stroke={active ? '#5B9BD5' : '#9CA3AF'} strokeWidth="2">
      <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#5B9BD5' : '#9CA3AF'} strokeWidth="2">
      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NoteIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#5B9BD5' : '#9CA3AF'} strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M8 13h8 M8 17h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BookIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={active ? '#5B9BD5' : '#9CA3AF'} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
