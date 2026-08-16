/**
 * 认知重塑 · 反馈结果展示组件
 * 结构化展示：分数 → 总结 → 认知偏差 → 证据检验 → 替代视角 → 重新表述 → 追问
 */
import { Card, Icon } from '../../components/ui'

const SCORE_COLORS = {
  good: { label: '偏冷静', from: 'from-emerald-400', to: 'to-teal-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  warn: { label: '需警惕', from: 'from-amber-400', to: 'to-orange-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
  danger: { label: '情绪劫持', from: 'from-rose-500', to: 'to-red-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
}

function scoreTier(score) {
  if (score >= 70) return SCORE_COLORS.good
  if (score >= 45) return SCORE_COLORS.warn
  return SCORE_COLORS.danger
}

// 认知偏差颜色
const BIAS_COLOR_MAP = {
  overgeneralization: 'bg-rose-50 text-rose-700 border-rose-100',
  catastrophizing: 'bg-red-50 text-red-700 border-red-100',
  black_or_white: 'bg-orange-50 text-orange-700 border-orange-100',
  emotional_reasoning: 'bg-amber-50 text-amber-700 border-amber-100',
  mind_reading: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  personalization: 'bg-lime-50 text-lime-700 border-lime-100',
  should_statements: 'bg-teal-50 text-teal-700 border-teal-100',
  labeling: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  dismissing_positive: 'bg-sky-50 text-sky-700 border-sky-100',
  selective_abstraction: 'bg-indigo-50 text-indigo-700 border-indigo-100',
}

export default function FeedbackCard({ feedback, entry }) {
  if (!feedback) return null

  const tier = scoreTier(feedback.score)
  const { biases = [], evidence = {}, perspectives = [], reframe = '', challenges = [], summary = '', score = 0 } = feedback

  return (
    <div className="space-y-3 animate-fade-in">
      {/* 顶部：分数 + 一句话总结 */}
      <Card className={`p-4 ${tier.bg} ${tier.border}`}>
        <div className="flex items-start gap-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.from} ${tier.to} text-white flex flex-col items-center justify-center shadow-lg shadow-black/5 flex-shrink-0`}>
            <span className="text-2xl font-bold leading-none">{score}</span>
            <span className="text-[10px] opacity-90 mt-0.5">{tier.label}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name="brainCircuit" size={14} className={tier.text} />
              <span className={`text-xs font-semibold ${tier.text}`}>认知健康度评估</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      </Card>

      {/* 命中的认知偏差 */}
      {biases.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Icon name="alertTriangle" size={14} className="text-rose-500" />
            <span className="text-xs font-semibold text-slate-700">检测到 {biases.length} 处认知偏差</span>
          </div>
          {biases.map((b, i) => (
            <div key={b.key + i} className={`p-3 rounded-2xl border ${BIAS_COLOR_MAP[b.key] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold">{b.name}</span>
              </div>
              <p className="text-[13px] leading-relaxed opacity-95">
                <span className="font-semibold mr-1.5">证据：</span>{b.evidence}
              </p>
              <p className="text-[12.5px] leading-relaxed opacity-85 mt-1.5 pt-1.5 border-t border-current/10">
                <span className="font-semibold mr-1.5">为什么它危险：</span>{b.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 证据检验 */}
      {(evidence.support?.length > 0 || evidence.against?.length > 0) && (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="scale" size={14} className="text-primary-500" />
            <span className="text-xs font-semibold text-slate-700">证据检验</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 mb-1.5 flex items-center gap-1">
                <Icon name="checkCircle2" size={11} /> 支持你结论的证据
              </p>
              <ul className="space-y-1">
                {evidence.support.map((s, i) => (
                  <li key={i} className="text-[12.5px] text-slate-600 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-rose-600 mb-1.5 flex items-center gap-1">
                <Icon name="xCircle" size={11} /> 反证 / 检验你的结论
              </p>
              <ul className="space-y-1">
                {evidence.against.map((s, i) => (
                  <li key={i} className="text-[12.5px] text-slate-600 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-rose-400">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* 替代视角 */}
      {perspectives.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="eye" size={14} className="text-primary-500" />
            <span className="text-xs font-semibold text-slate-700">换个视角看这件事</span>
          </div>
          <div className="space-y-2.5">
            {perspectives.map((p, i) => (
              <div key={i} className="p-3 rounded-xl bg-gradient-to-br from-primary-50/60 to-white border border-primary-100/60">
                <p className="text-[12px] font-semibold text-primary-700 mb-1 flex items-center gap-1.5">
                  <Icon name="user" size={12} />
                  {p.title}
                </p>
                <p className="text-[13px] text-slate-700 leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 重新表述 */}
      {reframe && (
        <Card className="p-4 bg-gradient-to-br from-violet-50/60 to-white border border-violet-100/60">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Icon name="pencilRuler" size={14} className="text-violet-500" />
            <span className="text-xs font-semibold text-slate-700">试试这样重新表述</span>
          </div>
          <div className="whitespace-pre-line text-[13.5px] text-slate-700 leading-relaxed pl-3 border-l-2 border-violet-300">
            {reframe}
          </div>
        </Card>
      )}

      {/* 建设性追问 */}
      {challenges.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="messageCircleQuestion" size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">认真回答下面这些问题（别跳过）</span>
          </div>
          <ol className="space-y-2.5">
            {challenges.map((c, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[13px] text-slate-700 leading-relaxed flex-1">
                  {c.question}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
