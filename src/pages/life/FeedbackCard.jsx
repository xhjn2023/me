/**
 * 认知重塑 · 反馈结果展示组件（v2 · 成熟方案对齐版）
 *
 * 数据结构：
 * · v2 新版（engineVersion = '2.0.0-burns15-sanctum7-quirk-decatastrophizing'）
 *   ├─ biases                      Burns 15 项认知偏差
 *   ├─ thoughtRecord               Burns 7 栏思维记录（取代 v1 的 evidence+perspectives）
 *   ├─ socraticQuestions           Sanctum 苏格拉底 6 问（取代 v1 的 challenges）
 *   ├─ decatastrophizing           Quirk 去灾难化 4 步（仅严重偏差触发）
 *   ├─ defusion                    ACT 认知解离练习（情绪劫持时触发）
 *   ├─ reframe / summary / score   同 v1
 * · v1 旧版（历史记录兼容）：evidence{}、perspectives[]、challenges[]
 */
import { Card, Icon } from '../../components/ui'

// ─── 分数等级 ───
const SCORE_COLORS = {
  good: { label: '偏冷静', from: 'from-emerald-400', to: 'to-teal-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  warn: { label: '需警惕', from: 'from-amber-400', to: 'to-orange-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
  danger: { label: '显著扭曲', from: 'from-rose-500', to: 'to-red-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
  critical: { label: '情绪劫持', from: 'from-red-600', to: 'to-rose-700', text: 'text-rose-800', bg: 'bg-red-50', border: 'border-red-200' },
}

function scoreTier(score) {
  if (score >= 75) return SCORE_COLORS.good
  if (score >= 55) return SCORE_COLORS.warn
  if (score >= 35) return SCORE_COLORS.danger
  return SCORE_COLORS.critical
}

// ─── 认知偏差颜色（Burns 15 项 · 按严重度 → 冷色系） ───
const BIAS_COLOR_MAP = {
  // 严重度 10
  catastrophizing: 'bg-red-50 text-red-700 border-red-100',
  // 严重度 7
  labeling: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  // 严重度 6
  magnification_minimization: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  dismissing_positive: 'bg-sky-50 text-sky-700 border-sky-100',
  emotional_reasoning: 'bg-amber-50 text-amber-700 border-amber-100',
  overgeneralization: 'bg-rose-50 text-rose-700 border-rose-100',
  // 严重度 5
  black_or_white: 'bg-orange-50 text-orange-700 border-orange-100',
  selective_abstraction: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  mind_reading: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  fortune_telling: 'bg-violet-50 text-violet-700 border-violet-100',
  personalization: 'bg-lime-50 text-lime-700 border-lime-100',
  blaming: 'bg-rose-50 text-rose-800 border-rose-200',
  // 严重度 4
  should_statements: 'bg-teal-50 text-teal-700 border-teal-100',
  heavens_reward_fallacy: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  fallacy_of_change: 'bg-blue-50 text-blue-700 border-blue-100',
  control_fallacy: 'bg-slate-50 text-slate-700 border-slate-100',
  always_being_right: 'bg-purple-50 text-purple-700 border-purple-100',
}

export default function FeedbackCard({ feedback, entry }) {
  if (!feedback) return null

  const tier = scoreTier(feedback.score)
  const isV2 = !!(feedback.thoughtRecord || feedback.socraticQuestions)
  const {
    biases = [],
    thoughtRecord,
    socraticQuestions = [],
    decatastrophizing,
    defusion,
    reframe = '',
    summary = '',
    score = 0,
    engineVersion,
  } = feedback

  // v1 兼容字段
  const v1Evidence = feedback.evidence || {}
  const v1Perspectives = feedback.perspectives || []
  const v1Challenges = feedback.challenges || []

  return (
    <div className="space-y-3 animate-fade-in">
      {/* ═══════════════ 顶部：分数 + 一句话总结 ═══════════════ */}
      <Card className={`p-4 ${tier.bg} ${tier.border}`}>
        <div className="flex items-start gap-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.from} ${tier.to} text-white flex flex-col items-center justify-center shadow-lg shadow-black/5 flex-shrink-0`}>
            <span className="text-2xl font-bold leading-none">{score}</span>
            <span className="text-[10px] opacity-90 mt-0.5">{tier.label}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Icon name="brainCircuit" size={14} className={tier.text} />
              <span className={`text-xs font-semibold ${tier.text}`}>认知健康度评估</span>
              {engineVersion && (
                <span className="text-[10px] text-slate-400 font-mono ml-auto">
                  {engineVersion}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      </Card>

      {/* ═══════════════ 命中的认知偏差 ═══════════════ */}
      {biases.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Icon name="alertTriangle" size={14} className="text-rose-500" />
            <span className="text-xs font-semibold text-slate-700">
              检测到 {biases.length} 处 Burns 认知偏差（按严重度排序）
            </span>
          </div>
          {biases.map((b, i) => (
            <div key={b.key + i} className={`p-3 rounded-2xl border ${BIAS_COLOR_MAP[b.key] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold">{b.name}</span>
                {typeof b.severity === 'number' && (
                  <span className="text-[10px] font-semibold opacity-70">
                    严重度 {b.severity}/10
                  </span>
                )}
                {b.source && (
                  <span className="text-[9px] font-mono opacity-60 ml-auto">
                    {b.source}
                  </span>
                )}
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

      {/* ═══════════════ [v2] Defusion 认知解离（情绪劫持时置顶） ═══════════════ */}
      {isV2 && defusion && (
        <Card className="p-4 bg-gradient-to-br from-purple-50/60 to-white border border-purple-100/70">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="sparkles" size={14} className="text-purple-500" />
            <span className="text-xs font-semibold text-slate-700">{defusion.section}</span>
            <span className="text-[10px] text-purple-500 ml-auto font-semibold">
              ACT 临床 · 先做这个！
            </span>
          </div>
          <ol className="space-y-2.5">
            {defusion.exercises.map((ex, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[13px] text-slate-700 leading-relaxed flex-1">{ex}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* ═══════════════ [v2] Decatastrophizing 去灾难化 ═══════════════ */}
      {isV2 && decatastrophizing && (
        <Card className="p-4 bg-gradient-to-br from-orange-50/60 to-white border border-orange-100/70">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="shieldAlert" size={14} className="text-orange-500" />
            <span className="text-xs font-semibold text-slate-700">{decatastrophizing.section}</span>
            <span className="text-[10px] text-orange-600 ml-auto font-semibold">
              Quirk App · 标准算法
            </span>
          </div>
          <div className="space-y-3">
            {decatastrophizing.steps.map(s => (
              <div key={s.key} className="p-3 rounded-xl bg-white border border-orange-100">
                <p className="text-[12.5px] font-bold text-orange-700 mb-1.5">{s.label}</p>
                <p className="text-[13px] text-slate-700 leading-relaxed">{s.prompt}</p>
                {s.examples && s.examples.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {s.examples.map((ex, i) => (
                      <p key={i} className="text-[11.5px] text-slate-500 pl-3 border-l-2 border-orange-200 leading-relaxed">
                        {ex}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════════ [v2] Burns 7 栏 Thought Record ═══════════════ */}
      {isV2 && thoughtRecord && (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 mb-3.5">
            <Icon name="bookOpenCheck" size={14} className="text-primary-500" />
            <span className="text-xs font-semibold text-slate-700">{thoughtRecord.section}</span>
            <span className="text-[10px] text-primary-600 ml-auto font-semibold">
              Sanctum · 临床通用模板
            </span>
          </div>
          <div className="space-y-2.5">
            {thoughtRecord.steps.map(step => (
              <div key={step.key} className="p-3 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50/50 to-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {step.key}
                  </span>
                  <span className="text-[12.5px] font-bold text-slate-700">{step.label}</span>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed">{step.prompt}</p>
                {step.examples && step.examples.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10.5px] text-slate-400 uppercase tracking-wide font-semibold">参考输出 / 已识别</p>
                    {step.examples.map((ex, i) => (
                      <p key={i} className="text-[12px] text-slate-600 leading-relaxed pl-3 border-l-2 border-primary-200 bg-white/60 rounded-r py-1.5 pr-2">
                        {ex}
                      </p>
                    ))}
                  </div>
                )}
                {step.template && (
                  <div className="mt-2 whitespace-pre-line text-[12px] text-slate-600 leading-relaxed pl-3 border-l-2 border-primary-300 bg-primary-50/40 rounded-r py-2 pr-2 font-mono text-[11.5px]">
                    {step.template}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════════ [v1 兼容] 证据检验 ═══════════════ */}
      {!isV2 && (v1Evidence.support?.length > 0 || v1Evidence.against?.length > 0) && (
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
                {v1Evidence.support.map((s, i) => (
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
                {v1Evidence.against.map((s, i) => (
                  <li key={i} className="text-[12.5px] text-slate-600 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-rose-400">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* ═══════════════ [v1 兼容] 替代视角 ═══════════════ */}
      {!isV2 && v1Perspectives.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="eye" size={14} className="text-primary-500" />
            <span className="text-xs font-semibold text-slate-700">换个视角看这件事</span>
          </div>
          <div className="space-y-2.5">
            {v1Perspectives.map((p, i) => (
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

      {/* ═══════════════ [v2] 苏格拉底 6 问 ═══════════════ */}
      {isV2 && socraticQuestions.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-amber-50/50 to-white border border-amber-100/70">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="messageCircleQuestion" size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">苏格拉底 6 问 · 认真回答（别跳过）</span>
            <span className="text-[10px] text-amber-600 ml-auto font-semibold">
              Sanctum · socratic_questions
            </span>
          </div>
          <ol className="space-y-3">
            {socraticQuestions.map((q, i) => (
              <li key={q.key} className="flex gap-2.5 items-start p-2.5 rounded-xl bg-white/80 border border-amber-100/60">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[13px] text-slate-700 leading-relaxed flex-1">
                  {q.question}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* ═══════════════ [v1 兼容] 建设性追问 ═══════════════ */}
      {!isV2 && v1Challenges.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Icon name="messageCircleQuestion" size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">认真回答下面这些问题（别跳过）</span>
          </div>
          <ol className="space-y-2.5">
            {v1Challenges.map((c, i) => (
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

      {/* ═══════════════ 重新表述 ═══════════════ */}
      {reframe && (
        <Card className="p-4 bg-gradient-to-br from-violet-50/60 to-white border border-violet-100/60">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Icon name="pencilRuler" size={14} className="text-violet-500" />
            <span className="text-xs font-semibold text-slate-700">试试这样重新表述</span>
            <span className="text-[10px] text-violet-500 ml-auto font-semibold">
              Burns 标准句式
            </span>
          </div>
          <div className="whitespace-pre-line text-[13.5px] text-slate-700 leading-relaxed pl-3 border-l-2 border-violet-300">
            {reframe}
          </div>
        </Card>
      )}
    </div>
  )
}
