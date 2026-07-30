// 学习模块课程数据：摄影课程章节大纲
// 课程基础信息进数据库（进度可持久化），章节大纲为本地常量

export const PHOTOGRAPHY_COURSES = [
  {
    title: '手机摄影入门 · 零基础到出片',
    instructor: '林一',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-rose-400 to-orange-400',
    icon: 'camera',
    lessons: [
      { title: '认识手机相机参数与功能', duration: '12 min' },
      { title: '构图基础：三分法、对称、引导线', duration: '15 min' },
      { title: '光线运用：顺光、逆光、侧光', duration: '18 min' },
      { title: '人像拍摄技巧与虚化', duration: '20 min' },
      { title: '风景与建筑拍摄', duration: '16 min' },
      { title: '静物与美食摄影', duration: '14 min' },
      { title: '夜景与弱光拍摄', duration: '19 min' },
      { title: '后期调色入门', duration: '22 min' }
    ]
  },
  {
    title: '光影构图实战 · 进阶构图法则',
    instructor: '陈默',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-slate-600 to-slate-800',
    icon: 'aperture',
    lessons: [
      { title: '构图的视觉心理学', duration: '16 min' },
      { title: '黄金分割与螺旋构图', duration: '18 min' },
      { title: '框架构图与前景运用', duration: '15 min' },
      { title: '光线的方向与质感', duration: '20 min' },
      { title: '自然光与人造光结合', duration: '22 min' },
      { title: '色彩构成与情绪表达', duration: '17 min' },
      { title: '街头摄影构图实战', duration: '25 min' },
      { title: '作品分析与复盘', duration: '18 min' }
    ]
  },
  {
    title: '后期修图基础 · Lightroom 入门',
    instructor: '苏野',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-indigo-500 to-purple-500',
    icon: 'image',
    lessons: [
      { title: 'Lightroom 界面与工作流', duration: '14 min' },
      { title: 'RAW 格式与基础调整', duration: '16 min' },
      { title: '曝光、对比度与高光阴影', duration: '18 min' },
      { title: '色彩校正与白平衡', duration: '15 min' },
      { title: 'HSL 与局部调色', duration: '20 min' },
      { title: '裁剪与透视校正', duration: '12 min' },
      { title: '预设与批量处理', duration: '17 min' },
      { title: '导出与分享', duration: '10 min' }
    ]
  }
]

// 课程大纲索引：按标题查询章节
export const COURSE_OUTLINES = PHOTOGRAPHY_COURSES.reduce((acc, c) => {
  acc[c.title] = c
  return acc
}, {})
