import { useState, useEffect } from 'react'
import { dailyRecordsApi, weeklyReviewsApi, todayStr } from '../../db/database'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  Card, Button, Icon, LoadingState, ErrorState, BottomSheet, showToast, ConfirmDialog
} from '../../components/ui'
import {
  normalizeDailyRecord, isRecordFilled, getMonday, getWeekDates,
  weekRangeLabel, weekNumberLabel, prevWeek, nextWeek,
  aggregateWeek, buildReviewDraft, moodOf, expensesTotal
} from '../../db/lifeStore'

// 生活模块「每周复盘」：自动汇总本周每日记录，辅助生成亮点/问题/改进
export default function WeeklyTab() {
  const [weekMonday, setWeekMonday] = useState(() => getMonday(todayStr()))
  const [editorOpen, setEditorOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const weekDates = getWeekDates(weekMonday)
  const weekEnd = weekDates[6]

  // 本周每日记录
  const { data: records, loading, error, refresh } = useAsyncData(
    () => dailyRecordsApi.getByRange(weekMonday, weekEnd).catch(() => []),
    [weekMonday]
  )
  const dailyList = (records || []).map(normalizeDailyRecord).filter(Boolean)

  // 本周复盘
  const { data: review } = useAsyncData(
    () => weeklyReviewsApi.getByWeek(weekMonday).catch(() => null),
    [weekMonday, editorOpen]
  )

  const agg = aggregateWeek(dailyList, weekMonday)
  const isCurrentWeek = weekMonday === getMonday(todayStr())

  function shift(direction) {
    setWeekMonday(direction < 0 ? prevWeek(weekMonday) : nextWeek(weekMonday))
  }

  async function handleDelete() {
    if (!review?.id) return
    try {
      await weeklyReviewsApi.delete(review.id)
      setConfirmDelete(false)
      refresh()
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已删除', 'success')
    } catch {
      showToast('删除失败', 'error')
    }
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* 周导航标题栏 */}
      <header className="mx-4 mt-2 px-4 pt-4 pb-3 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-emerald-50 border border-teal-100/60 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-teal-600 flex-shrink-0">
              <Icon name="clipboardList" size={18} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">每周复盘</h1>
              <p className="text-xs text-slate-500 mt-0.5">回顾一周，持续改进</p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full font-medium bg-teal-500/10 text-teal-600 whitespace-nowrap">
            {weekNumberLabel(weekMonday)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-teal-100/60">
          <button onClick={() => shift(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition" aria-label="上一周">
            <Icon name="chevronLeft" size={16} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{weekRangeLabel(weekMonday)}</p>
            {isCurrentWeek && <p className="text-[11px] text-teal-500 mt-0.5">本周</p>}
          </div>
          <button onClick={() => shift(1)} disabled={isCurrentWeek} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="下一周">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </header>

      {/* 本周汇总统计 */}
      <div className="px-4 mt-4">
        {loading ? (
          <Card className="p-4"><LoadingState /></Card>
        ) : error ? (
          <Card className="p-4"><ErrorState message="加载失败，请检查网络" onRetry={refresh} /></Card>
        ) : agg.recordedDays === 0 ? (
          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center text-teal-400 mb-3 border border-teal-100">
              <Icon name="clipboardList" size={28} />
            </div>
            <p className="text-base font-medium text-slate-600">本周暂无每日记录</p>
            <p className="text-sm text-slate-400 mt-1">先去「每日记录」填写，复盘会自动汇总</p>
          </Card>
        ) : (
          <>
            {/* 统计卡片 2x2 */}
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard icon="calendar" label="记录天数" value={agg.recordedDays} unit="天" />
              <StatCard icon="clock" label="有效投入" value={agg.totalHours} unit="小时" />
              <StatCard icon="zap" label="平均精力" value={agg.avgEnergy || '—'} unit="/5" />
              <StatCard icon="wallet" label="本周开销" value={agg.totalExpense} unit="元" prefix="¥" />
            </div>

            {/* 情绪分布 */}
            {Object.values(agg.moodCounts).some(n => n > 0) && (
              <Card className="p-3 mt-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon name="smile" size={14} className="text-teal-500" />
                  <span className="text-xs font-semibold text-slate-500">本周情绪</span>
                </div>
                <div className="flex gap-1.5">
                  {Object.entries(agg.moodCounts).map(([key, n]) => {
                    const m = moodOf(key)
                    if (!n) return null
                    return (
                      <span key={key} className="flex-1 text-center py-1.5 rounded-lg bg-slate-50 text-xs">
                        <span className="block text-base leading-none">{m.emoji}</span>
                        <span className="text-slate-500">{n} 天</span>
                      </span>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* 本周每日摘要 */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Icon name="listChecks" size={14} className="text-teal-500" />
                  每日一览
                </h2>
              </div>
              <div className="space-y-1.5">
                {weekDates.map(d => {
                  const r = dailyList.find(x => x.date === d)
                  const filled = r && isRecordFilled(r)
                  const m = r ? moodOf(r.mood) : null
                  return (
                    <div key={d} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${filled ? 'bg-white border border-slate-100 shadow-sm' : 'bg-white/40 border border-dashed border-slate-200'}`}>
                      <span className={`text-xs font-medium w-14 flex-shrink-0 ${filled ? 'text-slate-600' : 'text-slate-300'}`}>
                        {d.slice(5).replace('-', '/')}
                      </span>
                      {filled ? (
                        <>
                          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                            {m && <span>{m.emoji}</span>}
                            {r.focusHours > 0 && <span className="text-teal-600 font-medium">{r.focusHours}h</span>}
                            <span className="truncate">
                              {r.doneItems?.split('\n').filter(Boolean)[0] || (r.tomorrowTask ? '已记录' : '')}
                            </span>
                          </div>
                          {r.expenses.length > 0 && <span className="text-[11px] text-slate-400 flex-shrink-0">¥{expensesTotal(r)}</span>}
                        </>
                      ) : (
                        <span className="flex-1 text-xs text-slate-300">未记录</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 本周复盘 */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Icon name="penLine" size={14} className="text-teal-500" />
            本周复盘
          </h2>
          <Button
            variant={review ? 'secondary' : 'primary'}
            size="sm"
            icon={review ? 'edit' : 'plus'}
            onClick={() => setEditorOpen(true)}
            className={review ? '' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'}
          >
            {review ? '编辑复盘' : '开始复盘'}
          </Button>
        </div>

        {review ? (
          <Card className="p-4">
            {review.highlights?.trim() && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon name="sparkles" size={14} className="text-amber-500" />
                  <span className="text-xs font-semibold text-slate-500">本周亮点</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{review.highlights}</p>
              </div>
            )}
            {review.problems?.trim() && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon name="alertCircle" size={14} className="text-rose-500" />
                  <span className="text-xs font-semibold text-slate-500">问题与模式</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{review.problems}</p>
              </div>
            )}
            {review.improvement?.trim() && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon name="target" size={14} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-500">下周改进的一件小事</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{review.improvement}</p>
              </div>
            )}
            <div className="flex justify-end mt-3 pt-2 border-t border-slate-100">
              <button onClick={() => setConfirmDelete(true)} className="text-xs text-slate-400 hover:text-rose-500 transition flex items-center gap-1">
                <Icon name="trash" size={12} /> 删除复盘
              </button>
            </div>
          </Card>
        ) : (
          !loading && agg.recordedDays > 0 && (
            <Card className="p-4 text-center">
              <p className="text-sm text-slate-500">本周有 {agg.recordedDays} 天记录，可一键生成复盘草稿</p>
              <Button variant="primary" size="sm" icon="sparkles" className="mt-3 bg-teal-500 hover:bg-teal-600 shadow-teal-500/20" onClick={() => setEditorOpen(true)}>
                开始复盘
              </Button>
            </Card>
          )
        )}
      </div>

      {/* 复盘编辑弹层 */}
      <WeeklyReviewEditor
        open={editorOpen}
        weekMonday={weekMonday}
        dailyList={dailyList}
        review={review}
        onClose={() => setEditorOpen(false)}
        onSaved={() => { setEditorOpen(false); refresh() }}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="删除本周复盘"
        message={`确定删除 ${weekRangeLabel(weekMonday)} 的复盘吗？此操作不可恢复。`}
        confirmText="删除"
      />
    </div>
  )
}

function StatCard({ icon, label, value, unit, prefix = '' }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={icon} size={14} className="text-teal-500" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-bold text-slate-800 tabular-nums">{prefix}{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
    </Card>
  )
}

// 复盘编辑弹层：亮点 / 问题 / 改进 + 一键带入草稿
function WeeklyReviewEditor({ open, weekMonday, dailyList, review, onClose, onSaved }) {
  const [highlights, setHighlights] = useState('')
  const [problems, setProblems] = useState('')
  const [improvement, setImprovement] = useState('')
  const [saving, setSaving] = useState(false)
  const [draftApplied, setDraftApplied] = useState(false)

  // 打开时初始化
  useEffect(() => {
    if (open) {
      setHighlights(review?.highlights || '')
      setProblems(review?.problems || '')
      setImprovement(review?.improvement || '')
      setDraftApplied(false)
    }
  }, [open, review])

  const agg = aggregateWeek(dailyList, weekMonday)

  function applyDraft() {
    const draft = buildReviewDraft(dailyList, weekMonday, {})
    if (draft.recordedDays === 0) {
      showToast('本周暂无每日记录可汇总', 'info')
      return
    }
    setHighlights(draft.highlights)
    setProblems(draft.problems)
    setDraftApplied(true)
    showToast('已根据每日记录生成草稿', 'success')
  }

  async function save() {
    if (!highlights.trim() && !problems.trim() && !improvement.trim()) {
      showToast('至少填写一项内容', 'error')
      return
    }
    setSaving(true)
    try {
      await weeklyReviewsApi.upsert({ week_start: weekMonday, highlights, problems, improvement })
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('复盘已保存', 'success')
      onSaved?.()
    } catch {
      showToast('保存失败，请检查网络', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`每周复盘 · ${weekRangeLabel(weekMonday)}`}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>取消</Button>
          <Button size="lg" className="flex-1 bg-teal-500 hover:bg-teal-600 shadow-teal-500/25" onClick={save} loading={saving}>
            保存
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 一键带入草稿 */}
        <button
          onClick={applyDraft}
          disabled={agg.recordedDays === 0}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition ${
            draftApplied
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-teal-50 text-teal-600 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          <Icon name="sparkles" size={15} />
          {draftApplied ? '草稿已生成，可继续编辑' : '一键根据本周记录生成草稿'}
        </button>

        <EditorField
          label="本周亮点回顾"
          icon="sparkles"
          value={highlights}
          onChange={setHighlights}
          placeholder="这周做成了什么？有哪些值得肯定的瞬间？"
        />
        <EditorField
          label="反复出现的问题与模式"
          icon="alertCircle"
          value={problems}
          onChange={setProblems}
          placeholder="哪些问题反复出现？背后的模式是什么？"
        />
        <EditorField
          label="下周计划改进的一件小事"
          icon="target"
          value={improvement}
          onChange={setImprovement}
          placeholder="只选一件最小、最可执行的事"
        />
      </div>
    </BottomSheet>
  )
}

function EditorField({ label, icon, value, onChange, placeholder }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon name={icon} size={14} className="text-teal-500" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-teal-50/50 border border-teal-100 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-500/15 transition resize-none"
      />
    </div>
  )
}
