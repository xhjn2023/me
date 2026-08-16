import { useState } from 'react'
import { Icon } from '../components/ui'
import DailyTab from './life/DailyTab'
import WeeklyTab from './life/WeeklyTab'
import NotesTab from './life/NotesTab'
import CognitionTab from './life/CognitionTab'

// 生活模块：每日记录 + 每周复盘 + 随笔 + 认知重塑
// - 每日记录：结构化记录完成事项 / 投入时长 / 情绪精力 / 开销 / 明日计划
// - 每周复盘：自动汇总本周每日记录，辅助生成亮点 / 问题 / 改进
// - 随笔：轻量化随笔记事本（原生活模块功能保留）
// - 认知重塑：写感想 → 规则引擎客观批判性反馈 → 识别认知偏差 → 重塑
const TABS = [
  { key: 'daily', label: '每日记录', icon: 'calendar', component: DailyTab },
  { key: 'weekly', label: '每周复盘', icon: 'clipboardList', component: WeeklyTab },
  { key: 'notes', label: '随笔', icon: 'notebookPen', component: NotesTab },
  { key: 'cognition', label: '认知重塑', icon: 'brainCircuit', component: CognitionTab },
]

export default function Life() {
  const [tab, setTab] = useState('daily')

  const ActiveComponent = (TABS.find(t => t.key === tab) || TABS[0]).component

  return (
    <div className="animate-fade-in">
      {/* 左上角「●生活」胶囊 + 顶部切换标签 */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-600 text-xs font-medium border border-teal-100">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> 生活
          </span>
        </div>

        {/* 分段切换 */}
        <div className="mt-3 flex gap-1 p-1 bg-white/70 backdrop-blur rounded-xl border border-slate-100 shadow-sm">
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all btn-press ${
                  active
                    ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/25'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon name={t.icon} size={15} strokeWidth={active ? 2 : 1.75} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 内容区 */}
      <div key={tab} className="animate-fade-in">
        <ActiveComponent />
      </div>
    </div>
  )
}
