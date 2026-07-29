import { useState, useEffect, useMemo, useCallback } from 'react'
import * as medicine from '../db/medicineStore'
import {
  PageHeader, Card, Button, Input, Chip, BottomSheet, ProgressBar,
  EmptyState, LoadingState, Icon, showToast, ConfirmDialog
} from '../components/ui'

const ACTION_LABELS = {
  checkin: '打卡',
  uncheckin: '取消打卡',
  quantity_update: '余量修改',
  bottle_change: '瓶号修改',
  bottle_switch: '换新瓶',
  settings_update: '设置更新'
}

const TABS = [
  { key: 'checkin', label: '打卡记录' },
  { key: 'bottles', label: '瓶次记录' },
  { key: 'logs', label: '操作日志' }
]

export default function Medicine() {
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState(null)
  const [checkins, setCheckins] = useState({})
  const [logs, setLogs] = useState([])
  const [bottles, setBottles] = useState([])

  const [tab, setTab] = useState('checkin')
  const [showSettings, setShowSettings] = useState(false)
  const [showEditRemaining, setShowEditRemaining] = useState(false)
  const [confirmSwitch, setConfirmSwitch] = useState(false)

  // 统一刷新：从 Supabase 重新拉取所有数据
  const refreshAll = useCallback(async () => {
    const [st, ck, lg, bt] = await Promise.all([
      medicine.getState(),
      medicine.getCheckins(),
      medicine.getLogs(),
      medicine.getBottles()
    ])
    setState(st)
    setCheckins(ck)
    setLogs(lg)
    setBottles(bt)
    setLoading(false)
  }, [])

  // 首次进入初始化 + 加载数据
  useEffect(() => {
    medicine.initMedicine().then(refreshAll).catch(err => {
      console.error('用药模块加载失败:', err)
      setLoading(false)
    })
  }, [refreshAll])

  async function handleCheckin() {
    const res = await medicine.checkinToday()
    if (!res.ok) { showToast(res.reason, 'error'); return }
    await refreshAll()
    showToast('打卡成功，记得吃药哦', 'success')
  }

  async function handleUncheckin() {
    await medicine.uncheckinToday()
    await refreshAll()
    showToast('已取消今日打卡', 'info')
  }

  async function doSwitchBottle() {
    if (!state) return
    const prevBottle = state.bottleNumber
    await medicine.switchToNextBottle()
    await refreshAll()
    showToast(`已开启第${prevBottle + 1}瓶`, 'success')
  }

  // 派生值
  const checkedToday = useMemo(() => {
    const today = new Date()
    const tz = today.getTimezoneOffset() * 60000
    const todayKey = new Date(today - tz).toISOString().slice(0, 10)
    return Boolean(checkins[todayKey])
  }, [checkins])

  const streak = useMemo(() => medicine.computeStreak(checkins), [checkins])
  const totalDays = useMemo(() => Object.keys(checkins).length, [checkins])

  const finishDate = useMemo(() => {
    const d = medicine.estimateFinishDate(state, checkedToday)
    if (!d) return null
    const dt = new Date(d)
    return `${dt.getMonth() + 1}月${dt.getDate()}日`
  }, [state, checkedToday])

  const low = useMemo(() => medicine.isLowSupply(state), [state])
  const progress = state && state.pillsPerBottle > 0
    ? Math.min(100, Math.round((state.remainingPills / state.pillsPerBottle) * 100))
    : 0
  const sortedCheckinDates = useMemo(
    () => Object.keys(checkins).sort((a, b) => (a < b ? 1 : -1)),
    [checkins]
  )

  if (loading || !state) {
    return (
      <div className="animate-fade-in pb-24">
        <PageHeader
          title="用药提醒"
          subtitle="每日坚持，健康相伴"
          accent="medicine"
          icon="pill"
        />
        <div className="px-4 mt-4">
          <Card className="p-4">
            <LoadingState text="加载用药数据..." />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        title="用药提醒"
        subtitle="每日坚持，健康相伴"
        accent="medicine"
        icon="pill"
      />

      {/* 低量提醒 */}
      {low && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 animate-fade-in">
          <span className="text-amber-500 mt-0.5 flex-shrink-0">
            <Icon name="alertCircle" size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm text-amber-700 font-medium">药量不足</p>
            <p className="text-xs text-amber-600 mt-0.5">
              当前剩余 {state.remainingPills} 颗，建议尽快购药补货
            </p>
          </div>
        </div>
      )}

      {/* 今日打卡卡片 */}
      <div className="px-4 mt-4">
        <Card className="p-5 flex items-center gap-4">
          <button
            onClick={checkedToday ? handleUncheckin : handleCheckin}
            className={`w-20 h-20 rounded-full flex items-center justify-center btn-press flex-shrink-0 transition-colors ${
              checkedToday
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-rose-50 text-rose-300 border-2 border-dashed border-rose-200'
            }`}
            aria-label={checkedToday ? '取消今日打卡' : '今日打卡'}
          >
            <Icon name={checkedToday ? 'check' : 'pill'} size={28} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500">
              {checkedToday ? '今日已服药' : '今日还未服药'}
            </p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              连续 {streak} 天
            </p>
            <p className="text-xs text-slate-400 mt-0.5">累计打卡 {totalDays} 天</p>
          </div>
        </Card>
      </div>

      {/* 当前药瓶卡片 */}
      <div className="px-4 mt-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">当前药瓶</span>
            <Button
              variant="ghost"
              size="sm"
              icon="settings"
              onClick={() => setShowSettings(true)}
              className="text-rose-500 hover:bg-rose-50"
            >
              设置
            </Button>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-bold text-rose-500">第 {state.bottleNumber} 瓶</p>
              <p className="text-xs text-slate-400 mt-1">
                剩余 {state.remainingPills} / {state.pillsPerBottle} 颗
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">预计吃完</p>
              <p className="text-sm font-medium text-slate-700">{finishDate || '—'}</p>
            </div>
          </div>

          {/* 余量进度条 */}
          <ProgressBar value={progress} color="rose" showLabel />

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              size="md"
              className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 active:bg-rose-200"
              onClick={() => setShowEditRemaining(true)}
              icon="edit"
            >
              修改余量
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 shadow-rose-500/20"
              onClick={() => setConfirmSwitch(true)}
              icon="refreshCw"
            >
              换新瓶
            </Button>
          </div>
        </Card>
      </div>

      {/* 历史记录卡片 */}
      <div className="px-4 mt-4">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <Chip
                key={t.key}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
                color="rose"
              >
                {t.label}
              </Chip>
            ))}
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {tab === 'checkin' && <CheckinHistory dates={sortedCheckinDates} />}
            {tab === 'bottles' && (
              <BottleHistory bottles={bottles} currentNo={state.bottleNumber} />
            )}
            {tab === 'logs' && <LogsView logs={logs} />}
          </div>
        </Card>
      </div>

      {/* 设置面板 BottomSheet */}
      <BottomSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="用药设置"
      >
        <SettingsPanel
          state={state}
          onChange={async patch => {
            await medicine.updateSettings(patch)
            await refreshAll()
            setShowSettings(false)
            showToast('设置已保存', 'success')
          }}
        />
      </BottomSheet>

      {/* 修改余量弹层 BottomSheet */}
      <EditRemainingSheet
        open={showEditRemaining}
        current={state.remainingPills}
        onClose={() => setShowEditRemaining(false)}
        onSave={async val => {
          await medicine.setRemainingPills(val)
          await refreshAll()
          setShowEditRemaining(false)
          showToast('余量已更新', 'success')
        }}
      />

      {/* 换新瓶确认 */}
      <ConfirmDialog
        open={confirmSwitch}
        onClose={() => setConfirmSwitch(false)}
        onConfirm={doSwitchBottle}
        title="换新瓶"
        message={`确认第 ${state.bottleNumber} 瓶已吃完，开启下一瓶？`}
        confirmText="确认换瓶"
        danger={false}
      />
    </div>
  )
}

