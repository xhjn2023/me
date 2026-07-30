// 生活模块常量：心情映射 + 预设标签

// 心情选项：key 与数据库 mood 字段对齐
export const MOODS = [
  { key: 'happy',   emoji: '😊', label: '开心',   color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { key: 'calm',    emoji: '😌', label: '平淡',   color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { key: 'tired',   emoji: '😴', label: '疲惫',   color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'healed',  emoji: '🌿', label: '治愈',   color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { key: 'sad',     emoji: '🥲', label: '难过',   color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { key: 'busy',    emoji: '😅', label: '忙碌',   color: 'bg-rose-50 text-rose-600 border-rose-200' }
]

export const MOOD_MAP = MOODS.reduce((acc, m) => {
  acc[m.key] = m
  return acc
}, {})

// 预设标签：用户也可自由新增
export const PRESET_TAGS = ['出行', '美食', '感悟', '居家', '朋友', '家人', '工作', '梦境']

// 标签颜色：循环取色
export const TAG_COLORS = [
  'bg-teal-50 text-teal-600 border-teal-200',
  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'bg-amber-50 text-amber-600 border-amber-200',
  'bg-rose-50 text-rose-600 border-rose-200',
  'bg-indigo-50 text-indigo-600 border-indigo-200',
  'bg-slate-50 text-slate-600 border-slate-200',
]

export function tagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_COLORS[h % TAG_COLORS.length]
}
