/**
 * 认知重塑 · 批判性分析引擎
 * 设计原则：
 *  1. 不讨好：不使用"你很棒/你已经很好了"这类安抚话术
 *  2. 客观：基于文本证据推导，不无端共情
 *  3. 有批判性：直接指出认知漏洞，不模糊处理
 *  4. 可执行：指出问题后给可操作的思考工具
 *
 * 所有函数都是纯函数，便于测试和复用
 */

// ───────────── 认知偏差检测器 ─────────────
// 每个检测器返回：{ key, name, desc, evidence, hit } 或 null（未命中）

const BIAS_DETECTORS = [
  // 1. 绝对化 / 过度概括
  {
    key: 'overgeneralization',
    name: '过度概括',
    patterns: [
      /(?:我|他|她|他们|所有人|大家|每次|永远|一直|总是|从来不|再也不|全部|所有|任何|什么都|谁都|没人)[\u4e00-\u9fa5，。、,.!?！？\s]{0,10}(?:不行|不好|错|失败|倒霉|讨厌|没希望|没用|就是|都这样|是废物|不可能|做不到|不会成功|loser)/i,
      /(?:总是|永远|每次|天天|一直|从来|向来|次次|每每)[\u4e00-\u9fa5，。、,.!?！？\s]{0,15}(?:出问题|搞砸|失败|错|不如意|不开心)/i,
      /(?:没有一个|一个都不|全部都|所有人都)[^，。,.!?！？]{0,10}(?:懂|理解|支持|帮助|关心)/i,
    ],
    desc: '用单次/少数事件推出全称结论。"一次失败=永远失败"、"一人如此=所有人如此"。这种思维会放大负面信息，把偶发问题塑造成不可改变的宿命。',
    buildEvidence(matchText) {
      return `你使用了全称判断词汇（"总是/永远/所有人/都"）来描述本应是局部或暂时的情况：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}`
    }
  },

  // 2. 灾难化思维
  {
    key: 'catastrophizing',
    name: '灾难化',
    patterns: [
      /(?:完蛋了|彻底完了|全毁了|没救了|死定了|一切都毁了|人生毁了|前途没了|什么都没了|一无所有|天塌下来|世界末日)/i,
      /(?:最坏的|最糟糕|最差|最惨|可怕的后果|不可挽回|无法补救|彻底失败|彻底崩溃)/i,
      /(?:如果[^，。,.!?！？]{2,20}(?:就|那么|肯定|一定|必然)[^，。,.!?！？]{0,15}(?:完了|毁了|没了|死|崩溃|不行))/i,
    ],
    desc: '把普通负面事件直接推导到最极端的灾难性结局。中间省略了所有缓冲和应对环节，使大脑直接处于求生模式（fight-or-flight），导致焦虑放大、判断力下降。',
    buildEvidence(matchText) {
      return `检测到灾难化表述：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。你跳过了中间步骤，直接跳到了最坏结局。`
    }
  },

  // 3. 非黑即白（两极化思维）
  {
    key: 'black_or_white',
    name: '非黑即白思维',
    patterns: [
      /(?:要么[^，。,.!?！？]{1,15}要么[^，。,.!?！？]{1,15})/i,
      /(?:要不[^，。,.!?！？]{1,15}要不[^，。,.!?！？]{1,15})/i,
      /(?:[^，。,.!?！？]{1,10}(?:就是|等于|完全是|简直是)[^，。,.!?！？]{0,10}(?:失败|废物|垃圾|没用|错误|不对|成功|完美|全对|赢家|输家))/i,
      /(?:[^，。,.!?！？]{1,10}(?:没有|不是|完全没有)(?:中间|折中|余地|灰色地带|可能|其他选择))/i,
    ],
    desc: '把复杂现实压缩为两个极端选项。现实世界绝大多数情况是连续谱，不是二选一。这种思维会让你错失中间的大量选择和渐进路径。',
    buildEvidence(matchText) {
      return `你使用了二选一或极端化表述：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。隐含前提是"只有两种可能"，这个前提成立吗？`
    }
  },

  // 4. 情绪化推理（把感受当事实）
  {
    key: 'emotional_reasoning',
    name: '情绪化推理',
    patterns: [
      /(?:我觉得|我感觉|我感到|我的直觉)[^，。,.!?！？]{0,20}(?:就是|一定|肯定|绝对|百分百|真的)[^，。,.!?！？]{1,25}/i,
      /(?:感觉[^，。,.!?！？]{0,15}(?:就是|肯定|一定|明显|绝对))/i,
      /(?:[^，。,.!?！？]{1,10}(?:心里很难受|很焦虑|很慌|很沮丧|很崩溃)[^，。,.!?！？]{0,15}(?:所以|因此|于是|看来|说明))/i,
    ],
    desc: '把情绪感受当作客观事实的证据。感受是真实的，但感受不等于事实：焦虑≠真的有危险，难过≠真的有人对不起你，羞愧≠真的做错了。',
    buildEvidence(matchText) {
      return `你用主观感受（"觉得/感觉/感到"）直接推导出了客观结论：${matchText.slice(0, 45)}${matchText.length > 45 ? '…' : ''}`
    }
  },

  // 5. 读心术（揣测他人想法）
  {
    key: 'mind_reading',
    name: '读心术式假设',
    patterns: [
      /(?:他|她|他们|领导|同事|大家|别人|朋友|父母|家人)[^，。,.!?！？]{0,15}(?:肯定|一定|觉得|认为|以为|心里|肯定是|就是想|故意|看不起|讨厌|觉得我|认为我|以为我)/i,
      /(?:[^，。,.!?！？]{1,10}(?:嫌我|烦我|看不起我|讨厌我|不尊重我|不把我当回事|敷衍我|利用我|骗我))/i,
      /(?:[^，。,.!?！？]{1,10}(?:在嘲笑|在议论|在看我|在等我出丑|对我失望))/i,
    ],
    desc: '没有证据就断定对方在想什么。这是社交焦虑的核心来源。绝大多数情况下，你对他人内心的揣测准确率远低于你自认为的水平。',
    buildEvidence(matchText) {
      return `你对他人的内心状态做出了判断：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。但你没有直接证据，只是在假设对方的想法。`
    }
  },

  // 6. 个人化（过度揽责）
  {
    key: 'personalization',
    name: '过度揽责',
    patterns: [
      /(?:都是我|全怪我|因为我|我的问题|都怨我|是我的错|怪我|我害了|如果不是我)[^，。,.!?！？]{0,20}(?:才|所以|因此|就|于是)/i,
      /(?:我对不起|我不配|我不值得|我应该受罚|都是我的责任)/i,
      /(?:[^，。,.!?！？]{1,15}(?:搞砸|毁了|做错|失败|出错)[^，。,.!?！？]{0,15}(?:了|了|)因为我)/i,
    ],
    desc: '把不是你控制的事都归因为自己。一件事的结果是多因多果的，你的角色可能只是变量之一，甚至不是关键变量。过度揽责的另一面是：你高估了自己的影响力。',
    buildEvidence(matchText) {
      return `你把结果完全归因于自己：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。请问这件事有几个影响因素？你占了其中多少权重？`
    }
  },

  // 7. 应该句式（自我苛责）
  {
    key: 'should_statements',
    name: '"应该"句式',
    patterns: [
      /(?:我|你|他|她|人|大家|正常人|成年人)[^，。,.!?！？]{0,10}(?:应该|必须|得|要|就得|就该|就必须)[^，。,.!?！？]{0,30}/i,
      /(?:不应该|不能|不准|不许|不该|不可以)[^，。,.!?！？]{0,20}(?:做|想|说|有|感觉)/i,
      /(?:凭什么|怎么可以|简直不该|这不对|这不行)[^，。,.!?！？]{0,15}/i,
    ],
    desc: '用"应该/必须"给自己或他人套了一个内化的规则模板。如果规则来自外界（父母、社会、短视频）而不是你自己的思考，它就可能与你的现实脱节。',
    buildEvidence(matchText) {
      return `你使用了规则性表述：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。请追问：这条"应该"是谁制定的？它基于什么事实？违反了会怎样？`
    }
  },

  // 8. 贴标签
  {
    key: 'labeling',
    name: '贴标签',
    patterns: [
      /(?:我|他|她|这个人|这人|领导|同事|朋友)[^，。,.!?！？]{0,8}(?:是|就是|简直是|完全是|属于|典型的)[^，。,.!?！？]{1,12}(?:废物|笨蛋|蠢|傻|垃圾|人渣|贱人|骗子|渣男|绿茶|心机婊|自私鬼|失败者|软骨头|懦夫|天才|神人|大神|无敌)/i,
      /(?:我是|我就是)[^，。,.!?！？]{0,8}(?:废物|垃圾|笨蛋|不行的人|失败者|不配|没用的人|loser)/i,
    ],
    desc: '用一个标签替代一个复杂的人（包括你自己）。人是多面且变化的，任何单一标签都是对复杂性的粗暴简化。对自己贴负面标签会直接降低自我效能感。',
    buildEvidence(matchText) {
      return `你给人（可能是你自己）贴了简化标签：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。这句话能否用"在X这件事上，这次他/我做了Y"重新描述？`
    }
  },

  // 9. 否定正面（过滤积极）
  {
    key: 'dismissing_positive',
    name: '否定正面证据',
    patterns: [
      /(?:虽然|虽说|尽管|但是|不过|可是|只是|只不过|就是|还是|反正|充其量|大不了)[^，。,.!?！？]{0,25}(?:没用|不算|不真|偶然|运气|别人客气|场面话|客套|敷衍|侥幸|碰巧)/i,
      /(?:[^，。,.!?！？]{1,15}(?:好|不错|成功|顺利|进步|表扬|夸)[^，。,.!?！？]{0,10}(?:但|但是|可是|不过|只是))/i,
      /(?:(?:那又怎样|又怎么样|有什么用|没什么意义|没什么大不了|也就那样|一般般|凑合))/i,
    ],
    desc: '遇到正面信息就通过"但是/只是"把它消解掉。结果是，证据永远只能支持负面结论。如果你的理论无法被正面证据证伪，它已经不是观点，而是信念。',
    buildEvidence(matchText) {
      return `检测到否定/消解正面信息的模式：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}`
    }
  },

  // 10. 以偏概全 / 选择性提取（只取负面片段）
  {
    key: 'selective_abstraction',
    name: '选择性提取负面',
    patterns: [
      /(?:最让我不爽|最难受|最烦|最差|最讨厌|最让我不能接受|唯一记得|印象最深)[^，。,.!?！？]{0,25}/i,
      /(?:[^，。,.!?！？]{1,20}(?:就算|哪怕|即使)[^，。,.!?！？]{0,15}(?:好|不错|顺利|对|成功)[^，。,.!?！？]{0,15}(?:也|还是|照样)[^，。,.!?！？]{0,20}(?:不好|不行|错|失败|问题))/i,
    ],
    desc: '从一个复杂情境中只摘取负面细节，把它当作整体结论。一件事有9个环节OK，1个环节出问题，你的注意力全在那1个上，觉得整件事都失败了。',
    buildEvidence(matchText) {
      return `你只聚焦于情境中的负面片段：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。请补全：这件事的其他部分发生了什么？`
    }
  },
]

