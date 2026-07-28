import { useState, useEffect } from 'react'
import { coursesApi, booksApi, studyRecordsApi, todayStr, getStreakDays } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'

const CATEGORIES = ['全部', '人事专业', '超市经营', '内心能量', '人生智慧']

export default function Study() {
  const [activeTab, setActiveTab] = useState('人事专业')
  const [weekStudyHours, setWeekStudyHours] = useState(0)
  const [streakDays, setStreakDays] = useState(0)

  const { data: courses } = useAsyncData(() => coursesApi.getAll(activeTab === '全部' ? undefined : activeTab), [activeTab])

  const { data: books } = useAsyncData(() => booksApi.getAll(activeTab === '全部' ? undefined : activeTab), [activeTab])

  useEffect(() => {
    const weekDates = getWeekDateRange()
    studyRecordsApi.getByDates(weekDates).then(records => {
      const total = records.reduce((sum, r) => sum + (r.duration || 0), 0)
      setWeekStudyHours(Math.round(total / 60 * 10) / 10)
    })
    // streak 需要获取所有学习记录
    studyRecordsApi.getByDates(weekDates).then(records => getStreakDays(records, 'date')).then(setStreakDays)
  }, [])

  const courseList = courses || []
  const bookList = books || []

  return (
    <div className="animate-fade-in pb-24">
      <div className="bg-gradient-to-br from-green-500 to-teal-500 p-5 text-white rounded-b-3xl">
        <h1 className="text-xl font-bold">学习成长</h1>
        <p className="text-sm text-white/80 mt-0.5">
          本周学习 {weekStudyHours}h · 连续 {streakDays} 天
        </p>
      </div>

      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeTab === cat
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white text-gray-600 card-shadow'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">本周学习</span>
            <span className="text-xl">📚</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-800">{weekStudyHours}</span>
            <span className="text-lg text-gray-400">h</span>
          </div>
          <p className="text-xs text-green-500 mt-1">▲ 2.5h</p>
        </div>
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">连续学习</span>
            <span className="text-xl">🔥</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-800">{streakDays}</span>
            <span className="text-lg text-gray-400">天</span>
          </div>
          <p className="text-xs text-orange-500 mt-1">继续坚持！</p>
        </div>
      </div>

      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-slate-800 mb-3">📚 在学课程</h2>
        <div className="space-y-3">
          {courseList.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl card-shadow">
              <p className="text-3xl mb-2">📖</p>
              <p>暂无课程</p>
            </div>
          ) : (
            courseList.map(course => (
              <div key={course.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
                <div className="bg-gradient-to-r from-purple-400 to-indigo-400 h-20 flex items-center px-4">
                  <span className="text-3xl">🎓</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    讲师：{course.instructor} · {course.currentLessons}/{course.totalLessons}课时
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{course.progress}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-slate-800 mb-3">📖 推荐阅读</h2>
        <div className="space-y-3">
          {bookList.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl card-shadow">
              <p className="text-3xl mb-2">📕</p>
              <p>暂无推荐书籍</p>
            </div>
          ) : (
            bookList.map(book => (
              <div key={book.id} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
                <div className="w-14 h-18 bg-gradient-to-br from-red-400 to-orange-400 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ height: '70px' }}>
                  📕
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{book.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {book.author} · {book.category}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function getWeekDateRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const start = new Date(now)
  start.setDate(now.getDate() - day + 1)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}
