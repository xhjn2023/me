import { useState, useEffect } from 'react'
import { BottomSheet, Button, Icon, showToast } from '../../components/ui'
import { dailyRecordsApi } from '../../db/database'
import {
  MOODS, ENERGY_LEVELS, EXPENSE_CATEGORIES, FOCUS_PRESETS,
  emptyDailyRecord, normalizeDailyRecord, serializeDailyRecord, validateDailyRecord
} from '../../db/lifeStore'

// 结构化每日记录编辑弹层：
// 今天完成了什么 / 有效投入时长 / 情绪与精力 / 当日开销明细 / 明日最重要的一件事
export default function DailyEditor({ open, date, record, onClose, onSaved }) {
  const [form, setForm] = useState(() => emptyDailyRecord(date))
  const [saving, setSaving] = useState(false)

  // 打开时初始化表单（新记录 or 载入已有记录）
  useEffect(() => {
    if (open) {
      const rec = record ? normalizeDailyRecord(record) : emptyDailyRecord(date)
      setForm(rec)
    }
  }, [open, date, record])

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // 开销明细增删改
  function addExpense() {
    setForm(f => ({ ...f, expenses: [...f.expenses, { desc: '', amount: '', category: EXPENSE_CATEGORIES[0] }] }))
  }
  function updateExpense(i, patch) {
    setForm(f => ({
      ...f,
      expenses: f.expenses.map((e, idx) => idx === i ? { ...e, ...patch } : e)
    }))
  }
  function removeExpense(i) {
    setForm(f => ({ ...f, expenses: f.expenses.filter((_, idx) => idx !== i) }))
  }

  async function save() {
    const err = validateDailyRecord(form)
    if (err) { showToast(err, 'error'); return }
    setSaving(true)
    try {
      await dailyRecordsApi.upsert(serializeDailyRecord(form))
      window.dispatchEvent(new Event('app-data-changed'))
      showToast('已保存', 'success')
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
      title={record ? '编辑每日记录' : '记录这一天'}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>取消</Button>
          <Button size="lg" className="flex-1 bg-teal-500 hover:bg-teal-600 shadow-teal-500/25" onClick={save} loading={saving}>
            保存
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 今天完成了什么 */}
        <Field label="今天完成了什么" icon="checkCircle">
          <textarea
            rows={3}
            value={form.doneItems}
            onChange={e => set('doneItems', e.target.value)}
            placeholder="每行写一件完成的事，例如：\n写完项目周报\n跑步 5 公里"
            className="w-full px-3 py-2.5 text-sm bg-teal-50/50 border border-teal-100 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-500/15 transition resize-none"
          />
        </Field>

        {/* 有效投入时长 */}
        <Field label="有效投入时长" icon="clock">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={form.focusHours}
              onChange={e => set('focusHours', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-20 px-3 py-2 text-sm bg-teal-50/50 border border-teal-100 rounded-xl text-slate-700 text-center focus:outline-none focus:border-teal-300 focus:bg-white transition"
            />
            <span className="text-sm text-slate-500">小时</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {FOCUS_PRESETS.map(h => (
              <button
                key={h}
                onClick={() => set('focusHours', h)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  form.focusHours === h
                    ? 'bg-teal-500 text-white'
                    : 'bg-white text-slate-600 border border-teal-100 hover:border-teal-300'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </Field>

        {/* 情绪与精力 */}
        <Field label="情绪" icon="smile">
          <div className="flex gap-2">
            {MOODS.map(m => (
              <button
                key={m.key}
                onClick={() => set('mood', form.mood === m.key ? '' : m.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition flex flex-col items-center gap-0.5 ${
                  form.mood === m.key
                    ? m.active + ' shadow-sm'
                    : 'bg-white text-slate-600 border border-teal-100 hover:border-teal-300'
                }`}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="精力状态" icon="zap">
          <div className="flex gap-1.5">
            {ENERGY_LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => set('energy', l.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                  form.energy === l.value
                    ? 'bg-amber-400 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-teal-100 hover:border-amber-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Field>

        {/* 当日开销明细 */}
        <Field
          label="当日开销明细"
          icon="wallet"
          right={
            <button onClick={addExpense} className="flex items-center gap-0.5 text-xs font-medium text-teal-600 hover:text-teal-700">
              <Icon name="plus" size={13} /> 添加
            </button>
          }
        >
          {form.expenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-1">暂无开销，点右上角「添加」记录一笔</p>
          ) : (
            <div className="space-y-2">
              {form.expenses.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={e.desc}
                    onChange={ev => updateExpense(i, { desc: ev.target.value })}
                    placeholder="用途"
                    className="flex-1 min-w-0 px-2.5 py-2 text-sm bg-white border border-teal-100 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-300 transition"
                  />
                  <select
                    value={e.category}
                    onChange={ev => updateExpense(i, { category: ev.target.value })}
                    className="px-2 py-2 text-sm bg-white border border-teal-100 rounded-lg text-slate-600 focus:outline-none focus:border-teal-300 transition"
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={e.amount}
                    onChange={ev => updateExpense(i, { amount: ev.target.value })}
                    placeholder="¥"
                    className="w-20 px-2.5 py-2 text-sm bg-white border border-teal-100 rounded-lg text-slate-700 text-right placeholder:text-slate-400 focus:outline-none focus:border-teal-300 transition"
                  />
                  <button
                    onClick={() => removeExpense(i)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                    aria-label="删除"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        {/* 明日最重要的一件事 */}
        <Field label="明日最重要的一件事" icon="target">
          <input
            type="text"
            value={form.tomorrowTask}
            onChange={e => set('tomorrowTask', e.target.value)}
            placeholder="只写一件，聚焦最重要的事"
            className="w-full px-3 py-2.5 text-sm bg-teal-50/50 border border-teal-100 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-500/15 transition"
          />
        </Field>
      </div>
    </BottomSheet>
  )
}

// 字段容器
function Field({ label, icon, right, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon name={icon} size={14} className="text-teal-500" />
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}
