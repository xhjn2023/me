// 学习模块课程数据：摄影课程章节大纲
// 课程基础信息进数据库（进度可持久化），简介 intro 与章节大纲 lessons 为本地常量
// 拓展备用课程 RESERVED 不进 seed，后续按需启用

export const PHOTOGRAPHY_COURSES = [
  {
    title: '手机人像摄影入门课',
    instructor: '林一',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-rose-400 to-orange-400',
    icon: 'smile',
    intro: '普通人零基础学人像，掌握构图、光线，随手拍出自然氛围感人像',
    lessons: [
      { title: '手机相机参数与人像模式', duration: '12 min' },
      { title: '构图基础：三分法与居中', duration: '15 min' },
      { title: '光线运用：顺光、侧光、逆光人像', duration: '18 min' },
      { title: '户外人像拍摄技巧', duration: '20 min' },
      { title: '室内人像与窗光运用', duration: '17 min' },
      { title: '姿势引导与表情捕捉', duration: '19 min' },
      { title: '虚化背景与景深控制', duration: '14 min' },
      { title: '基础调色与肤色优化', duration: '22 min' }
    ]
  },
  {
    title: '风光摄影构图实战教程',
    instructor: '陈默',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-sky-500 to-emerald-500',
    icon: 'aperture',
    intro: '户外风景、城市街拍构图法则，避开拍照杂乱，画面干净有层次',
    lessons: [
      { title: '风光摄影构图法则总览', duration: '14 min' },
      { title: '三分法与地平线安排', duration: '16 min' },
      { title: '引导线构图实战', duration: '18 min' },
      { title: '框架构图与前景运用', duration: '17 min' },
      { title: '城市街拍构图技巧', duration: '20 min' },
      { title: '建筑拍摄角度选择', duration: '19 min' },
      { title: '避开杂乱的取景思路', duration: '15 min' },
      { title: '风光后期裁剪与调色', duration: '21 min' }
    ]
  },
  {
    title: 'CCD复古胶片质感拍摄指南',
    instructor: '苏野',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-amber-500 to-rose-500',
    icon: 'camera',
    intro: '复古噪点、暖调光影、怀旧色调调试，复刻老式相机文艺照片风格',
    lessons: [
      { title: 'CCD 复古美学原理', duration: '13 min' },
      { title: '噪点与颗粒感控制', duration: '16 min' },
      { title: '暖调光影营造', duration: '18 min' },
      { title: '怀旧色调调试思路', duration: '20 min' },
      { title: '低饱和度色彩风格', duration: '17 min' },
      { title: '暗角与漏光效果', duration: '15 min' },
      { title: '复古人像实战拍摄', duration: '22 min' },
      { title: '胶片质感后期模拟', duration: '24 min' }
    ]
  },
  {
    title: '静物与美食光影摄影',
    instructor: '周晚',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-amber-400 to-orange-500',
    icon: 'image',
    intro: '桌面静物、美食拍摄布光技巧，学会利用自然光提升照片质感',
    lessons: [
      { title: '桌面静物布光基础', duration: '14 min' },
      { title: '自然光运用与柔光', duration: '17 min' },
      { title: '侧光与逆光美食拍摄', duration: '19 min' },
      { title: '道具与背景搭配', duration: '15 min' },
      { title: '构图与视角选择', duration: '18 min' },
      { title: '色彩搭配与画面协调', duration: '16 min' },
      { title: '美食拍摄实操演练', duration: '21 min' },
      { title: '后期调色与质感提升', duration: '20 min' }
    ]
  },
  {
    title: '短视频基础运镜拍摄技巧',
    instructor: '阿木',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-violet-500 to-indigo-500',
    icon: 'play',
    intro: '手机基础推拉摇移运镜，日常vlog短片拍摄思路，新手轻松上手',
    lessons: [
      { title: '手机短视频参数设置', duration: '12 min' },
      { title: '推镜技巧与实战', duration: '16 min' },
      { title: '拉镜与摇镜运用', duration: '17 min' },
      { title: '移镜与跟拍手法', duration: '19 min' },
      { title: '固定镜头与构图', duration: '15 min' },
      { title: 'vlog 日常短片思路', duration: '20 min' },
      { title: '转场与剪辑节奏', duration: '22 min' },
      { title: '配乐与成片输出', duration: '18 min' }
    ]
  }
]