// ─── 设置面板子组件 ───
function SettingsPanel({ state, onChange }) {
  const [pillsPerBottle, setPillsPerBottle] = useState(state.pillsPerBottle)
  const [dailyDose, setDailyDose] = useState(state.dailyDose)
  const [lowThreshold, setLowThreshold] = useState(state.lowThreshold)

  return (
    <div className="space-y-4">
      <Input
        label="单瓶标准颗数"
        type="number"
        min="1"
        value={pillsPerBottle}
        onChange={e => setPillsPerBottle(e.target.value)}
      />
      <Input
        label="每日服药颗数"
        type="number"
        min="1"
        value={dailyDose}
        onChange={e => setDailyDose(e.target.value)}
      />
      <Input
        label="低量提醒阈值"
        type="number"
        min="0"
        value={lowThreshold}
        onChange={e => setLowThreshold(e.target.value)}
      />
      <Button
        variant="primary"
        className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 shadow-rose-500/20 mt-2"
        icon="check"
        onClick={() => onChange({ pillsPerBottle, dailyDose, lowThreshold })}
      >
        保存设置
      </Button>
    </div>
  )
}

// ─── 打卡历史 ───
function CheckinHistory({ dates }) {
  if (dates.length === 0) {
    return (
      <EmptyState
        icon="checkCircle"
        title="还没有打卡记录"
        description="坚持每日打卡，养成好习惯"
      />
    )
  }
  return (
    <div className="space-y-2">
      {dates.map(date => (
        <div
          key={date}
          className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
              <Icon name="check" size={14} />
            </span>
            <span className="text-sm text-slate-700">{date}</span>
          </div>
          <span className="text-xs text-slate-400">已打卡</span>
        </div>
      ))}
    </div>
  )
}

