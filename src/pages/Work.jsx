import { useState } from 'react'
import { todayStr, formatDateCN } from '../db/database'
import { PageHeader, Card, ChipGroup, Icon } from '../components/ui'
import TaskBoard from '../components/work/TaskBoard'
import WorkSummary from '../components/work/WorkSummary'

const TABS = [
  { key: 'tasks', label: '任务列表', icon: 'clipboardList' },
  { key: 'summary', label: '工作小结', icon: 'fileText' }
]

export default function Work() {
  const today = todayStr()
  const [activeTab, setActiveTab] = useState('tasks')

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        title="工作"
        subtitle={formatDateCN(today)}
        accent="work"
        icon="briefcase"
      />

      {/* Tab 切换 */}
      <div className="px-4 -mt-4 relative z-10">
        <Card className="p-1.5 shadow-md mb-4">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* 内容区 */}
      <div className="px-4">
        {activeTab === 'tasks' ? <TaskBoard /> : <WorkSummary />}
      </div>
    </div>
  )
}