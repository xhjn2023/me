import { useState } from 'react'
import { sideProjectsApi } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  PageHeader, Card, Button, Input, RangeSlider, ProgressBar,
  BottomSheet, EmptyState, LoadingState, SectionHeader, Badge, Icon
} from '../components/ui'

// 5 类项目渐变配色（pink/blue/yellow/green/purple → rose/blue/amber/emerald/violet）
// sliderColor 用于 RangeSlider 的 hex 颜色（替代原 inline 渐变样式）
const CATEGORIES = [
  { key: '自媒体', icon: 'messageCircle', color: 'from-rose-400 to-pink-400', sliderColor: '#f43f5e' },
  { key: '电商',   icon: 'package',       color: 'from-blue-400 to-indigo-400', sliderColor: '#3b82f6' },
  { key: '技能',   icon: 'zap',           color: 'from-amber-400 to-orange-400', sliderColor: '#f59e0b' },
  { key: '投资',   icon: 'trendingUp',    color: 'from-emerald-400 to-teal-400', sliderColor: '#10b981' },
  { key: '其他',   icon: 'sparkles',      color: 'from-violet-400 to-purple-400', sliderColor: '#8b5cf6' }
]

export default function SideWork() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('自媒体')
  const [progress, setProgress] = useState(0)

  const { data: projects, loading, refresh } = useAsyncData(() => sideProjectsApi.getAll(), [])
  const projectsList = projects || []

  async function addProject() {
    const t = title.trim()
    if (!t) return
    await sideProjectsApi.add({
      title: t,
      category,
      progress,
      createdAt: Date.now()
    })
    setTitle('')
    setProgress(0)
    setShowForm(false)
    refresh()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  async function updateProgress(id, newProgress) {
    await sideProjectsApi.update(id, { progress: newProgress })
    refresh()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  async function deleteProject(id) {
    await sideProjectsApi.delete(id)
    refresh()
    window.dispatchEvent(new Event('app-data-changed'))
  }

  const totalProgress = projectsList.length > 0
    ? Math.round(projectsList.reduce((sum, p) => sum + p.progress, 0) / projectsList.length)
    : 0

  return (
    <div className="animate-fade-in pb-24">
      <PageHeader
        accent="side"
        icon="rocket"
        title="副业"
        subtitle="发展第二曲线"
        actions={
          <Button variant="primary" size="sm" icon="plus" onClick={() => setShowForm(true)}>
            新建
          </Button>
        }
      />

      {/* 总览卡片 */}
      <div className="px-4 mt-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">总览</span>
            <Badge color="orange" className="gap-1">
              <Icon name="flame" size={12} /> 副业进行中
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-slate-800 tabular-nums">{projectsList.length}</span>
            <span className="text-sm text-slate-400">个项目</span>
          </div>
          <ProgressBar value={totalProgress} color="orange" showLabel />
          <p className="text-xs text-slate-400 mt-1.5">平均进度</p>
        </Card>
      </div>

      {/* 项目列表 */}
      <div className="px-4 mt-5">
        <SectionHeader title="我的项目" icon="rocket" />
        {loading ? (
          <LoadingState />
        ) : projectsList.length === 0 ? (
          <Card>
            <EmptyState
              icon="rocket"
              title="还没有副业项目"
              description="开始打造你的第二曲线"
              action={
                <Button variant="primary" size="sm" icon="plus" onClick={() => setShowForm(true)}>
                  创建第一个项目
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {projectsList.map(project => {
              const catInfo = CATEGORIES.find(c => c.key === project.category) || CATEGORIES[4]
              return (
                <Card key={project.id} className="overflow-hidden">
                  <div className={`bg-gradient-to-r ${catInfo.color} h-14 flex items-center px-4 gap-2`}>
                    <Icon name={catInfo.icon} size={20} className="text-white" />
                    <span className="text-white font-medium text-sm">{project.category}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="font-semibold text-slate-800 text-sm leading-relaxed">{project.title}</h3>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 -m-1 transition-colors flex-shrink-0"
                        aria-label="删除项目"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <RangeSlider
                        value={project.progress}
                        onChange={v => updateProgress(project.id, v)}
                        color={catInfo.sliderColor}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-600 w-10 text-right tabular-nums">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 新建项目弹层 */}
      <BottomSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="新建副业项目"
        footer={
          <Button variant="primary" size="lg" icon="plus" onClick={addProject} className="w-full">
            创建项目
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            label="项目名称"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入项目名称"
          />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">项目类型</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`flex items-center justify-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all btn-press ${
                    category === cat.key
                      ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon name={cat.icon} size={14} />
                  {cat.key}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">初始进度</label>
              <span className="text-sm font-semibold text-slate-800 tabular-nums">{progress}%</span>
            </div>
            <RangeSlider value={progress} onChange={v => setProgress(v)} color="#f97316" />
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
