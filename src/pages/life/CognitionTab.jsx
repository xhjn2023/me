import { useState } from 'react'
import { cognitionEntriesApi, cognitionFeedbacksApi, todayStr, formatDateCN } from '../../db/database'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  Card, Button, Icon, EmptyState, LoadingState, ErrorState,
  BottomSheet, Textarea, showToast, Badge
} from '../../components/ui'
import FeedbackCard from './FeedbackCard'
import { analyzeReflection } from '../../utils/cognitionEngine'

// 分类
const CATEGORIES = [
  { key: 'general', label: '通用想法', icon: 'lightbulb', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { key: 'work', label: '工作困扰', icon: 'briefcase', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { key: 'relationship', label: '人际关系', icon: 'usersRound', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { key: 'self-growth', label: '自我成长', icon: 'trendingUp', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { key: 'emotion', label: '情绪波动', icon: 'heartPulse', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { key: 'decision', label: '抉择纠结', icon: 'gitBranch', color: 'bg-amber-50 text-amber-600 border-amber-100' },
]

// 心情选项（偏自省场景用的情绪维度，不是日常娱乐用的emoji）
const MOODS = [
  { key: 'anxious', label: '焦虑', emoji: '🫣' },
  { key: 'sad', label: '低落', emoji: '😔' },
  { key: 'angry', label: '愤怒', emoji: '😤' },
  { key: 'confused', label: '困惑', emoji: '🤔' },
  { key: 'ashamed', label: '自责', emoji: '😞' },
  { key: 'hurt', label: '受伤', emoji: '💔' },
  { key: 'fear', label: '恐惧', emoji: '😨' },
  { key: 'calm', label: '平静想理清楚', emoji: '🧘' },
]

const categoryMeta = key => (CATEGORIES.find(c => c.key === key) || CATEGORIES[0])

export default function CognitionTab() {
  // 输入状态
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [mood, setMood] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState(null)
  const [currentEntryId, setCurrentEntryId] = useState(null)

  // 历史列表
  const { data: history, loading: histLoading, error: histError, refresh } = useAsyncData(
    async () => {
      const entries = await cognitionEntriesApi.getAll({ limit: 30 })
      // 同时取反馈（批量）
      const result = []
      for (const e of entries) {
        const fb = await cognitionFeedbacksApi.getByEntryId(e.id).catch(() => null)
        result.push({ ...e, feedback: fb })
      }
      return result
    },
    []
  )
  const historyList = history || []

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState(null)

  // 生成分析
  async function handleAnalyze() {
    const text = content.trim()
    if (!text) {
      showToast('先写下你此刻的想法或感想', 'info')
      return
    }
    if (text.length < 15) {
      showToast('内容太短了，至少写15个字。越具体，分析越有针对性', 'info')
      return
    }

    setAnalyzing(true)
    try {
      // 1. 先存条目的数据库
      const entry = await cognitionEntriesApi.add({
        date: todayStr(),
        content: text,
        category,
        mood,
      })
      setCurrentEntryId(entry.id)

      // 2. 本地规则引擎分析（纯函数，秒级响应）
      const result = analyzeReflection(text, { mood, category })

      // 3. 反馈写入数据库
      await cognitionFeedbacksApi.upsert(entry.id, result)

      setCurrentFeedback(result)
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('分析完成。别抗拒，直接看结果', 'success')
    } catch (e) {
      console.error(e)
      showToast('分析失败，请检查网络', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  // 重新生成（修改内容后）
  async function handleRegenerate() {
    const text = content.trim()
    if (!text || !currentEntryId) return
    setAnalyzing(true)
    try {
      // 更新条目
      await cognitionEntriesApi.update(currentEntryId, { content: text, category, mood })
      const result = analyzeReflection(text, { mood, category })
      await cognitionFeedbacksApi.upsert(currentEntryId, result)
      setCurrentFeedback(result)
      refresh()
      showToast('已重新分析', 'success')
    } catch (e) {
      showToast('失败', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  function clearDraft() {
    setContent('')
    setMood('')
    setCategory('general')
    setCurrentFeedback(null)
    setCurrentEntryId(null)
  }

  function openDetail(item) {
    setDetailItem(item)
    setDetailOpen(true)
  }

  async function handleDelete(id) {
    try {
      await cognitionEntriesApi.delete(id)
      showToast('已删除', 'success')
      refresh()
      if (id === currentEntryId) clearDraft()
    } catch {
      showToast('删除失败', 'error')
    }
  }

  // 历史统计摘要
  const stats = computeStats(historyList)

  return (
    <div className="animate-fade-in pb-24">
      {/* Header：深靛蓝渐变，区别于其他tab的薄荷绿 */}
      <header className="mx-4 mt-2 px-4 pt-4 pb-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100/60 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Icon name="brainCircuit" size={18} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">认知重塑</h1>
              <p className="text-xs text-slate-500 mt-0.5">写下想法 → 客观批判 → 换视角</p>
            </div>
          </div>
          {/* 迷你统计 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <MiniStat label="记录" value={stats.total} icon="bookCopy" />
            <MiniStat label="平均" value={stats.avgScore ? `${stats.avgScore}` : '-'} icon="gauge" />
          </div>
        </div>

        {/* 历史高频偏差提示 */}
        {stats.topBiases.length > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-100/60">
            <p className="text-[11px] text-slate-500 mb-1.5">近期反复出现的偏差（提醒）：</p>
            <div className="flex flex-wrap gap-1.5">
              {stats.topBiases.slice(0, 3).map(b => (
                <Badge key={b.key} color="danger" className="text-[10.5px] px-2 py-0.5 rounded-lg">
                  {b.name} ×{b.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* 输入区 */}
      <div className="px-4 mt-4">
        <Card className="p-3.5">
          {/* 分类选择 */}
          <div className="mb-3">
            <p className="text-[11px] font-medium text-slate-500 mb-1.5 px-1">分类（帮助引擎匹配分析策略）</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => {
                const active = category === c.key
                return (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11.5px] border transition-all ${
                      active ? c.color + ' ring-2 ring-current/15 font-medium' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon name={c.icon} size={11} className="inline mr-1 opacity-80" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 心情选择 */}
          <div className="mb-3">
            <p className="text-[11px] font-medium text-slate-500 mb-1.5 px-1">此刻的情绪（可选）</p>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => {
                const active = mood === m.key
                return (
                  <button
                    key={m.key}
                    onClick={() => setMood(active ? '' : m.key)}
                    className={`px-2.5 py-1 rounded-lg text-[11.5px] border transition-all ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-500/15 font-medium'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="mr-1">{m.emoji}</span>{m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 正文输入 */}
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={6}
            placeholder={`写下此刻占据你脑子里的想法、困扰、判断或感受。\n比如："我提交的方案被领导驳回了，他肯定看不起我，我真是废物，永远都做不好。"\n越具体越好，不要修饰，真实写出来。`}
            className="bg-indigo-50/30"
          />
          <p className="text-[11px] text-slate-400 mt-1.5 px-1 leading-relaxed">
            引擎不会讨好你，不会说"你已经很棒了"。它会客观指出你的认知偏差。如果觉得被刺痛，说明击中了盲区。
          </p>

          {/* 按钮区 */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400 px-1">
              {content.length} 字
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={clearDraft} disabled={!content && !currentFeedback}>
                清空
              </Button>
              {currentEntryId ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon="sparkles"
                  loading={analyzing}
                  onClick={handleRegenerate}
                  className="bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25"
                >
                  修改后重新分析
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon="sparkles"
                  loading={analyzing}
                  onClick={handleAnalyze}
                  className="bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25"
                >
                  开始分析
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 当前反馈展示 */}
      {currentFeedback && (
        <div className="px-4 mt-4">
          <FeedbackCard feedback={currentFeedback} />
        </div>
      )}

      {/* 历史记录列表 */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            <Icon name="history" size={14} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">历史记录</span>
          </div>
          <span className="text-[11px] text-slate-400">共 {historyList.length} 条</span>
        </div>

        {histError ? (
          <Card className="p-4"><ErrorState message="加载失败" onRetry={refresh} /></Card>
        ) : histLoading ? (
          <Card className="p-4"><LoadingState /></Card>
        ) : historyList.length === 0 ? (
          <EmptyState
            icon="bookCopy"
            title="还没有认知重塑记录"
            description='写完上面的内容，点"开始分析"，你的第一条记录就会出现在这里'
            className="py-10"
          />
        ) : (
          <div className="space-y-2">
            {historyList.map(item => (
              <HistoryCard
                key={item.id}
                item={item}
                onOpen={() => openDetail(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      <BottomSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailItem ? formatDateCN(detailItem.date) : ''}
      >
        {detailItem && (
          <div className="space-y-4">
            {/* 原始内容 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <Badge className={categoryMeta(detailItem.category).color}>
                  {categoryMeta(detailItem.category).label}
                </Badge>
                {detailItem.mood && (
                  <span className="text-[11px] text-slate-500">
                    情绪：{MOODS.find(m => m.key === detailItem.mood)?.emoji || ''} {MOODS.find(m => m.key === detailItem.mood)?.label || detailItem.mood}
                  </span>
                )}
              </div>
              <p className="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {detailItem.content}
              </p>
            </div>

            {/* 反馈 */}
            {detailItem.feedback ? (
              <FeedbackCard feedback={detailItem.feedback} entry={detailItem} />
            ) : (
              <EmptyState icon="brainCircuit" title="这条记录没有反馈" description="可能是分析过程中断了，可以回到主面板重新分析" />
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

// ───────────── 子组件：历史卡片 ─────────────
function HistoryCard({ item, onOpen, onDelete }) {
  const fb = item.feedback
  const cm = categoryMeta(item.category)
  const score = fb?.score
  const tier = score >= 70 ? 'good' : score >= 45 ? 'warn' : 'danger'
  const tierColor = {
    good: 'from-emerald-400 to-teal-500 text-emerald-600 bg-emerald-50',
    warn: 'from-amber-400 to-orange-500 text-amber-600 bg-amber-50',
    danger: 'from-rose-500 to-red-500 text-rose-600 bg-rose-50',
  }[tier]

  return (
    <Card className="p-3 flex items-start gap-3">
      {/* 分数胶囊 */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierColor.split(' ').slice(0,2).join(' ')} text-white flex flex-col items-center justify-center shadow-sm flex-shrink-0`}>
        <span className="text-sm font-bold leading-none">{score ?? '--'}</span>
        <span className="text-[9px] opacity-90 mt-0.5">{fb ? (tier === 'good' ? '冷静' : tier === 'warn' ? '警惕' : '劫持') : '无'}</span>
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[10.5px] px-1.5 py-0.5 rounded-md border ${cm.color}`}>
            {cm.label}
          </span>
          {fb?.biases?.slice(0, 2).map(b => (
            <span key={b.key} className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100">
              {b.name}
            </span>
          ))}
          {fb?.biases?.length > 2 && (
            <span className="text-[10.5px] text-slate-400">+{fb.biases.length - 2}</span>
          )}
        </div>
        <p className="text-[13px] text-slate-700 leading-snug line-clamp-2">{item.content}</p>
        <p className="text-[10.5px] text-slate-400 mt-1">
          {formatDateCN(item.date)} · {item.created_at && new Date(item.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={e => { e.stopPropagation(); onDelete?.() }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition flex-shrink-0"
        aria-label="删除"
      >
        <Icon name="trash" size={14} />
      </button>
    </Card>
  )
}

// ───────────── 子组件：迷你统计数字 ─────────────
function MiniStat({ label, value, icon }) {
  return (
    <div className="flex flex-col items-center gap-0.5 w-12">
      <span className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-indigo-500">
        <Icon name={icon} size={15} />
      </span>
      <span className="text-sm font-bold text-slate-700 leading-none">{value}</span>
      <span className="text-[9.5px] text-slate-400 leading-none">{label}</span>
    </div>
  )
}

// ───────────── 统计工具函数 ─────────────
function computeStats(list) {
  const total = list?.length || 0
  let sumScore = 0, countScore = 0
  const biasCount = new Map()
  for (const item of list || []) {
    const fb = item.feedback
    if (fb && typeof fb.score === 'number' && fb.score > 0) {
      sumScore += fb.score
      countScore++
    }
    if (fb?.biases?.length) {
      for (const b of fb.biases) {
        biasCount.set(b.key, { name: b.name, count: (biasCount.get(b.key)?.count || 0) + 1 })
      }
    }
  }
  const avgScore = countScore ? Math.round(sumScore / countScore) : null
  const topBiases = [...biasCount.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.count - a.count)
  return { total, avgScore, topBiases }
}
