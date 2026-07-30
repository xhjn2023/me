import { useState, useEffect } from 'react'
import { coursesApi, booksApi, studyRecordsApi, todayStr, getStreakDays } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  PageHeader, Card, Stat, ChipGroup, EmptyState, LoadingState,
  SectionHeader, ProgressBar, Icon, showToast
} from '../components/ui'
import { COURSE_OUTLINES } from './study/courses'

const CATEGORIES = ['全部', '人事专业', '超市经营', '内心能量', '人生智慧', '摄影']

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

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  return Math.floor(diff / 86400000)
}

function getDailyQuoteIndex() {
  return getDayOfYear() % QUOTES.length
}

// 每日英语六级单词
const CET6_WORDS = [
  { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃；抛弃', sentence: 'He abandoned his old car and bought a new one.', translation: '他废弃了旧车，买了一辆新的。' },
  { word: 'abstract', phonetic: '/ˈæbstrækt/', meaning: 'adj. 抽象的 n. 摘要', sentence: 'The concept is too abstract for young children to grasp.', translation: '这个概念对幼儿来说太抽象而难以理解。' },
  { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', meaning: 'v. 容纳；适应', sentence: 'The hotel can accommodate up to 500 guests.', translation: '这家酒店最多可容纳 500 位客人。' },
  { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'adj. 模糊的；含糊的', sentence: 'His reply was ambiguous, leaving us unsure what to do.', translation: '他的回答含糊不清，让我们不知所措。' },
  { word: 'anticipate', phonetic: '/ænˈtɪsɪpeɪt/', meaning: 'v. 预期；预料', sentence: 'We anticipate a busy season ahead.', translation: '我们预计接下来的季节会很繁忙。' },
  { word: 'arbitrary', phonetic: '/ˈɑːbɪtrəri/', meaning: 'adj. 任意的；武断的', sentence: 'The decision seemed arbitrary and unfair.', translation: '这个决定看起来既武断又不公平。' },
  { word: 'ascertain', phonetic: '/ˌæsəˈteɪn/', meaning: 'v. 查明；弄清', sentence: 'The police tried to ascertain the truth of his story.', translation: '警方试图查明他陈述的真相。' },
  { word: 'authentic', phonetic: '/ɔːˈθentɪk/', meaning: 'adj. 真正的；真实的', sentence: 'This painting is an authentic work by Picasso.', translation: '这幅画是毕加索的真迹。' },
  { word: 'autonomous', phonetic: '/ɔːˈtɒnəməs/', meaning: 'adj. 自主的；自治的', sentence: 'The region became fully autonomous last year.', translation: '该地区去年实现了完全自治。' },
  { word: 'bizarre', phonetic: '/bɪˈzɑː(r)/', meaning: 'adj. 奇异的；古怪的', sentence: 'He had a bizarre habit of collecting umbrellas.', translation: '他有一个收集雨伞的古怪习惯。' },
  { word: 'boost', phonetic: '/buːst/', meaning: 'v. 促进；提升 n. 推动', sentence: 'The new policy will boost economic growth.', translation: '新政策将促进经济增长。' },
  { word: 'breed', phonetic: '/briːd/', meaning: 'v. 繁殖；培育 n. 品种', sentence: 'These dogs were bred for hunting.', translation: '这些狗是为狩猎而培育的品种。' },
  { word: 'capable', phonetic: '/ˈkeɪpəbl/', meaning: 'adj. 有能力的；能干的', sentence: 'She is capable of solving complex problems.', translation: '她有能力解决复杂的问题。' },
  { word: 'chronic', phonetic: '/ˈkrɒnɪk/', meaning: 'adj. 慢性的；长期的', sentence: 'He suffers from chronic back pain.', translation: '他患有慢性背痛。' },
  { word: 'coherent', phonetic: '/kəʊˈhɪərənt/', meaning: 'adj. 连贯的；一致的', sentence: 'Her argument was clear and coherent.', translation: '她的论点清晰且连贯。' },
  { word: 'commence', phonetic: '/kəˈmens/', meaning: 'v. 开始；着手', sentence: 'The ceremony will commence at noon.', translation: '仪式将于正午开始。' },
  { word: 'compatible', phonetic: '/kəmˈpætəbl/', meaning: 'adj. 兼容的；相容的', sentence: 'This software is compatible with all operating systems.', translation: '这款软件兼容所有操作系统。' },
  { word: 'compile', phonetic: '/kəmˈpaɪl/', meaning: 'v. 编纂；汇编', sentence: 'She compiled a list of useful resources.', translation: '她编纂了一份有用的资源清单。' },
  { word: 'complement', phonetic: '/ˈkɒmplɪment/', meaning: 'v. 补充 n. 补足物', sentence: 'The wine complements the dish perfectly.', translation: '这款葡萄酒与这道菜相得益彰。' },
  { word: 'comply', phonetic: '/kəmˈplaɪ/', meaning: 'v. 遵守；服从', sentence: 'All employees must comply with safety regulations.', translation: '所有员工都必须遵守安全规定。' },
  { word: 'concurrent', phonetic: '/kənˈkʌrənt/', meaning: 'adj. 同时发生的', sentence: 'The two events were purely concurrent, not related.', translation: '这两件事只是同时发生，并无关联。' },
  { word: 'concise', phonetic: '/kənˈsaɪs/', meaning: 'adj. 简明的；简洁的', sentence: 'Please give a concise summary of the report.', translation: '请对报告做一份简明的概述。' },
  { word: 'consensus', phonetic: '/kənˈsensəs/', meaning: 'n. 共识；一致意见', sentence: 'They reached a consensus after long discussion.', translation: '经过长期讨论，他们达成了共识。' },
  { word: 'constitute', phonetic: '/ˈkɒnstɪtjuːt/', meaning: 'v. 构成；组成', sentence: 'These facts constitute a serious threat.', translation: '这些事实构成了严重威胁。' },
  { word: 'contemplate', phonetic: '/ˈkɒntəmpleɪt/', meaning: 'v. 沉思；考虑', sentence: 'He sat by the river, contemplating his future.', translation: '他坐在河边，思考自己的未来。' },
  { word: 'deteriorate', phonetic: '/dɪˈtɪəriəreɪt/', meaning: 'v. 恶化；变坏', sentence: 'His health began to deteriorate rapidly.', translation: '他的健康状况开始迅速恶化。' },
  { word: 'discreet', phonetic: '/dɪˈskriːt/', meaning: 'adj. 谨慎的；得体的', sentence: 'Be discreet when handling sensitive information.', translation: '处理敏感信息时要谨慎。' },
  { word: 'dominant', phonetic: '/ˈdɒmɪnənt/', meaning: 'adj. 占主导的；支配的', sentence: 'The dominant team won the championship easily.', translation: '这支强队轻松赢得了冠军。' },
  { word: 'elaborate', phonetic: '/ɪˈlæbərət/', meaning: 'v. 详细说明 adj. 精细的', sentence: 'Could you elaborate on your proposal?', translation: '你能详细说明一下你的提案吗？' },
  { word: 'endeavor', phonetic: '/ɪnˈdevə(r)/', meaning: 'v. 努力 n. 尽力', sentence: 'We will endeavor to finish the work on time.', translation: '我们将尽力按时完成工作。' }
]

function getDailyWord() {
  return CET6_WORDS[getDayOfYear() % CET6_WORDS.length]
}

// 单词发音：Web Speech API，零依赖
function speakWord(word) {
  if (!('speechSynthesis' in window)) {
    showToast('当前浏览器不支持语音播放', 'error')
    return
  }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  u.rate = 0.85
  u.pitch = 1
  window.speechSynthesis.speak(u)
}

// 读例句
function speakSentence(sentence) {
  if (!('speechSynthesis' in window)) {
    showToast('当前浏览器不支持语音播放', 'error')
    return
  }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(sentence)
  u.lang = 'en-US'
  u.rate = 0.75
  u.pitch = 1
  window.speechSynthesis.speak(u)
}

export default function Study() {
  const [activeTab, setActiveTab] = useState('人事专业')
  const [weekStudyHours, setWeekStudyHours] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [expandedCourse, setExpandedCourse] = useState(null)

  // 格言：默认按当天轮换，可点击刷新切换下一条
  const [quoteIndex, setQuoteIndex] = useState(getDailyQuoteIndex)
  const dailyQuote = QUOTES[quoteIndex]
  const refreshQuote = () => setQuoteIndex(i => (i + 1) % QUOTES.length)

  const dailyWord = getDailyWord()

  const { data: courses, loading: coursesLoading } = useAsyncData(() => coursesApi.getAll(activeTab === '全部' ? undefined : activeTab), [activeTab])

  const { data: books, loading: booksLoading } = useAsyncData(() => booksApi.getAll(activeTab === '全部' ? undefined : activeTab), [activeTab])

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

  function toggleCourse(id) {
    setExpandedCourse(prev => prev === id ? null : id)
  }

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        title="学习成长"
        subtitle={`本周学习 ${weekStudyHours}h · 连续 ${streakDays} 天`}
        accent="study"
        icon="graduationCap"
      />

      {/* 每日精选格言（点击可刷新） */}
      <div className="px-4 mt-4">
        <div
          onClick={refreshQuote}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
          title="点击换一条"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Icon name="messageCircle" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-relaxed">{dailyQuote.text}</p>
              <p className="text-xs text-amber-600 mt-2 text-right">—— {dailyQuote.author}</p>
            </div>
            <span className="text-amber-500 flex-shrink-0 self-start mt-1.5" title="换一条">
              <Icon name="refreshCw" size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* 每日英语六级单词（含发音） */}
      <div className="px-4 mt-3">
        <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
              <Icon name="languages" size={14} />
            </div>
            <span className="text-xs text-sky-700 font-medium">每日六级单词</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-slate-800">{dailyWord.word}</h3>
            <span className="text-sm text-slate-500">{dailyWord.phonetic}</span>
            <button
              onClick={() => speakWord(dailyWord.word)}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-medium transition shadow-sm shadow-sky-500/20"
              aria-label="朗读单词"
            >
              <Icon name="volume2" size={13} /> 发音
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-1">{dailyWord.meaning}</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-700 italic leading-relaxed flex-1">{dailyWord.sentence}</p>
              <button
                onClick={() => speakSentence(dailyWord.sentence)}
                className="text-sky-500 hover:text-sky-600 transition flex-shrink-0 mt-0.5 p-1 rounded-md hover:bg-sky-50"
                aria-label="朗读例句"
                title="朗读例句"
              >
                <Icon name="volume2" size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{dailyWord.translation}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <ChipGroup
          items={CATEGORIES}
          value={activeTab}
          onChange={setActiveTab}
          color="emerald"
        />
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Stat
          label="本周学习"
          value={weekStudyHours}
          unit="h"
          icon="bookOpen"
          color="emerald"
        />
        <Stat
          label="连续学习"
          value={streakDays}
          unit="天"
          icon="flame"
          color="orange"
          trend={<span className="text-orange-500">继续坚持！</span>}
        />
      </div>

      <div className="px-4 mt-5">
        <SectionHeader title="在学课程" icon="graduationCap" />
        <div className="space-y-3">
          {coursesLoading ? (
            <Card><LoadingState text="加载课程..." /></Card>
          ) : courseList.length === 0 ? (
            <Card>
              <EmptyState
                icon="bookOpen"
                title="暂无课程"
                description="切换分类查看课程"
              />
            </Card>
          ) : (
            courseList.map(course => {
              const outline = COURSE_OUTLINES[course.title]
              const expanded = expandedCourse === course.id
              const isPhoto = course.category === '摄影'
              const progress = course.progress || 0
              const buttonLabel = progress === 0 ? '开始学习' : progress >= 100 ? '复习课程' : '继续学习'
              return (
                <Card key={course.id} className="overflow-hidden">
                  <div
                    className={`h-16 flex items-center px-4 bg-gradient-to-r ${outline?.cover || 'from-emerald-400 to-teal-400'}`}
                  >
                    <Icon name={outline?.icon || 'play'} size={22} className="text-white" />
                    {isPhoto && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/25 text-white border border-white/30">
                        摄影
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800">{course.title}</h3>
                    {outline?.intro && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{outline.intro}</p>
                    )}
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                      <Icon name="user" size={12} />
                      {course.instructor} · {course.currentLessons}/{course.totalLessons}课时
                    </p>
                    <div className="mt-3">
                      <ProgressBar value={progress} color="emerald" showLabel />
                    </div>
                    <button
                      onClick={() => outline && toggleCourse(course.id)}
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium transition shadow-sm shadow-emerald-500/20"
                    >
                      <Icon name={progress === 0 ? 'play' : 'bookOpen'} size={14} />
                      {buttonLabel}
                      {outline && (
                        <span className={`ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                          <Icon name="chevronDown" size={14} />
                        </span>
                      )}
                    </button>
                  </div>
                  {/* 章节大纲展开 */}
                  {expanded && outline && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 animate-fade-in">
                      <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                        <Icon name="list" size={12} /> 课程大纲 · 共 {outline.lessons.length} 节
                      </p>
                      <div className="space-y-1.5">
                        {outline.lessons.map((lesson, i) => {
                          const done = i < course.currentLessons
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm ${
                                done ? 'text-slate-400' : 'text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${
                                done
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-slate-200 text-slate-500'
                              }`}>
                                {done ? <Icon name="check" size={10} /> : i + 1}
                              </span>
                              <span className={`flex-1 ${done ? 'line-through' : ''}`}>{lesson.title}</span>
                              <span className="text-[11px] text-slate-400">{lesson.duration}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>

      <div className="px-4 mt-5">
        <SectionHeader title="推荐阅读" icon="bookOpen" />
        <div className="space-y-3">
          {booksLoading ? (
            <Card><LoadingState text="加载书籍..." /></Card>
          ) : bookList.length === 0 ? (
            <Card>
              <EmptyState
                icon="bookOpen"
                title="暂无推荐书籍"
              />
            </Card>
          ) : (
            bookList.map(book => (
              <Card key={book.id} className="p-4 flex items-center gap-3">
                <div className="w-12 h-14 bg-gradient-to-br from-rose-400 to-orange-400 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  <Icon name="bookOpen" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-800 truncate">{book.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 truncate">
                    {book.author} · {book.category}
                  </p>
                </div>
              </Card>
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
