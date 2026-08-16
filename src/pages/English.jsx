import { useState, useMemo } from 'react'
import { englishCardsApi } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  PageHeader, Card, Stat, ChipGroup, EmptyState, LoadingState, ErrorState,
  SectionHeader, Icon, showToast
} from '../components/ui'
import {
  BOOKS, RATINGS, newCard, reviewCard, getDueCards, serializeCard,
  deserializeCard, computeStreak, countMastered
} from '../db/englishStore'
import cet6Words from './study/words/cet6.json'
import kaoyanWords from './study/words/kaoyan.json'

const WORD_FILES = { cet6: cet6Words, kaoyan: kaoyanWords }
const NEW_PER_SESSION = 10

// 单词发音：Web Speech API，零依赖
function speak(text, rate = 0.85) {
  if (!('speechSynthesis' in window)) {
    showToast('当前浏览器不支持语音播放', 'error')
    return
  }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = rate
  window.speechSynthesis.speak(u)
}

function toLocalDateStr(d) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
}

const RATING_COLOR = {
  again: 'bg-rose-500 active:bg-rose-600',
  hard: 'bg-amber-500 active:bg-amber-600',
  good: 'bg-emerald-500 active:bg-emerald-600',
  easy: 'bg-sky-500 active:bg-sky-600'
}

