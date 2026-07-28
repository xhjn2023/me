import { useState, useEffect, useMemo, useCallback } from 'react'
import * as medicine from '../db/medicineStore'

const ACTION_LABELS = {
  checkin: '打卡',
  uncheckin: '取消打卡',
  quantity_update: '余量修改',
  bottle_change: '瓶号修改',
  bottle_switch: '换新瓶',
  settings_update: '设置更新'
}

export default function Medicine() {
  // ─── 状态：全部从 localStorage 读取 ───
  const [state, setState] = useState(() => medicine.getState())
  const [streak, setStreak] = useState(() => medicine.getStreak())
  const [totalDays, setTotalDays] = useState(() => medicine.getTotalCheckinDays())
  const [checkedToday, setCheckedToday] = useState(() => medicine.isCheckedToday())
  const [logs, setLogs] = useState(() => medicine.getLogs())
  const [bottles, setBottles] = useState(() => medicine.getBottles())
  const [checkins, setCheckins] = useState(() => medicine.getCheckins())

  const [tab, setTab] = useState('checkin') // checkin | bottles | logs
  const [showSettings, setShowSettings] = useState(false)
  const [showEditRemaining, setShowEditRemaining] = useState(false)
  const [toast, setToast] = useState(null)

  // 统一刷新：从 store 重新拉取所有数据
  const refreshAll = useCallback(() => {
    setState(medicine.getState())
    setStreak(medicine.getStreak())
    setTotalDays(medicine.getTotalCheckinDays())
    setCheckedToday(medicine.isCheckedToday())
    setLogs(medicine.getLogs())
    setBottles(medicine.getBottles())
    setCheckins(medicine.getCheckins())
  }, [])

  // 首次进入初始化瓶次记录
  useEffect(() => {
    medicine.initMedicine()
    refreshAll()
  }, [refreshAll])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function handleCheckin() {
    const res = medicine.checkinToday()
    if (!res.ok) { showToast(res.reason); return }
    refreshAll()
    showToast('打卡成功，记得吃药哦')
  }

  function handleUncheckin() {
    medicine.uncheckinToday()
    refreshAll()
    showToast('已取消今日打卡')
  }

  function handleSwitchBottle() {
    if (!window.confirm(`确认第${state.bottleNumber}瓶已吃完，开启下一瓶？`)) return
    medicine.switchToNextBottle()
    refreshAll()
    showToast(`已开启第${state.bottleNumber + 1}瓶`)
  }

  // 派生值
  const finishDate = useMemo(() => medicine.estimateFinishDate(state), [state])
  const low = useMemo(() => medicine.isLowSupply(state), [state])
  const progress = state.pillsPerBottle > 0
    ? Math.min(100, Math.round((state.remainingPills / state.pillsPerBottle) * 100))
    : 0
  const sortedCheckinDates = useMemo(
    () => Object.keys(checkins).sort((a, b) => (a < b ? 1 : -1)),
    [checkins]
  )

  return (
    <div className="animate-fade-in pb-24">
      {/* 顶部标题区 */}
      <div className="bg-gradient-to-br from-rose-400 to-pink-400 p-5 text-white rounded-b-3xl">
        <div>
          <h1 className="text-xl font-bold">用药提醒</h1>
          <p className="text-sm text-white/85 mt-0.5">每日坚持，健康相伴</p>
        </div>
      </div>

      {/* 低量提醒 */}
      {low && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 animate-fade-in">
          <span className="text-lg">⚠️</span>
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
        <div className="bg-white rounded-3xl p-5 card-shadow flex items-center gap-4">
          <button
            onClick={checkedToday ? handleUncheckin : handleCheckin}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl btn-press flex-shrink-0 transition-colors ${
              checkedToday
                ? 'bg-rose-400 text-white'
                : 'bg-rose-50 text-rose-300 border-2 border-dashed border-rose-200'
            }`}
            aria-label={checkedToday ? '取消今日打卡' : '今日打卡'}
          >
            {checkedToday ? '✓' : '💊'}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500">
              {checkedToday ? '今日已服药' : '今日还未服药'}
            </p>
            <p className="text-lg font-bold text-sky-800 mt-0.5">
              连续 {streak} 天
            </p>
            <p className="text-xs text-gray-400 mt-0.5">累计打卡 {totalDays} 天</p>
          </div>
        </div>
      </div>

      {/* 当前药瓶卡片 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">当前药瓶</span>
            <button
              onClick={() => setShowSettings(s => !s)}
              className="text-xs text-rose-400 btn-press"
            >
              {showSettings ? '收起设置' : '设置'}
            </button>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-bold text-rose-500">第 {state.bottleNumber} 瓶</p>
              <p className="text-xs text-gray-400 mt-1">
                剩余 {state.remainingPills} / {state.pillsPerBottle} 颗
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">预计吃完</p>
              <p className="text-sm font-medium text-sky-700">{finishDate || '—'}</p>
            </div>
          </div>

          {/* 余量进度条 */}
          <div className="h-2.5 bg-rose-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-300 to-rose-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowEditRemaining(true)}
              className="flex-1 py-2.5 bg-rose-50 text-rose-500 rounded-xl text-sm font-medium btn-press"
            >
              修改余量
            </button>
            <button
              onClick={handleSwitchBottle}
              className="flex-1 py-2.5 bg-rose-400 text-white rounded-xl text-sm font-medium btn-press"
            >
              换新瓶
            </button>
          </div>

          {/* 设置面板 */}
          {showSettings && (
            <SettingsPanel
              state={state}
              onChange={patch => {
                medicine.updateSettings(patch)
                refreshAll()
                showToast('设置已保存')
              }}
            />
          )}
        </div>
      </div>

      {/* 历史记录卡片 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl card-shadow overflow-hidden">
          <div className="flex">
            {[
              { key: 'checkin', label: '打卡记录' },
              { key: 'bottles', label: '瓶次记录' },
              { key: 'logs', label: '操作日志' }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  tab === t.key
                    ? 'text-rose-500 border-b-2 border-rose-400'
                    : 'text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {tab === 'checkin' && <CheckinHistory dates={sortedCheckinDates} />}
            {tab === 'bottles' && (
              <BottleHistory bottles={bottles} currentNo={state.bottleNumber} />
            )}
            {tab === 'logs' && <LogsView logs={logs} />}
          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 bg-black/70 text-white text-sm px-4 py-2 rounded-full z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* 修改余量弹层 */}
      {showEditRemaining && (
        <EditRemainingModal
          current={state.remainingPills}
          max={9999}
          onClose={() => setShowEditRemaining(false)}
          onSave={val => {
            medicine.setRemainingPills(val)
            refreshAll()
            setShowEditRemaining(false)
            showToast('余量已更新')
          }}
        />
      )}
    </div>
  )
}

// ─── 设置面板子组件 ───
function SettingsPanel({ state, onChange }) {
  const [pillsPerBottle, setPillsPerBottle] = useState(state.pillsPerBottle)
  const [dailyDose, setDailyDose] = useState(state.dailyDose)
  const [lowThreshold, setLowThreshold] = useState(state.lowThreshold)

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fade-in">
      <SettingRow label="单瓶标准颗数">
        <input
          type="number"
          min="1"
          value={pillsPerBottle}
          onChange={e => setPillsPerBottle(e.target.value)}
          className="w-20 px-2 py-1 bg-rose-50 rounded-lg text-sm text-right focus:outline-none focus:bg-rose-100"
        />
      </SettingRow>
      <SettingRow label="每日服药颗数">
        <input
          type="number"
          min="1"
          value={dailyDose}
          onChange={e => setDailyDose(e.target.value)}
          className="w-20 px-2 py-1 bg-rose-50 rounded-lg text-sm text-right focus:outline-none focus:bg-rose-100"
        />
      </SettingRow>
      <SettingRow label="低量提醒阈值">
        <input
          type="number"
          min="0"
          value={lowThreshold}
          onChange={e => setLowThreshold(e.target.value)}
          className="w-20 px-2 py-1 bg-rose-50 rounded-lg text-sm text-right focus:outline-none focus:bg-rose-100"
        />
      </SettingRow>
      <button
        onClick={() =>
          onChange({ pillsPerBottle, dailyDose, lowThreshold })
        }
        className="w-full py-2.5 bg-rose-400 text-white rounded-xl text-sm font-medium btn-press"
      >
        保存设置
      </button>
    </div>
  )
}

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {children}
    </div>
  )
}

// ─── 打卡历史 ───
function CheckinHistory({ dates }) {
  if (dates.length === 0) {
    return <EmptyHint text="还没有打卡记录" emoji="🌱" />
  }
  return (
    <div className="space-y-2">
      {dates.map(date => (
        <div
          key={date}
          className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-400 flex items-center justify-center text-xs">
              ✓
            </span>
            <span className="text-sm text-gray-700">{date}</span>
          </div>
          <span className="text-xs text-gray-400">已打卡</span>
        </div>
      ))}
    </div>
  )
}

// ─── 瓶次历史 ───
function BottleHistory({ bottles, currentNo }) {
  if (bottles.length === 0) {
    return <EmptyHint text="暂无瓶次记录" emoji="📦" />
  }
  return (
    <div className="space-y-2">
      {bottles.map(b => {
        const isCurrent = b.bottleNumber === currentNo && !b.finishedAt
        return (
          <div
            key={b.bottleNumber}
            className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💊</span>
              <div>
                <p className="text-sm text-gray-700">
                  第 {b.bottleNumber} 瓶
                  {isCurrent && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-rose-100 text-rose-500 rounded text-xs">
                      当前
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {b.startedAt} → {b.finishedAt || '服用中'}
                </p>
              </div>
            </div>
            <span className="text-xs text-gray-400">{b.totalPills}颗</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── 操作日志 ───
function LogsView({ logs }) {
  if (logs.length === 0) {
    return <EmptyHint text="暂无操作日志" emoji="📝" />
  }
  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
          <span className="text-xs px-1.5 py-0.5 bg-rose-100 text-rose-500 rounded mt-0.5 flex-shrink-0">
            {ACTION_LABELS[log.action] || log.action}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 break-words">{log.note}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {log.date} {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── 空状态提示 ───
function EmptyHint({ text, emoji }) {
  return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}

// ─── 修改余量弹层（带输入校验） ───
function EditRemainingModal({ current, max, onClose, onSave }) {
  const [value, setValue] = useState(String(current))
  const [error, setError] = useState('')

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
    if (n > max) {
      setError(`不能超过 ${max}`)
      return
    }
    onSave(n)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl p-5 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-sky-800">修改剩余药片</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">✕</button>
        </div>
        <input
          type="number"
          min="0"
          autoFocus
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:bg-gray-100 ${
            error ? 'border border-red-300' : ''
          }`}
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium btn-press"
          >
            取消
          </button>
          <button
            onClick={submit}
            className="flex-1 py-2.5 bg-rose-400 text-white rounded-xl text-sm font-medium btn-press"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
