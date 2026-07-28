import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Work from './pages/Work'
import Study from './pages/Study'
import Life from './pages/Life'
import SideWork from './pages/SideWork'
import Review from './pages/Review'
import Medicine from './pages/Medicine'
import { initializeData } from './db/seed'

const TABS = [
  { key: 'dashboard', label: '首页', icon: HomeIcon },
  { key: 'work', label: '工作', icon: WorkIcon },
  { key: 'study', label: '学习', icon: StudyIcon },
  { key: 'life', label: '生活', icon: LifeIcon },
  { key: 'medicine', label: '用药', icon: PillIcon },
  { key: 'side', label: '副业', icon: RocketIcon },
  { key: 'review', label: '复盘', icon: NoteIcon }
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    initializeData().catch(console.error)
  }, [])

  return (
    <div className="app-bg max-w-md mx-auto min-h-screen relative">
      <main className="min-h-screen">
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'work' && <Work />}
        {tab === 'study' && <Study />}
        {tab === 'life' && <Life />}
        {tab === 'medicine' && <Medicine />}
        {tab === 'side' && <SideWork />}
        {tab === 'review' && <Review />}
      </main>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-gray-100"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="flex">
          {TABS.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex flex-col items-center py-2 btn-press relative"
            >
              <div className="relative">
                <Icon active={tab === key} />
                {badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span
                className={`text-xs mt-0.5 ${
                  tab === key ? 'text-indigo-500 font-medium' : 'text-gray-400'
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

function HomeIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={active ? '#6366f1' : '#9CA3AF'} strokeWidth="2">
      <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WorkIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={active ? '#6366f1' : '#9CA3AF'} strokeWidth="2">
      <path d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StudyIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={active ? '#6366f1' : '#9CA3AF'} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7h8M8 11h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LifeIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={active ? '#6366f1' : '#9CA3AF'} strokeWidth="2">
      <path d="M12 22s-8-4.5-8-11.5A5.5 5.5 0 0112 5a5.5 5.5 0 018 5.5C20 17.5 12 22 12 22z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PillIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={active ? '#6366f1' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5a7 7 0 01-9.9-9.9l9.9-9.9a7 7 0 019.9 9.9z" />
      <path d="M8.5 8.5l7 7" />
    </svg>
  )
}

function RocketIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={active ? '#6366f1' : '#9CA3AF'} strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NoteIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={active ? '#6366f1' : '#9CA3AF'} strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