function detectBiases(text) {
  const hits = []
  for (const detector of BIAS_DETECTORS) {
    for (const regex of detector.patterns) {
      const m = text.match(regex)
      if (m && m[0]) {
        hits.push({
          key: detector.key,
          name: detector.name,
          desc: detector.desc,
          evidence: detector.buildEvidence(m[0]),
        })
        break // 一个偏差只记录一次命中
      }
    }
  }
  return hits
}

// ───────────── 证据检验 ─────────────
// 自动从文本中抽取支持证据和潜在反驳点

function buildEvidenceCheck(text) {
  const sentences = text.split(/[。！？!?\n]+/).map(s => s.trim()).filter(Boolean)
  const support = []
  const against = []

  for (const s of sentences) {
    // 简单规则：含"因为/由于/所以"且有具体事实细节（数字/人名/事件）算支持证据
    if (/[因为|由于|原因是|毕竟|考虑到|所以|因此|于是]/.test(s) && /[\d一二三四五六七八九十]|[A-Za-z\u4e00-\u9fa5]{2,}(?:说|做|发生|给|告诉我|回复|表现)/.test(s)) {
      support.push(s.slice(0, 80))
    }
    // 含绝对性断言或情绪化判断但没有具体事实的，提示找反证
    if (/[总是|永远|所有人|必须|应该|肯定|一定|就是|完全|绝对|彻底]/.test(s) && !/[昨天|今天|上周|上个月|去年|前天|时候|那次|回|次]/.test(s)) {
      against.push(`针对"${s.slice(0, 40)}"找反例：有没有不成立的具体情况？`)
    }
  }

  // 通用反证问题（每条思考都适用的检验）
  const genericAgainst = [
    '有没有具体反例能推翻这个判断？列出至少一个。',
    '这个判断的反面成立时，需要哪些证据？',
    '如果一个你不在乎的人做了同样的事，你会得出同样结论吗？',
  ]
  for (const q of genericAgainst) if (!against.includes(q)) against.push(q)

  // 补充通用支持证据提示
  if (support.length === 0) {
    support.push('（未找到明确的证据链。请补充：这个结论基于哪件具体的事？谁、在何时、做了什么？）')
  } else if (support.length < 2) {
    support.push('（只有一条证据不足以支撑强结论。试试补充至少两条独立的事实。）')
  }

  return { support: support.slice(0, 5), against: against.slice(0, 5) }
}