// ─── 瓶次历史 ───
function BottleHistory({ bottles, currentNo }) {
  if (bottles.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="暂无瓶次记录"
        description="换新瓶后将自动记录"
      />
    )
  }
  return (
    <div className="space-y-2">
      {bottles.map(b => {
        const isCurrent = b.bottleNumber === currentNo && !b.finishedAt
        return (
          <div
            key={b.bottleNumber}
            className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                <Icon name="pill" size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-700 flex items-center gap-1.5">
                  第 {b.bottleNumber} 瓶
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-500 rounded text-xs font-medium">
                      当前
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {b.startedAt} → {b.finishedAt || '服用中'}
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">{b.totalPills}颗</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── 操作日志 ───
function LogsView({ logs }) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon="history"
        title="暂无操作日志"
        description="所有操作将自动记录在此"
      />
    )
  }
  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl">
          <span className="text-xs px-1.5 py-0.5 bg-rose-100 text-rose-500 rounded mt-0.5 flex-shrink-0 font-medium">
            {ACTION_LABELS[log.action] || log.action}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 break-words">{log.note}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {log.date} {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── 修改余量弹层（带输入校验）───
function EditRemainingSheet({ open, current, onClose, onSave }) {
  const [value, setValue] = useState(String(current))
  const [error, setError] = useState('')

  // 每次打开时重置为当前值
  useEffect(() => {
    if (open) {
      setValue(String(current))
      setError('')
    }
  }, [open, current])

  function submit() {
    const n = Number(value)
    if (value === '' || Number.isNaN(n)) {
      setError('请输入有效数字')
      return
    }
    if (n < 0) {
      setError('剩余药片数量不能为负数')
      return
    }
    if (n > 9999) {
      setError('不能超过 9999')
      return
    }
    onSave(n)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="修改剩余药片"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 shadow-rose-500/20"
            onClick={submit}
            icon="check"
          >
            保存
          </Button>
        </div>
      }
    >
      <Input
        type="number"
        min="0"
        autoFocus
        value={value}
        onChange={e => { setValue(e.target.value); setError('') }}
        onKeyDown={e => e.key === 'Enter' && submit()}
        error={error}
        placeholder="请输入剩余药片数量"
        icon="pill"
      />
    </BottomSheet>
  )
}
