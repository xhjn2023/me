import { useState } from 'react'
import { dailyRecordsApi, todayStr, formatDateCN } from '../../db/database'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  Card, Button, Icon, EmptyState, LoadingState, ErrorState, showToast, ConfirmDialog
} from '../../components/ui'
import {
  normalizeDailyRecord, isRecordFilled, expensesTotal,
  moodOf, energyLabel, shiftDate
} from '../../db/lifeStore'
import DailyEditor from './DailyEditor'
import NoteCalendar from './NoteCalendar'
import CognitionInsight from './CognitionInsight'

// 生活模块「每日记录」：结构化记录每天完成事项、投入时长、情绪精力、开销、明日计划
export default function DailyTab() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [editorOpen, setEditorOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 当前日期的记录
  const { data: record, loading, error, refresh } = useAsyncData(
    () => dailyRecordsApi.getByDate(selectedDate).catch(() => null),
    [selectedDate]
  )

  // 最近 30 天记录（历史列表）
  const start30 = shiftDate(todayStr(), -30)
  const { data: recent } = useAsyncData(
    () => dailyRecordsApi.getByRange(start30, todayStr()).catch(() => []),
    [editorOpen] // 保存后刷新
  )
  const recentList = (recent || [])
    .map(normalizeDailyRecord)
    .filter(r => r && r.date !== selectedDate && isRecordFilled(r))
    .reverse() // 最近日期在前

  const rec = record ? normalizeDailyRecord(record) : null
  const filled = isRecordFilled(rec)
  const isToday = selectedDate === todayStr()

  function shift(days) {
    const next = shiftDate(selectedDate, days)
    if (next > todayStr()) return
    setSelectedDate(next)
  }

  async function handleDelete() {
    if (!rec?.id) return
    try {
      await dailyRecordsApi.delete(rec.id)
      setConfirmDelete(false)
      refresh()
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已删除', 'success')
    } catch {
      showToast('删除失败', 'error')
    }
  }

  const mood = rec ? moodOf(rec.mood) : null

  return (
    <div className="animate-fade-in pb-24">
      {/* 日期导航标题栏 */}
      <header className="mx-4 mt-2 px-4 pt-4 pb-3 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-emerald-50 border border-teal-100/60 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-teal-600 flex-shrink-0">
              <Icon name="calendar" size={18} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">每日记录</h1>
              <p className="text-xs text-slate-500 mt-0.5">记录一天，看清一天</p>
            </div>
          </div>
          <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${filled ? 'bg-teal-500/10 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
            {filled ? '已记录' : '未记录'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-teal-100/60">
          <button onClick={() => shift(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition" aria-label="前一天">
            <Icon name="chevronLeft" size={16} />
          </button>
          <button onClick={() => setCalendarOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/70 transition">
            <Icon name="calendar" size={14} className="text-teal-600" />
            <span className="text-sm font-medium text-slate-700">{formatDateCN(selectedDate)}</span>
          </button>
          <button onClick={() => shift(1)} disabled={isToday} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition disabled:opacity-30 disabled:cursor-not-allowed" aria-label="后一天">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </header>

      {/* 当日记录卡片 / 空状态 */}
      <div className="px-4 mt-4">
        {error ? (
          <Card className="p-4"><ErrorState message="加载失败，请检查网络" onRetry={refresh} /></Card>
        ) : loading ? (
          <Card className="p-4"><LoadingState /></Card>
        ) : !filled ? (
          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center text-teal-400 mb-3 border border-teal-100">
              <Icon name="penLine" size={28} />
            </div>
            <p className="text-base font-medium text-slate-600">这一天还没有记录</p>
            <p className="text-sm text-slate-400 mt-1">花 1 分钟，记录完成的事与状态</p>
            <Button
              variant="primary"
              size="md"
              icon="plus"
              onClick={() => setEditorOpen(true)}
              className="mt-4 bg-teal-500 hover:bg-teal-600 shadow-teal-500/20"
            >
              开始记录
            </Button>
          </Card>
        ) : (
          <Card className="p-4">
            {/* 完成事项 */}
            {rec.doneItems?.trim() && (
              <Section icon="checkCircle" title="今天完成了什么">
                <ul className="space-y-1">
                  {rec.doneItems.split('\n').map((l, i) => l.trim() && (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-teal-400 flex-shrink-0" />
                      <span className="leading-relaxed">{l.trim()}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* 投入时长 + 情绪精力 */}
            {(rec.focusHours > 0 || rec.mood || rec.energy) && (
              <Section icon="flame" title="投入与状态">
                <div className="flex flex-wrap gap-2">
                  {rec.focusHours > 0 && (
                    <Pill icon="clock" className="text-teal-600 bg-teal-50">{rec.focusHours} 小时</Pill>
                  )}
                  {mood && (
                    <Pill icon="smile" className="text-slate-600 bg-slate-50">{mood.emoji} {mood.label}</Pill>
                  )}
                  {rec.energy > 0 && (
                    <Pill icon="zap" className="text-amber-600 bg-amber-50">精力 {energyLabel(rec.energy)}</Pill>
                  )}
                </div>
              </Section>
            )}

            {/* 开销明细 */}
            {rec.expenses.length > 0 && (
              <Section icon="wallet" title="当日开销">
                <ul className="space-y-1.5">
                  {rec.expenses.map((e, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{e.category || '其他'}</span>
                        {e.desc || '未备注'}
                      </span>
                      <span className="text-slate-700 font-medium tabular-nums">¥{Number(e.amount) || 0}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between text-sm pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500">合计</span>
                    <span className="text-teal-600 font-semibold tabular-nums">¥{expensesTotal(rec)}</span>
                  </li>
                </ul>
              </Section>
            )}

            {/* 明日最重要的事 */}
            {rec.tomorrowTask?.trim() && (
              <Section icon="target" title="明日最重要的一件事">
                <p className="text-sm text-slate-700 leading-relaxed">{rec.tomorrowTask}</p>
              </Section>
            )}

            {/* 认知重塑洞察 */}
            {rec.doneItems?.trim() && (
              <CognitionInsight
                text={rec.doneItems}
                historyTexts={recentList.map(r => r.doneItems).filter(Boolean)}
              />
            )}

            {/* 操作 */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" icon="edit" className="flex-1" onClick={() => setEditorOpen(true)}>
                编辑
              </Button>
              <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirmDelete(true)}>
                删除
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* 历史记录列表 */}
      {recentList.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Icon name="history" size={14} className="text-teal-500" />
              最近记录
            </h2>
          </div>
          <div className="space-y-2">
            {recentList.map(r => {
              const m = moodOf(r.mood)
              return (
                <Card
                  key={r.id || r.date}
                  className="p-3 cursor-pointer active:scale-[0.99] transition"
                  onClick={() => setSelectedDate(r.date)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{formatDateCN(r.date)}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      {r.focusHours > 0 && <span>{r.focusHours}h</span>}
                      {m && <span>{m.emoji}</span>}
                      {r.expenses.length > 0 && <span>¥{expensesTotal(r)}</span>}
                    </div>
                  </div>
                  {r.doneItems?.trim() && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.doneItems.split('\n').filter(Boolean).join(' · ')}</p>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 空态兜底：连历史都没有时的引导 */}
      {!loading && !filled && recentList.length === 0 && (
        <div className="px-4 mt-2">
          <EmptyState
            icon="calendar"
            title="还没有任何记录"
            description="从今天开始，养成每日记录的习惯"
          />
        </div>
      )}

      {/* 编辑弹层 */}
      <DailyEditor
        open={editorOpen}
        date={selectedDate}
        record={record}
        onClose={() => setEditorOpen(false)}
        onSaved={() => { setEditorOpen(false); refresh() }}
      />

      {/* 日历弹窗 */}
      <NoteCalendar
        open={calendarOpen}
        date={selectedDate}
        onClose={() => setCalendarOpen(false)}
        onSelect={d => { setSelectedDate(d); setCalendarOpen(false) }}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="删除这条记录"
        message={`确定删除 ${formatDateCN(selectedDate)} 的记录吗？此操作不可恢复。`}
        confirmText="删除"
      />
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={icon} size={14} className="text-teal-500" />
        <span className="text-xs font-semibold text-slate-500">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Pill({ icon, className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${className}`}>
      <Icon name={icon} size={12} />
      {children}
    </span>
  )
}
