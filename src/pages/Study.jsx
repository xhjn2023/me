import { useState, useEffect, useMemo } from 'react'
import { coursesApi, booksApi, studyRecordsApi, todayStr, getStreakDays } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'

const CATEGORIES = ['全部', '人事专业', '超市经营', '内心能量', '人生智慧']

// 每日精选格言列表
const QUOTES = [
  { text: '学如逆水行舟，不进则退。', author: '古训' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
  { text: '三人行，必有我师焉。择其善者而从之，其不善者而改之。', author: '孔子' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '知之者不如好之者，好之者不如乐之者。', author: '孔子' },
  { text: '发奋识遍天下字，立志读尽人间书。', author: '苏轼' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { text: '读万卷书，行万里路。', author: '刘彝' },
  { text: '黑发不知勤学早，白首方悔读书迟。', author: '颜真卿' },
  { text: '玉不琢，不成器；人不学，不知道。', author: '礼记' },
  { text: '温故而知新，可以为师矣。', author: '孔子' },
  { text: '敏而好学，不耻下问。', author: '孔子' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '天行健，君子以自强不息。', author: '周易' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '古训' },
  { text: '少壮不努力，老大徒伤悲。', author: '汉乐府' },
  { text: '莫等闲，白了少年头，空悲切。', author: '岳飞' },
  { text: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。', author: '陶渊明' },
  { text: '人生在勤，不索何获。', author: '张衡' },
  { text: '求知若饥，虚心若愚。', author: '乔布斯' },
  { text: '泰山不让土壤，故能成其大；河海不择细流，故能就其深。', author: '李斯' },
  { text: '锲而舍之，朽木不折；锲而不舍，金石可镂。', author: '荀子' },
  { text: '吾生也有涯，而知也无涯。', author: '庄子' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { text: '问渠那得清如许？为有源头活水来。', author: '朱熹' },
  { text: '博学之，审问之，慎思之，明辨之，笃行之。', author: '礼记' },
  { text: '骐骥一跃，不能十步；驽马十驾，功在不舍。', author: '荀子' },
  { text: '穷则独善其身，达则兼善天下。', author: '孟子' },
  { text: '志不立，天下无可成之事。', author: '王阳明' },
  { text: '今日事，今日毕。', author: '古训' }
]

function getDailyQuote() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const dayOfYear = Math.floor(diff / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export default function Study() {
  const [activeTab, setActiveTab] = useState('人事专业')
  const [weekStudyHours, setWeekStudyHours] = useState(0)
  const [streakDays, setStreakDays] = useState(0)

  const dailyQuote = useMemo(() => getDailyQuote(), [])

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

      {/* 每日精选格言 */}
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 card-shadow">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💬</span>
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">{dailyQuote.text}</p>
              <p className="text-xs text-amber-600 mt-2 text-right">—— {dailyQuote.author}</p>
            </div>
          </div>
        </div>
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