export default function English() {
  const [book, setBook] = useState('cet6')
  const [queue, setQueue] = useState([])
  const [idx, setIdx] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [learnedCount, setLearnedCount] = useState(0)

  const { data: rows, loading, error, refresh } = useAsyncData(() => englishCardsApi.getByBook(book), [book])

  // 反序列化卡片
  const cards = useMemo(() => {
    return (rows || []).map(r => ({
      id: r.id,
      word: r.word,
      book: r.book,
      card: deserializeCard(r.fsrs_state)
    }))
  }, [rows])

  const words = WORD_FILES[book] || []
  const wordMap = useMemo(() => new Map(words.map(w => [w.word, w])), [words])

  // 统计
  const dueCount = useMemo(() => getDueCards(cards.map(c => c.card)).length, [cards])
  const mastered = useMemo(() => countMastered(cards.map(c => c.card)), [cards])
  const streak = useMemo(() => {
    const dates = cards.map(c => c.card.last_review).filter(Boolean).map(toLocalDateStr)
    return computeStreak(dates)
  }, [cards])

  // 开始学习：到期卡优先 + 取 N 个新词
  function startSession() {
    const existing = new Set(cards.map(c => c.word))
    const due = getDueCards(cards.map(c => c.card), new Date())
      .map(card => {
        const row = cards.find(c => c.card === card)
        return { id: row?.id, word: row?.word, book, card, entry: wordMap.get(row?.word), isNew: false }
      })
    const fresh = words.filter(w => !existing.has(w.word)).slice(0, NEW_PER_SESSION)
      .map(w => ({ id: null, word: w.word, book, card: newCard(), entry: w, isNew: true }))
    const q = [...due, ...fresh]
    if (q.length === 0) {
      showToast('今日任务已完成', 'success')
      return
    }
    setQueue(q)
    setIdx(0)
    setReveal(false)
    setLearnedCount(0)
  }

  // 评分 → 保存 → 下一个
  async function handleRate(rating) {
    const item = queue[idx]
    if (!item) return
    const nextCard = reviewCard(item.card, rating)
    const state = serializeCard(nextCard)
    const payload = {
      word: item.word,
      book: item.book,
      fsrs_state: state,
      due: state.due,
      lapses: state.lapses,
      last_review: state.last_review
    }
    try {
      if (item.id) {
        await englishCardsApi.update(item.id, payload)
      } else {
        await englishCardsApi.add(payload)
      }
    } catch (e) {
      console.error('保存复习记录失败:', e)
      showToast('保存失败，请重试', 'error')
      return
    }
    setLearnedCount(c => c + 1)
    if (idx + 1 < queue.length) {
      setIdx(idx + 1)
      setReveal(false)
    } else {
      setQueue([])
      refresh()
      showToast('本轮学习完成！', 'success')
    }
  }

  const current = queue[idx]

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        title="英语学习"
        subtitle={`已掌握 ${mastered} 词 · 连续 ${streak} 天`}
        accent="study"
        icon="languages"
      />

      <div className="px-4 mt-4">
        <ChipGroup
          items={Object.entries(BOOKS).map(([k, v]) => ({ value: k, label: v.label }))}
          value={book}
          onChange={b => { setBook(b); setQueue([]) }}
          color="emerald"
        />
      </div>

      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        <Stat label="待复习" value={dueCount} unit="词" icon="clock" color="amber" />
        <Stat label="连续学习" value={streak} unit="天" icon="flame" color="orange" />
        <Stat label="已掌握" value={mastered} unit="词" icon="checkCircle" color="emerald" />
      </div>

      <div className="px-4 mt-5">
        {loading ? (
          <Card><LoadingState text="加载单词..." /></Card>
        ) : error ? (
          <Card><ErrorState message="加载失败" onRetry={refresh} /></Card>
        ) : current ? (
          <div>
            <SectionHeader
              title={`学习进度 ${idx + 1} / ${queue.length}`}
              icon="bookOpen"
              action={<span className="text-xs text-primary-400">本次已学 {learnedCount} 词</span>}
            />
            <Card className="overflow-hidden">
              {/* 单词卡 */}
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-bold text-primary-900 tracking-tight">{current.entry?.word || current.word}</h2>
                    {current.entry?.phonetic && (
                      <p className="text-sm text-primary-400 mt-1">{current.entry.phonetic}</p>
                    )}
                  </div>
                  <button
                    onClick={() => speak(current.entry?.word || current.word)}
                    className="w-11 h-11 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center hover:bg-sky-200 active:bg-sky-300 transition btn-press"
                    aria-label="朗读单词"
                  >
                    <Icon name="volume2" size={20} />
                  </button>
                </div>

                {!reveal ? (
                  <button
                    onClick={() => setReveal(true)}
                    className="mt-6 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium transition shadow-sm shadow-emerald-500/20"
                  >
                    显示释义
                  </button>
                ) : (
                  <div className="mt-5 space-y-3 animate-fade-in">
                    <div className="rounded-xl bg-primary-50/60 px-4 py-3">
                      <p className="text-sm text-primary-800 font-medium">{current.entry?.meaning}</p>
                    </div>
                    {current.entry?.sentence && (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-primary-700 italic leading-relaxed flex-1">{current.entry.sentence}</p>
                        <button
                          onClick={() => speak(current.entry.sentence, 0.75)}
                          className="text-sky-500 hover:text-sky-600 p-1 rounded-md hover:bg-sky-50 transition flex-shrink-0"
                          aria-label="朗读例句"
                        >
                          <Icon name="volume2" size={16} />
                        </button>
                      </div>
                    )}
                    {current.entry?.translation && (
                      <p className="text-xs text-primary-400 leading-relaxed">{current.entry.translation}</p>
                    )}

                    {/* 四档评分 */}
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {RATINGS.map(r => (
                        <button
                          key={r.key}
                          onClick={() => handleRate(r.rating)}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-white transition btn-press shadow-sm ${RATING_COLOR[r.key]}`}
                        >
                          <span className="text-sm font-semibold">{r.label}</span>
                          <span className="text-[10px] opacity-90">{r.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            {cards.length === 0 && words.length === 0 ? (
              <EmptyState icon="bookOpen" title="暂无词库数据" description="请确认词库文件已就绪" />
            ) : (
              <EmptyState
                icon="bookOpen"
                title={dueCount > 0 ? `还有 ${dueCount} 词待复习` : '开始新一组单词'}
                description={dueCount > 0 ? '点击下方按钮继续复习' : `每次学习 ${NEW_PER_SESSION} 个新词`}
                action={
                  <button
                    onClick={startSession}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium transition shadow-sm shadow-emerald-500/20"
                  >
                    <Icon name="play" size={14} />
                    {dueCount > 0 ? '开始复习' : '开始学习'}
                  </button>
                }
              />
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
