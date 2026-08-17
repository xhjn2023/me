/**
 * 内联认知洞察组件 — 嵌入到每日记录/每周复盘/随笔卡片下方
 *
 * 轻量折叠式，不做完整 FeedbackCard，只展示关键洞察：
 *  · 认知健康度分数 + 偏差摘要
 *  · 展开后：偏差详情 / 重新表述建议 / 跨时间观点变化追踪
 *
 * 纯计算（analyzeReflection 是纯函数），无需额外存储
 */
import { useMemo, useState } from 'react'
import { analyzeReflection } from '../../utils/cognitionEngine'
import { Icon } from '../../components/ui'

// ─── 分数徽章 ───
const SCORE_BADGE = {
  good:     'bg-emerald-100 text-emerald-700',
  warn:     'bg-amber-100 text-amber-700',
  danger:   'bg-rose-100 text-rose-700',
  critical: 'bg-red-100 text-red-800',
}

function scoreTier(s) {
  if (s >= 75) return 'good'
  if (s >= 55) return 'warn'
  if (s >= 35) return 'danger'
  return 'critical'
}

/**
 * @param {object} props
 * @param {string} props.text          当前文本（必填，短于 10 字不分析）
 * @param {string[]} props.historyTexts 历史条目文本数组（可选，用于跨时间追踪）
 */
export default function CognitionInsight({ text, historyTexts = [] }) {
  const [expanded, setExpanded] = useState(false)

  const analysis = useMemo(() => {
    if (!text || text.replace(/\s/g, '').length < 10) return null
    return analyzeReflection(text)
  }, [text])

  // ─── 跨时间观点变化追踪 ───
  const changeTrack = useMemo(() => {
    if (!analysis || historyTexts.length === 0) return null
    const histAnalyses = historyTexts
      .map(t => analyzeReflection(t))
      .filter(a => a && a.biases)

    const currentKeys = new Set(analysis.biases.map(b => b.key))
    const histKeys = new Set(histAnalyses.flatMap(a => a.biases.map(b => b.key)))

    // 本次新出现的偏差（历史中从未出现）
    const newBiases = analysis.biases.filter(b => !histKeys.has(b.key))
    // 反复 ≥2 次出现的偏差（含本次）
    const recurring = analysis.biases.filter(b => {
      const count = histAnalyses.filter(a => a.biases.some(hb => hb.key === b.key)).length
      return count >= 2
    })

    const prevScores = histAnalyses.map(a => a.score)
    const avgPrev = prevScores.length > 0
      ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length)
      : null

    return { newBiases, recurring, avgPrev, historyCount: histAnalyses.length }
  }, [analysis, historyTexts])

  if (!analysis) return null

  const tier = scoreTier(analysis.score)
  const topBias = analysis.biases[0]
  const hasChanges = changeTrack && (changeTrack.newBiases.length > 0 || changeTrack.recurring.length > 0)

  return (
    <div className="mt-2">
      {/* ─── 折叠触发器：一行摘要 ─── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-50/80 transition text-left group"
      >
        <Icon name="brainCircuit" size={13} className="text-violet-400 flex-shrink-0" />
        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${SCORE_BADGE[tier]}`}>
          {analysis.score}
        </span>
        {topBias ? (
          <span className="text-[11px] text-slate-500 truncate flex-1">
            {topBias.name} · 严重度 {topBias.severity}/10
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 flex-1">未检测到典型认知偏差</span>
        )}
        <span className="text-[10px] text-slate-400 flex-shrink-0">
          {analysis.biases.length > 0 ? `${analysis.biases.length} 项` : ''}
        </span>
        <Icon
          name={expanded ? 'chevronUp' : 'chevronDown'}
          size={12}
          className="text-slate-300 group-hover:text-slate-500 transition flex-shrink-0"
        />
      </button>

      {/* ─── 展开内容 ─── */}
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2.5 animate-fade-in">
          {/* 总结 */}
          <p className="text-[12px] text-slate-600 leading-relaxed pl-1">
            {analysis.summary}
          </p>

          {/* 命中的偏差（紧凑列表） */}
          {analysis.biases.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                命中的认知偏差
              </p>
              {analysis.biases.slice(0, 4).map((b, i) => (
                <div key={b.key + i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700">{b.name}</span>
                    <span className="text-slate-400">（严重度 {b.severity}/10）</span>
                    <br />
                    <span className="text-slate-500">{b.evidence}</span>
                  </span>
                </div>
              ))}
              {analysis.biases.length > 4 && (
                <p className="text-[10px] text-slate-400 pl-3">
                  ...还有 {analysis.biases.length - 4} 项偏差
                </p>
              )}
            </div>
          )}

          {/* 重新表述 */}
          {analysis.reframe && (
            <div className="bg-violet-50/60 rounded-xl p-2.5 border border-violet-100/50">
              <p className="text-[10px] font-semibold text-violet-500 mb-1">
                试试这样重新表述
              </p>
              <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">
                {analysis.reframe}
              </p>
            </div>
          )}

          {/* 跨时间观点变化追踪 */}
          {hasChanges && (
            <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-100/50">
              <p className="text-[10px] font-semibold text-amber-600 mb-1.5">
                观点变化追踪 · 对比 {changeTrack.historyCount} 条历史记录
              </p>
              {changeTrack.newBiases.length > 0 && (
                <p className="text-[11px] text-slate-600 leading-relaxed mb-1">
                  <span className="font-semibold text-amber-700">新出现的偏差：</span>
                  {changeTrack.newBiases.map(b => b.name).join('、')}
                </p>
              )}
              {changeTrack.recurring.length > 0 && (
                <p className="text-[11px] text-slate-600 leading-relaxed mb-1">
                  <span className="font-semibold text-rose-700">反复出现 ≥3 次的模式：</span>
                  {changeTrack.recurring.map(b => b.name).join('、')}
                  <span className="text-slate-400"> — 这是你的核心认知习惯</span>
                </p>
              )}
              {changeTrack.avgPrev !== null && (
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-700">历史平均认知分：</span>
                  {changeTrack.avgPrev} → 本次 {analysis.score}
                  {analysis.score > changeTrack.avgPrev + 5 && (
                    <span className="text-emerald-600 font-semibold"> ↑ 提升</span>
                  )}
                  {analysis.score < changeTrack.avgPrev - 5 && (
                    <span className="text-rose-600 font-semibold"> ↓ 下降</span>
                  )}
                  {Math.abs(analysis.score - changeTrack.avgPrev) <= 5 && (
                    <span className="text-slate-400"> → 持平</span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}