// 拓展备用课程（后续扩容启用，暂不进 seed 不渲染）
export const RESERVED_COURSES = [
  {
    title: '夜景弱光拍照实操技巧',
    instructor: '待定',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-slate-700 to-indigo-900',
    icon: 'moon',
    intro: '讲解夜间、室内暗光环境拍摄，解决照片发黑模糊',
    lessons: [
      { title: '弱光摄影基础原理', duration: '15 min' },
      { title: '手机夜景模式解析', duration: '14 min' },
      { title: 'ISO 与快门平衡', duration: '18 min' },
      { title: '夜间人像拍摄', duration: '20 min' },
      { title: '室内暗光环境技巧', duration: '17 min' },
      { title: '灯光与霓虹氛围', duration: '19 min' },
      { title: '星空与长曝光', duration: '22 min' },
      { title: '夜景后期降噪调色', duration: '21 min' }
    ]
  },
  {
    title: '手机调色基础：通用滤镜思路',
    instructor: '待定',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-teal-500 to-cyan-600',
    icon: 'image',
    intro: '不用复杂APP，简单调节统一照片色调',
    lessons: [
      { title: '调色基础原理', duration: '14 min' },
      { title: '色温与色调调整', duration: '16 min' },
      { title: '曝光与对比度', duration: '15 min' },
      { title: 'HSL 局部调色', duration: '19 min' },
      { title: '暖调滤镜思路', duration: '17 min' },
      { title: '冷调滤镜思路', duration: '17 min' },
      { title: '复古胶片滤镜', duration: '20 min' },
      { title: '批量统一色调', duration: '18 min' }
    ]
  },
  {
    title: '旅行纪实摄影',
    instructor: '待定',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-orange-500 to-rose-500',
    icon: 'camera',
    intro: '边走边拍，捕捉自然生活化瞬间',
    lessons: [
      { title: '旅行摄影装备准备', duration: '13 min' },
      { title: '街头抓拍技巧', duration: '18 min' },
      { title: '人文瞬间捕捉', duration: '20 min' },
      { title: '地域特色呈现', duration: '17 min' },
      { title: '光线与时机的选择', duration: '19 min' },
      { title: '构图叙事表达', duration: '16 min' },
      { title: '旅行人像拍摄', duration: '21 min' },
      { title: '成片筛选与后期', duration: '20 min' }
    ]
  },
  {
    title: '户外自然光运用大全',
    instructor: '待定',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-yellow-400 to-amber-500',
    icon: 'sun',
    intro: '区分顺光、侧光、逆光，找到最佳拍照时间',
    lessons: [
      { title: '自然光基础特性', duration: '14 min' },
      { title: '黄金时段拍摄', duration: '18 min' },
      { title: '顺光运用技巧', duration: '15 min' },
      { title: '侧光塑造质感', duration: '17 min' },
      { title: '逆光与剪影', duration: '19 min' },
      { title: '阴天柔光利用', duration: '16 min' },
      { title: '树荫与斑驳光影', duration: '18 min' },
      { title: '光线与情绪表达', duration: '20 min' }
    ]
  },
  {
    title: '亲子日常抓拍摄影',
    instructor: '待定',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-pink-400 to-rose-400',
    icon: 'smile',
    intro: '捕捉小朋友动态瞬间，告别僵硬摆拍',
    lessons: [
      { title: '亲子拍摄器材选择', duration: '13 min' },
      { title: '儿童视角与机位', duration: '16 min' },
      { title: '抓拍技巧与快门', duration: '19 min' },
      { title: '户外玩耍场景', duration: '18 min' },
      { title: '室内居家场景', duration: '17 min' },
      { title: '表情与情绪捕捉', duration: '20 min' },
      { title: '亲子合影技巧', duration: '16 min' },
      { title: '成片调色与整理', duration: '18 min' }
    ]
  },
  {
    title: '人像姿势引导教学',
    instructor: '待定',
    totalLessons: 8,
    category: '摄影',
    cover: 'from-fuchsia-500 to-purple-500',
    icon: 'user',
    intro: '解决拍照僵硬，自然松弛姿势参考',
    lessons: [
      { title: '姿势引导原理', duration: '15 min' },
      { title: '站姿基础变化', duration: '17 min' },
      { title: '坐姿与倚靠姿势', duration: '18 min' },
      { title: '手部动作引导', duration: '16 min' },
      { title: '表情与眼神引导', duration: '19 min' },
      { title: '动态抓拍姿势', duration: '21 min' },
      { title: '场景互动姿势', duration: '18 min' },
      { title: '群体合影姿势', duration: '20 min' }
    ]
  }
]

// 课程大纲索引：按标题查询章节与简介
export const COURSE_OUTLINES = [...PHOTOGRAPHY_COURSES, ...RESERVED_COURSES].reduce((acc, c) => {
  acc[c.title] = c
  return acc
}, {})