// ───────────── 替代视角生成 ─────────────

function buildPerspectives(text, biases) {
  const perspectives = []
  const hasBias = key => biases.some(b => b.key === key)

  // 视角1：如果最好的朋友说同样的话
  perspectives.push({
    title: '好友视角',
    content: '假设你最好的朋友对你说了一模一样的话，你会怎么回复他/她？你还会用同样严厉的措辞吗？你会补充哪些他/她没看到的事实？——把这段回复写下来，就是你对自己更公允的评价。'
  })

  // 视角2：第三方冷静旁观者
  perspectives.push({
    title: '旁观者视角',
    content: '假设你是一个完全无关的旁观者，手里只有客观的事件记录，不知道当事人的情绪。用三句话描述这件事：事实1、事实2、事实3。你会得出和当下一样的结论吗？如果结论不同，差异源于哪里？'
  })

  // 视角3：三个月后的自己
  perspectives.push({
    title: '三个月后视角',
    content: '想象今天是90天以后。回头看这件事：它还重要吗？你那时最关心的是什么？当时你做了什么来应对？——如果三个月后这件事根本不会出现在你的记忆里，它就配不上你现在付出的情绪强度。'
  })

  // 针对特定偏差加视角
  if (hasBias('mind_reading')) {
    perspectives.push({
      title: '验证读心假设',
      content: '你刚才对他人的想法做了判断。现在做一个思想实验：把这个判断拆成三个不同版本，每个版本都同样符合已知事实。例如"他迟到=不重视/他堵车/他记错时间"。哪个版本概率最高？没有实锤前，为什么选最让自己难受的那个？'
    })
  }
  if (hasBias('catastrophizing') || hasBias('overgeneralization')) {
    perspectives.push({
      title: '概率拆分',
      content: '把你担心的结果拆成：最可能发生的情况（50%线）、最好情况（5%线）、最坏情况（5%线）。然后给每一种情况写一个应对方案。焦虑往往来自"没方案=无限坏"，一旦有了方案，最坏情况也没那么可怕。'
    })
  }
  if (hasBias('personalization')) {
    perspectives.push({
      title: '责任拆分',
      content: '把这件事的影响因素列出来：你的行为（权重A%）、对方的因素（权重B%）、环境/系统因素（权重C%）。A+B+C=100%。如果你把A写到了80%以上，说明你大概率在过度揽责。'
    })
  }
  if (hasBias('should_statements')) {
    perspectives.push({
      title: '规则溯源',
      content: '你脑子里的那个"应该/必须"，最早是从谁那里听到的？父母？老师？社交环境？——如果源头的判断力并不优于现在的你，为什么你还在自动执行那条规则？'
    })
  }
  if (hasBias('dismissing_positive')) {
    perspectives.push({
      title: '双标自检',
      content: '如果你的成就发生在一个你敬佩的人身上，你会怎么评价他？你给他的赞誉和你给自己的贬损之间的差距，就是你"否定正面"的程度。这个差距是合理的吗？'
    })
  }
  if (hasBias('black_or_white')) {
    perspectives.push({
      title: '灰度练习',
      content: '把你认为的两个极端（如成功/失败、对/错）定义为0分和10分。现在给这件事打一个0-10之间的分数，不是整数也可以。为什么是这个分？扣的分来自哪里？剩下的分来自哪里？'
    })
  }

  return perspectives
}

