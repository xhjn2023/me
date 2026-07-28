import { useState } from 'react'
import { sideProjectsApi, todayStr } from '../db/database'
import { useAsyncData } from '../hooks/useAsyncData'

const CATEGORIES = [
  { key: '自媒体', icon: '📱', color: 'from-pink-400 to-rose-400' },
  { key: '电商', icon: '🛒', color: 'from-blue-400 to-indigo-400' },
  { key: '技能', icon: '💡', color: 'from-yellow-400 to-orange-400' },
  { key: '投资', icon: '📈', color: 'from-green-400 to-emerald-400' },
  { key: '其他', icon: '✨', color: 'from-purple-400 to-violet-400' }
]

export default function SideWork() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('自媒体')
  const [progress, setProgress] = useState(0)

  const { data: projects, refresh } = useAsyncData(() => sideProjectsApi.getAll(), [])
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
      <div className="bg-gradient-to-br from-orange-500 to-red-500 p-5 text-white rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">副业</h1>
            <p className="text-sm text-white/80 mt-0.5">发展第二曲线</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl btn-press"
          >
            +
          </button>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">总览</span>
            <span className="text-sm text-orange-500">🔥 副业进行中</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-800">{projectsList.length}</span>
                <span className="text-sm text-gray-400">个项目</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">平均进度 {totalProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <h2 className="text-lg font-bold text-slate-800 mb-3">🚀 我的项目</h2>
        <div className="space-y-3">
          {projectsList.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🚀</p>
              <p className="text-sm">还没有副业项目</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-orange-500"
              >
                创建第一个项目
              </button>
            </div>
          ) : (
            projectsList.map(project => {
              const catInfo = CATEGORIES.find(c => c.key === project.category) || CATEGORIES[4]
              return (
                <div key={project.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
                  <div className={`bg-gradient-to-r ${catInfo.color} h-16 flex items-center px-4`}>
                    <span className="text-2xl">{catInfo.icon}</span>
                    <span className="ml-2 text-white font-medium">{project.category}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{project.title}</h3>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="text-gray-300 hover:text-red-400 text-xs"
                      >
                        删除
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={project.progress}
                        onChange={e => updateProgress(project.id, parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #f97316 ${project.progress}%, #f3f4f6 ${project.progress}%)`
                        }}
                      />
                      <span className="text-sm font-medium text-gray-600 w-12">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">新建副业项目</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">项目名称</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="输入项目名称"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-2 block">项目类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setCategory(cat.key)}
                      className={`p-3 rounded-xl text-sm transition-colors ${
                        category === cat.key
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {cat.icon} {cat.key}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-2 block">初始进度: {progress}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={e => setProgress(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <button
                onClick={addProject}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium btn-press"
              >
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