// ───────────── 重新表述建议 ─────────────

function buildReframe(text, biases) {
  // 基于命中的偏差类型，给出具体的重写模板
  const reframes = []
  const hasBias = key => biases.some(b => b.key === key)

  if (hasBias('overgeneralization')) {
    reframes.push('把全称词（总是/永远/所有人）替换为限定词（有时/这次/某些情况下/那个人）。')
  }
  if (hasBias('catastrophizing')) {
    reframes.push('把"完蛋了/全毁了"替换为"这件事出了X问题，但还有Y和Z部分是OK的。我下一步可以做A来应对。"')
  }
  if (hasBias('emotional_reasoning')) {
    reframes.push('把"我感觉X，所以Y就是事实"改为"我现在有X的感受，可能是因为我解读为Y。我需要哪些证据来验证这个解读对不对？"')
  }
  if (hasBias('mind_reading')) {
    reframes.push('把"他觉得我XXX"改为"他做了Y这个行为。我猜测他可能想表达XXX，但这只是猜测。最直接的验证方法是……"')
  }
  if (hasBias('personalization')) {
    reframes.push('把"全怪我"改为"我承担的部分是A。其他影响因素还包括B和C。下一次我可以在A上调整，B和C则不是我能控制的。"')
  }
  if (hasBias('should_statements')) {
    reframes.push('把"我应该X"改为"如果我做了X，会带来Y好处，但同时会付出Z成本。综合来看，我选择做/不做。"把规则变成选择。')
  }
  if (hasBias('labeling')) {
    reframes.push('把"我是XXX（标签）"改为"在Y这件事上，我这次做了Z这个行为。下次我可以换一种做法。"标签否定整个人，而行为是可以改的。')
  }
  if (hasBias('black_or_white')) {
    reframes.push('把"要么A要么B"改为"在A和B之间，我还可以选：程度不同的A+B组合、分步走（先A再B）、先暂停再决定。"')
  }

  if (reframes.length === 0) {
    reframes.push('没有检测到典型的认知偏差。但可以尝试这个通用重写：用"我注意到+事实+我的解读+我的需求"四要素重新表达。')
  }

  return reframes.join('\n')
}

// ───────────── 建设性追问 ─────────────

function buildChallenges(text, biases) {
  const challenges = []
  const hasBias = key => biases.some(b => b.key === key)

  // 通用追问
  challenges.push({ question: '如果今天必须给自己的结论挑一个逻辑漏洞，你会挑哪里？' })
  challenges.push({ question: '一年前你信以为真的某个观点，现在已经不信了。你怎么保证当下这个结论不会同样被推翻？' })
  challenges.push({ question: '有没有可能，你现在最在意的这件事，本质上是你在回避另一件你更不想面对的事？' })

  // 特定偏差追问
  if (hasBias('overgeneralization') || hasBias('catastrophizing')) {
    challenges.push({ question: '用0-100打分：你担心的结果实际发生的概率是多少？发生了以后你的应对能力是多少分？' })
  }
  if (hasBias('mind_reading')) {
    challenges.push({ question: '除了直接问对方，还有没有成本较低的验证方法（如观察下一次行为）？你愿意执行吗？' })
  }
  if (hasBias('personalization')) {
    challenges.push({ question: '你把责任全揽到自己身上，是否在某种程度上让你感觉"至少事情还在我控制之内"？如果是的话，控制感比真相更重要吗？' })
  }
  if (hasBias('should_statements')) {
    challenges.push({ question: '如果不遵守这个"应该/必须"，你害怕的最糟糕结果是什么？这个害怕有事实依据吗？' })
  }
  if (hasBias('emotional_reasoning')) {
    challenges.push({ question: '你现在的情绪生理层面是什么感觉（心跳/胸口/肩膀）？有没有可能你只是累了/饿了/睡眠不足，然后把生理不适解读成了现实威胁？' })
  }
  if (hasBias('labeling')) {
    challenges.push({ question: '你给自己或他人贴的这个标签，如果贴到你爱的人身上，你会接受吗？如果不，为什么你允许自己对自己（或别人）这么狠？' })
  }
  if (hasBias('dismissing_positive') || hasBias('selective_abstraction')) {
    challenges.push({ question: '试试刻意反着来：列出这件事至少3个积极或中性的细节。你列的时候第一反应是不是在找理由否定它们？觉察那个否定的声音。' })
  }

  return challenges.slice(0, 5) // 最多5个，避免信息过载
}

// ───────────── 认知健康度打分 ─────────────

function computeScore(text, biases) {
  let score = 80 // 基线：健康思考的默认分
  const biasPenalty = {
    overgeneralization: 6,
    catastrophizing: 10,
    black_or_white: 5,
    emotional_reasoning: 6,
    mind_reading: 5,
    personalization: 5,
    should_statements: 4,
    labeling: 7,
    dismissing_positive: 6,
    selective_abstraction: 5,
  }
  for (const b of biases) {
    score -= biasPenalty[b.key] || 4
  }

  // 文本长度过短（少于50字）扣5分：信息不足难以做出冷静判断
  if (text.replace(/\s/g, '').length < 30) score -= 5

  // 含有较多问号但没有问号（全是陈述断言）扣3分：缺乏自我怀疑的信号
  if (!/[?？]/.test(text) && biases.length >= 2) score -= 3

  // 限制范围
  return Math.max(10, Math.min(98, score))
}

// ───────────── 总结句生成 ─────────────

function buildSummary(text, biases, score) {
  const len = biases.length
  const topBias = biases[0]

  if (score >= 75) {
    return `认知健康度 ${score}/100。这段思考整体较为冷静，没有明显的结构性偏差。可以直接跳到"建设性追问"做深度审视——即使结论正确，深挖背后的假设也会让你更稳。`
  }
  if (score >= 55) {
    return `认知健康度 ${score}/100。检测到 ${len} 处认知偏差${topBias ? `，核心问题是"${topBias.name}"` : ''}。你的结论可能有部分事实支撑，但偏差的存在会让判断系统性地偏向负面。建议至少完成"证据检验"和"替代视角"两步。`
  }
  if (score >= 35) {
    return `认知健康度 ${score}/100。检测到 ${len} 处认知偏差，其中 "${topBias?.name || ''}" 正在显著扭曲你的判断。你此刻的结论很大概率比现实更悲观/更极端。先别急着做决定，把"重新表述"和"概率拆分"做完，24小时后再评估。`
  }
  return `认知健康度 ${score}/100。多处严重认知偏差同时出现，你的大脑此刻处于"情绪劫持"状态。**重要：现在不要做任何不可逆决定。** 第一步不是分析，是先让身体恢复平静（喝水、10分钟散步、睡眠）。冷静后再回来用工具重新拆解。`
}

// ───────────── 主入口 ─────────────

/**
 * 分析用户写的一段感想，返回结构化反馈
 * @param {string} content 用户的原始文字
 * @param {object} [opts] 可选参数：{ mood, category, tags }
 * @returns {{biases, evidence, perspectives, reframe, challenges, summary, score}}
 */
export function analyzeReflection(content, opts = {}) {
  const text = (content || '').trim()
  if (!text) {
    return {
      biases: [],
      evidence: { support: [], against: [] },
      perspectives: [],
      reframe: '',
      challenges: [],
      summary: '没有内容可分析。',
      score: 0,
    }
  }

  const biases = detectBiases(text)
  const evidence = buildEvidenceCheck(text)
  const perspectives = buildPerspectives(text, biases)
  const reframe = buildReframe(text, biases)
  const challenges = buildChallenges(text, biases)
  const score = computeScore(text, biases)
  const summary = buildSummary(text, biases, score)

  return { biases, evidence, perspectives, reframe, challenges, summary, score }
}
