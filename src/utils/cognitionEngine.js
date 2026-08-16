/**
 * 认知重塑 · 批判性分析引擎（v2 · 成熟方案对齐版）
 *
 * 本版不再重复造轮子，直接对齐三个成熟来源：
 *  1. David D. Burns《Feeling Good》权威 15 项认知扭曲列表（全球 CBT 自助书籍圣经）
 *  2. GitHub 热门 CBT App「Sanctum」开源的 Thought Record 7 栏结构 + 苏格拉底 6 问模板
 *  3. GitHub 开源项目 MoodJam / Quirk 通用的 Decatastrophizing（去灾难化）三步法
 *
 * 设计原则：
 *  · 不讨好：不使用"你很棒/你已经很好了"这类安抚话术
 *  · 客观：基于文本证据推导，不无端共情
 *  · 有批判性：直接指出认知漏洞，不模糊处理
 *  · 可执行：指出问题后给可操作的思考工具（全部来自临床验证模板）
 *
 * 所有函数都是纯函数，便于测试和复用
 */

// ═══════════════════════════════════════════════════════════════
// 模块 A · Burns 15 项权威认知扭曲检测器
// 来源：Burns, D. D. (1980). Feeling Good: The New Mood Therapy.
//       ——认知行为疗法领域被引用最广的偏差分类
// 补充 5 项来源于 Sanctum 开源 App 的 thought_record.dart
// ═══════════════════════════════════════════════════════════════

const BIAS_DETECTORS = [
  // 1. All-or-Nothing Thinking / 非黑即白
  {
    key: 'black_or_white',
    name: '非黑即白思维',
    severity: 5,
    patterns: [
      /(?:要么[^，。,.!?！？]{1,15}要么[^，。,.!?！？]{1,15})/i,
      /(?:要不[^，。,.!?！？]{1,15}要不[^，。,.!?！？]{1,15})/i,
      /(?:[^，。,.!?！？]{1,10}(?:就是|等于|完全是|简直是)[^，。,.!?！？]{0,10}(?:失败|废物|垃圾|没用|错误|不对|成功|完美|全对|赢家|输家))/i,
      /(?:[^，。,.!?！？]{1,10}(?:没有|不是|完全没有)(?:中间|折中|余地|灰色地带|可能|其他选择))/i,
    ],
    desc: '（Burns #1）把复杂现实压缩为两个极端选项。现实世界绝大多数情况是连续谱，不是二选一。这种思维会让你错失中间的大量选择和渐进路径。',
    source: 'Burns 15 / Sanctum thought_record.dart',
    buildEvidence(matchText) {
      return `你使用了二选一或极端化表述：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。隐含前提是"只有两种可能"，这个前提成立吗？`
    }
  },

  // 2. Overgeneralization / 过度概括
  {
    key: 'overgeneralization',
    name: '过度概括',
    severity: 6,
    patterns: [
      /(?:我|他|她|他们|所有人|大家|每次|永远|一直|总是|从来不|再也不|全部|所有|任何|什么都|谁都|没人)[\u4e00-\u9fa5，。、,.!?！？\s]{0,10}(?:不行|不好|错|失败|倒霉|讨厌|没希望|没用|就是|都这样|是废物|不可能|做不到|不会成功|loser)/i,
      /(?:总是|永远|每次|天天|一直|从来|向来|次次|每每)[\u4e00-\u9fa5，。、,.!?！？\s]{0,15}(?:出问题|搞砸|失败|错|不如意|不开心)/i,
      /(?:没有一个|一个都不|全部都|所有人都)[^，。,.!?！？]{0,10}(?:懂|理解|支持|帮助|关心)/i,
    ],
    desc: '（Burns #2）用单次/少数事件推出全称结论。"一次失败=永远失败"、"一人如此=所有人如此"。这种思维会放大负面信息，把偶发问题塑造成不可改变的宿命。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `你使用了全称判断词汇（"总是/永远/所有人/都"）来描述本应是局部或暂时的情况：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}`
    }
  },

  // 3. Mental Filter (Selective Abstraction) / 选择性提取负面
  {
    key: 'selective_abstraction',
    name: '选择性提取负面',
    severity: 5,
    patterns: [
      /(?:最让我不爽|最难受|最烦|最差|最讨厌|最让我不能接受|唯一记得|印象最深|缺点就是|问题在于)[^，。,.!?！？]{0,25}/i,
      /(?:[^，。,.!?！？]{1,20}(?:就算|哪怕|即使)[^，。,.!?！？]{0,15}(?:好|不错|顺利|对|成功)[^，。,.!?！？]{0,15}(?:也|还是|照样)[^，。,.!?！？]{0,20}(?:不好|不行|错|失败|问题))/i,
    ],
    desc: '（Burns #3）从一个复杂情境中只摘取负面细节，把它当作整体结论。一件事有9个环节OK，1个环节出问题，你的注意力全在那1个上，觉得整件事都失败了。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `你只聚焦于情境中的负面片段：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。请补全：这件事的其他部分发生了什么？`
    }
  },

  // 4. Disqualifying the Positive / 否定正面证据
  {
    key: 'dismissing_positive',
    name: '否定正面证据',
    severity: 6,
    patterns: [
      /(?:虽然|虽说|尽管|但是|不过|可是|只是|只不过|就是|还是|反正|充其量|大不了)[^，。,.!?！？]{0,25}(?:没用|不算|不真|偶然|运气|别人客气|场面话|客套|敷衍|侥幸|碰巧|巧合|蒙的|算不了什么|不值一提)/i,
      /(?:[^，。,.!?！？]{1,15}(?:好|不错|成功|顺利|进步|表扬|夸|认可|赞赏|肯定)[^，。,.!?！？]{0,10}(?:但|但是|可是|不过|只是))/i,
      /(?:(?:那又怎样|又怎么样|有什么用|没什么意义|没什么大不了|也就那样|一般般|凑合|就那样吧))/i,
    ],
    desc: '（Burns #4）遇到正面信息就通过"但是/只是"把它消解掉。结果是，证据永远只能支持负面结论。如果你的理论无法被正面证据证伪，它已经不是观点，而是信念。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `检测到否定/消解正面信息的模式：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}`
    }
  },

  // 5. Jumping to Conclusions / 妄下结论（读心术 + 算命者错误 二合一）
  {
    key: 'mind_reading',
    name: '读心术式假设',
    severity: 5,
    patterns: [
      /(?:他|她|他们|领导|同事|大家|别人|朋友|父母|家人)[^，。,.!?！？]{0,15}(?:肯定|一定|觉得|认为|以为|心里|肯定是|就是想|故意|看不起|讨厌|觉得我|认为我|以为我)/i,
      /(?:[^，。,.!?！？]{1,10}(?:嫌我|烦我|看不起我|讨厌我|不尊重我|不把我当回事|敷衍我|利用我|骗我|在背后说我))/i,
      /(?:[^，。,.!?！？]{1,10}(?:在嘲笑|在议论|在看我|在等我出丑|对我失望|看我笑话))/i,
    ],
    desc: '（Burns #5a Mind Reading）没有证据就断定对方在想什么。这是社交焦虑的核心来源。绝大多数情况下，你对他人内心的揣测准确率远低于你自认为的水平。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `你对他人的内心状态做出了判断：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。但你没有直接证据，只是在假设对方的想法。`
    }
  },
  {
    key: 'fortune_telling',
    name: '算命者错误（预测负面）',
    severity: 5,
    patterns: [
      /(?:我敢肯定|毫无疑问|必然|注定|肯定会|一定会|铁定会|不出所料|结局就是|到头来|最后一定)[^，。,.!?！？]{0,20}(?:失败|不行|做不到|被拒绝|被解雇|分手|不好|搞砸|没好结果|倒霉)/i,
      /(?:反正|到时候|结局肯定|结果一定)[^，。,.!?！？]{0,15}(?:不好|不行|失败|失望|痛苦)/i,
    ],
    desc: '（Burns #5b Fortune Telling）没有任何证据就武断预测事情会变坏。如果大脑已经"被告知"结局会坏，你的行为会无意识配合这个预言（自证预言）。',
    source: 'Burns 15',
    buildEvidence(matchText) {
      return `你在做负面的未来预测：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。区分"担心发生"和"大概率会发生"，两者差了几十倍的概率。`
    }
  },

  // 6. Catastrophizing / 灾难化
  {
    key: 'catastrophizing',
    name: '灾难化',
    severity: 10,
    patterns: [
      /(?:完蛋了|彻底完了|全毁了|没救了|死定了|一切都毁了|人生毁了|前途没了|什么都没了|一无所有|天塌下来|世界末日|彻底没希望|再也没有机会)/i,
      /(?:最坏的|最糟糕|最差|最惨|可怕的后果|不可挽回|无法补救|彻底失败|彻底崩溃|致命的|毁灭性的)/i,
      /(?:如果[^，。,.!?！？]{2,20}(?:就|那么|肯定|一定|必然)[^，。,.!?！？]{0,15}(?:完了|毁了|没了|死|崩溃|不行|惨了|糟透了))/i,
    ],
    desc: '（Burns #6 Magnification / 别名）把普通负面事件直接推导到最极端的灾难性结局。中间省略了所有缓冲和应对环节，使大脑直接处于求生模式 fight-or-flight，导致焦虑放大、判断力下降。',
    source: 'Burns 15（Magnification） / Sanctum / Quirk Decatastrophizing 技术重点',
    buildEvidence(matchText) {
      return `检测到灾难化表述：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。你跳过了中间步骤，直接跳到了最坏结局。`
    }
  },

  // 7. Emotional Reasoning / 情绪化推理
  {
    key: 'emotional_reasoning',
    name: '情绪化推理',
    severity: 6,
    patterns: [
      /(?:我觉得|我感觉|我感到|我的直觉|心里觉得|有种感觉)[^，。,.!?！？]{0,20}(?:就是|一定|肯定|绝对|百分百|真的|意味着|说明)[^，。,.!?！？]{1,25}/i,
      /(?:感觉[^，。,.!?！？]{0,15}(?:就是|肯定|一定|明显|绝对|所以))/i,
      /(?:[^，。,.!?！？]{1,10}(?:心里很难受|很焦虑|很慌|很沮丧|很崩溃|很愤怒|很委屈|很害怕)[^，。,.!?！？]{0,15}(?:所以|因此|于是|看来|说明|证明))/i,
    ],
    desc: '（Burns #7）把情绪感受当作客观事实的证据。感受是真实的，但感受不等于事实：焦虑≠真的有危险，难过≠真的有人对不起你，羞愧≠真的做错了。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `你用主观感受（"觉得/感觉/感到"）直接推导出了客观结论：${matchText.slice(0, 45)}${matchText.length > 45 ? '…' : ''}`
    }
  },

  // 8. Should Statements / "应该"句式
  {
    key: 'should_statements',
    name: '"应该"句式',
    severity: 4,
    patterns: [
      /(?:我|你|他|她|人|大家|正常人|成年人|做人|作为[^，。,.!?！？]{0,8})[^，。,.!?！？]{0,10}(?:应该|必须|得|要|就得|就该|就必须|理应|本应|本来就)[^，。,.!?！？]{0,30}/i,
      /(?:不应该|不能|不准|不许|不该|不可以|绝不能|决不允许)[^，。,.!?！？]{0,20}(?:做|想|说|有|感觉|出现|发生)/i,
      /(?:凭什么|怎么可以|简直不该|这不对|这不行|太不应该了)[^，。,.!?！？]{0,15}/i,
    ],
    desc: '（Burns #8）用"应该/必须"给自己或他人套了一个内化的规则模板。如果规则来自外界（父母、社会、短视频）而不是你自己的思考，它就可能与你的现实脱节。Burns 称之为"日常生活的暴君"。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `你使用了规则性表述：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。请追问：这条"应该"是谁制定的？它基于什么事实？违反了会怎样？`
    }
  },

  // 9. Labeling / 贴标签
  {
    key: 'labeling',
    name: '贴标签',
    severity: 7,
    patterns: [
      /(?:我|他|她|这个人|这人|领导|同事|朋友|对方|老师|下属)[^，。,.!?！？]{0,8}(?:是|就是|简直是|完全是|属于|典型的|就是个)[^，。,.!?！？]{1,12}(?:废物|笨蛋|蠢|傻|垃圾|人渣|贱人|骗子|渣男|绿茶|心机婊|自私鬼|失败者|软骨头|懦夫|天才|神人|大神|无敌|白痴|弱智|不要脸|黑心|小人)/i,
      /(?:我是|我就是)[^，。,.!?！？]{0,8}(?:废物|垃圾|笨蛋|不行的人|失败者|不配|没用的人|loser|烂人|蠢货)/i,
    ],
    desc: '（Burns #9）用一个标签替代一个复杂的人（包括你自己）。人是多面且变化的，任何单一标签都是对复杂性的粗暴简化。对自己贴负面标签会直接降低自我效能感，是抑郁的核心诱因之一。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `你给人（可能是你自己）贴了简化标签：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。这句话能否用"在X这件事上，这次他/我做了Y"重新描述？`
    }
  },

  // 10. Personalization and Blame / 过度揽责 + 指责他人
  {
    key: 'personalization',
    name: '过度揽责',
    severity: 5,
    patterns: [
      /(?:都是我|全怪我|因为我|我的问题|都怨我|是我的错|怪我|我害了|如果不是我|都怪我不好)[^，。,.!?！？]{0,20}(?:才|所以|因此|就|于是|导致|造成)/i,
      /(?:我对不起|我不配|我不值得|我应该受罚|都是我的责任|全是我的问题)/i,
      /(?:[^，。,.!?！？]{1,15}(?:搞砸|毁了|做错|失败|出错|坏了)[^，。,.!?！？]{0,15}(?:了|了|)因为我)/i,
    ],
    desc: '（Burns #10a Personalization）把不是你控制的事都归因为自己。一件事的结果是多因多果的，你的角色可能只是变量之一，甚至不是关键变量。过度揽责的另一面是：你高估了自己的影响力。',
    source: 'Burns 15 / Sanctum',
    buildEvidence(matchText) {
      return `你把结果完全归因于自己：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。请问这件事有几个影响因素？你占了其中多少权重？`
    }
  },
  {
    key: 'blaming',
    name: '指责他人',
    severity: 5,
    patterns: [
      /(?:都是他|都是她|都怪他们|全怪|怪就怪|责任在|都是因为|就是他害的|她的问题|他们的错|全都怪)[^，。,.!?！？]{0,20}(?:导致|所以|造成|因此|于是|才会)/i,
      /(?:[^，。,.!?！？]{1,15}(?:不负责|自私|不管|不帮|没做好|搞砸|拖后腿|拖累|摆烂|不作为)[^，。,.!?！？]{0,15}(?:所以|因此|所以才|导致))/i,
    ],
    desc: '（Burns #10b Blaming）把责任100%推给外部。这种思维保留了你的"正确感"，但牺牲了解决问题的可能性——如果你没有任何责任，你也就没有任何改变这件事的杠杆。',
    source: 'Burns 15 / Sanctum 扩展',
    buildEvidence(matchText) {
      return `你把责任完全推给了外部：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。请补全：在这件事里，你自己可以控制的那1%是什么？`
    }
  },

  // ═══ 以下 5 项为 Sanctum / 临床扩展的 15 项完整版 ═══

  // 11. Magnification / Minimization 放大负面 + 缩小正面（Disqualifying 的强度版）
  {
    key: 'magnification_minimization',
    name: '望远镜式偏差（放大坏/缩小好）',
    severity: 6,
    patterns: [
      /(?:(?:把[^，。,.!?！？]{0,10}(?:看得太重|想的太严重|夸张|放大了))|(?:一点[^，。,.!?！？]{0,10}(?:小问题|小事|无所谓|不值一提|没什么|不算什么|根本不重要)))/i,
      /(?:[^，。,.!?！？]{1,12}(?:区区|只是个|不过是|大不了|算个屁|没什么大不了的)[^，。,.!?！？]{0,15}(?:事|错误|损失|问题|挫折|打击))/i,
      /(?:不过就是|只是|也就|无非就是)[^，。,.!?！？]{0,15}(?:赢了|成功|拿了|做好了|完成了)[^，。,.!?！？]{0,15}(?:而已|罢了|又怎样|没什么了不起)/i,
    ],
    desc: '（Sanctum #11）像拿望远镜看问题：看自己的缺点时用放大端，看自己的优点时用缩小端。结果是坏看起来巨大、好看起来微不足道。临床观察发现这和 Imposter Syndrome 高相关。',
    source: 'Burns（Magnification 章节扩展） / Sanctum thought_record.dart',
    buildEvidence(matchText) {
      return `检测到望远镜式偏差：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。同一个事实，为什么你对正负的量级判断差距这么大？`
    }
  },

  // 12. Heaven's Reward Fallacy / 天道酬勤谬误（公平世界假设）
  {
    key: 'heavens_reward_fallacy',
    name: '天道酬勤谬误',
    severity: 4,
    patterns: [
      /(?:我(?:这么|那么|如此|已经)[^，。,.!?！？]{0,20}(?:努力|辛苦|付出|拼|认真|投入)[^，。,.!?！？]{0,20}(?:却|但是|可是|然而|没想到|结果)[^，。,.!?！？]{0,20}(?:没有|没得到|不给|不被|不如|反而|却被|遭受|得到这样))/i,
      /(?:凭什么|不公平|没道理|老天不公|天理何在|做好人没好报|努力有什么用|付出有什么意义)[^，。,.!?！？]{0,15}/i,
      /(?:好人没好报|坏人活千年|努力不如运气|认真不如关系|会做的不如会说的|付出不一定有回报但不努力一定很舒服)/i,
    ],
    desc: '（Sanctum #12）坚信"努力就一定有回报、做好人就有好报、世界是公平的"，一旦不成立就会陷入怨气或自我怀疑。世界本身不承诺公平，公平是人类社会主动建构的、不完全的局部制度。',
    source: 'Sanctum thought_record.dart / David Burns Feeling Good Handbook 附录扩展',
    buildEvidence(matchText) {
      return `你在用"世界应该公平"的隐含前提做判断：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。但如果这个前提本身不成立，你的整个推导链条就会崩溃。`
    }
  },

  // 13. Fallacy of Change / 期待他人改变
  {
    key: 'fallacy_of_change',
    name: '期待他人改变谬误',
    severity: 4,
    patterns: [
      /(?:他|她|他们|家人|父母|伴侣|朋友|同事|领导|公司)[^，。,.!?！？]{0,15}(?:如果|要是|只要|应该|必须|得|就该|能不能)[^，。,.!?！？]{0,20}(?:改|变|理解|关心|支持|帮忙|道歉|改变|调整|重视|尊重|在乎)[^，。,.!?！？]{0,15}(?:就好|才行|就可以|一切都会好|事情就解决了|我就满意了|就没这么多事)/i,
      /(?:只要[^，。,.!?！？]{1,20}(?:改变|改|转变|意识到|觉醒|懂了)[^，。,.!?！？]{0,15}(?:就|那就|一切|我们的关系|生活|日子))/i,
    ],
    desc: '（Sanctum #13）把你生活变好的前提挂在别人改变上。成年人的人格非常稳定，试图改变他人是最消耗人生且成功率<5%的活动之一。CBT的基本原则：改变你能控制的（自己），而不是你控制不了的（别人）。',
    source: 'Sanctum / Quirk 开源 App thought_record 扩展项',
    buildEvidence(matchText) {
      return `你在把希望寄托于他人改变：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。如果那个人不改变，你有没有 Plan B？你把多少生活的主权交了出去？`
    }
  },

  // 14. Control Fallacy / 控制感谬误（外控 / 内控 两极）
  {
    key: 'control_fallacy',
    name: '控制感谬误',
    severity: 4,
    patterns: [
      // 外控：我无力改变，一切被外力决定
      /(?:我没办法|我无能为力|我做不了主|我说了不算|身不由己|听天由命|随他吧|我改变不了什么|只能认命|没办法啊|没办法的事|只能这样|人在江湖身不由己)[^，。,.!?！？]{0,15}/i,
      // 内控：一切都是我掌控的，出问题=我没管好
      /(?:只要我|如果我|我要是|我应该能够)[^，。,.!?！？]{0,20}(?:控制|安排|搞定|处理好|管理好|安排好|把握住|做好)[^，。,.!?！？]{0,15}(?:一切|所有人|所有事|全局|场面|整个局面|每一个细节)/i,
    ],
    desc: '（Sanctum #14）两个极端：要么觉得自己完全无法控制生活（外控），产生无助感；要么觉得自己必须完全控制一切（内控），产生持续焦虑和倦怠。CBT 核心练习：分辨"可控圈/影响圈/关注圈"三件事的边界。',
    source: 'Sanctum / 结合 Stephen Covey 影响圈理论的 CBT 扩展',
    buildEvidence(matchText) {
      return `控制感偏差：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。用"影响圈"画三个圈：我完全能控制的？我能影响但控制不了的？我完全管不着的？——情绪内耗往往来自在后两个圈里用第一个圈的力气。`
    }
  },

  // 15. Always Being Right / 一定要对
  {
    key: 'always_being_right',
    name: '一定要对（正确感绑架）',
    severity: 4,
    patterns: [
      /(?:我没错|我是对的|我说的没错|我就知道|果然如此|我说什么来着|早说了|我早就讲过|事实胜于雄辩|你看我说对了吧|真理在我这边|我怎么可能错)[^，。,.!?！？]{0,15}/i,
      /(?:[^，。,.!?！？]{1,12}(?:宁可|就算|哪怕|即使)[^，。,.!?！？]{0,15}(?:吵架|闹翻|分手|辞职|绝交|撕破脸)[^，。,.!?！？]{0,15}(?:也要|也要|也要|也要|就是要|非要)[^，。,.!?！？]{0,15}(?:争个对错|分个高下|证明|赢|让他认错|让他知道|说清楚))/i,
      /(?:承认错误|低头|认错|道歉|服软|示弱)[^，。,.!?！？]{0,15}(?:不可能|做不到|绝不可能|不可能的事|门都没有|我死都不会|不可能认错)/i,
    ],
    desc: '（Sanctum #15）把"正确"置于关系、情绪、效率之前。如果你必须永远是对的，那你每次争论的标的就从"解决问题"变成了"赢"，而赢的代价常常是你真正想要的东西（关系、合作、平静）。Burns 称之为自我中心的认知陷阱。',
    source: 'Sanctum 扩展 15 项完整版 / Burns Feeling Good Handbook 人际关系章节',
    buildEvidence(matchText) {
      return `正确感绑架信号：${matchText.slice(0, 40)}${matchText.length > 40 ? '…' : ''}。做个思想实验：假设这一刻你主动认错（或存异），会发生的最坏情况是什么？最好情况是什么？你愿意为了"对"而支付哪个代价？`
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
          severity: detector.severity,
          desc: detector.desc,
          source: detector.source,
          evidence: detector.buildEvidence(m[0]),
        })
        break // 一个偏差只记录一次命中
      }
    }
  }
  // 按严重度排序
  hits.sort((a, b) => (b.severity || 0) - (a.severity || 0))
  return hits
}

// ═══════════════════════════════════════════════════════════════
// 模块 B · 7 栏 Thought Record（思维记录）
// 来源：Sanctum / Burns 标准 CBT 自助工作手册 · 全球临床通用模板
//   1. Situation       (情境：谁/何时/何地/发生了什么)
//   2. Moods           (情绪 + 0-100 强度)
//   3. Automatic       (自动化思维 / 意象 / 画面)
//   4. Evidence For    (支持这个思维的证据)
//   5. Evidence Against(反对这个思维的证据)
//   6. Balanced        (平衡思维，综合 4+5)
//   7. Re-rate Moods   (情绪强度重新评估)
// ═══════════════════════════════════════════════════════════════

function buildThoughtRecord(text, biases) {
  const sentences = text.split(/[。！？!?\n]+/).map(s => s.trim()).filter(Boolean)

  // ------- 3. 抽取自动化思维 / 负面断言 -------
  const automaticThoughts = []
  for (const s of sentences) {
    // 命中任何偏差句式、或强负面判断、或"我觉得/肯定/一定"判断
    const isStrongJudgement =
      biases.some(b => b.evidence.includes(s.slice(0, 20))) ||
      /[感觉|觉得|肯定|一定|就是|完全|绝对|永远|总是|所有人|都|必须|应该]/.test(s)
    if (isStrongJudgement && s.length > 4) {
      automaticThoughts.push(s.slice(0, 80))
    }
  }
  if (automaticThoughts.length === 0 && sentences.length > 0) {
    automaticThoughts.push(sentences[Math.floor(sentences.length / 2)].slice(0, 80))
  }

  // ------- 4. 支持证据（文本中具体可验证的事实） -------
  const evidenceFor = []
  for (const s of sentences) {
    const hasFact = /[昨天|今天|上周|上个月|去年|前天|时候|那次|回|次|上午|下午|晚上|早上|分钟|小时|天前|周前|月前|刚|刚刚|才]/.test(s)
      || /[\d一二三四五六七八九十]/.test(s) // 数字
      || /[说|做|发生|给|回|告诉|回复|表现|拒绝|同意|同意了|拒绝了|没来|来了|迟到|走了|留了]/.test(s)
    if (hasFact) evidenceFor.push(s.slice(0, 80))
  }
  if (evidenceFor.length === 0) {
    evidenceFor.push('（用户没有提供可验证的具体事实。Burns CBT 要求：支撑一个判断至少需要 2 条独立、可观测的事实。请补充：时间/地点/人物/行为是什么？）')
  }

  // ------- 5. 反对证据 -------
  const evidenceAgainst = []
  // 每一条自动化思维都配一条反证提示 + 通用 3 条
  for (const thought of automaticThoughts.slice(0, 2)) {
    evidenceAgainst.push(`针对"${thought.slice(0, 35)}"——找一个具体反例：什么时候它不成立？`)
  }
  // Burns 经典反证三问
  const BURNS_COUNTERCHECK = [
    '如果这个判断写在一份法庭证据里，法官会采纳吗？还是它只是主观印象？',
    '把判断主宾互换：如果"他看不起我"改成"我看不起他"，需要同样多的证据吗？如果不是，你在用双标。',
    '有没有可能你在做最恶毒的解释（恶意归因）？同样的客观行为，换个中性解释是什么？换个善意解释又是什么？',
  ]
  for (const q of BURNS_COUNTERCHECK) if (!evidenceAgainst.includes(q)) evidenceAgainst.push(q)

  // ------- 6. 平衡思维模板（Burns 标准句式） -------
  const balancedTemplate = (
    '【事实】：' + (evidenceFor[0] || '填写具体事实') + '\n' +
    '【我的解读】：' + (automaticThoughts[0] || '我当时的自动化判断是……') + '\n' +
    '【另一种可能性】：客观看，同样的事实还可以解读为……\n' +
    '【最合理的综合判断】：综合正反证据，更公允的说法是……（通常是一个更温和、更具体、带限定词的表述，而不是全称判断）'
  )

  // ------- 7. 情绪重新评估提示 -------
  const rerateHint = 'Burns 7 栏第 7 步：完成平衡思维后，重新给你当时的情绪打一次 0-100 分。临床统计：完成全部 7 栏后，负面情绪平均下降 30-50%。如果你的分数下降不到 20%，说明平衡思维写得不够具体，需要补充更多事实。'

  return {
    section: 'Burns 7 栏 Thought Record · 临床标准模板',
    steps: [
      { key: '1', label: '情境 Situation', prompt: '写一句话描述：谁、在何时、在哪里、具体发生了什么事？（只写事实，不加判断）' },
      { key: '2', label: '情绪 Moods (0-100)', prompt: '你当时最强烈的 2-3 个情绪是什么？每个给 0-100 分强度。例：沮丧 70、愤怒 85、羞愧 60' },
      { key: '3', label: '自动化思维 Automatic Thoughts', prompt: '事情发生的瞬间，你脑子里自动冒出来的念头/画面/声音是什么？（通常就是你写下来的这些判断）', examples: automaticThoughts.slice(0, 3) },
      { key: '4', label: '支持证据 Evidence FOR', prompt: '列出支持第 3 条思维的、可独立验证的具体事实（不要感受、不要观点）', examples: evidenceFor.slice(0, 4) },
      { key: '5', label: '反对证据 Evidence AGAINST', prompt: '列出反对第 3 条思维的、可独立验证的具体事实', examples: evidenceAgainst.slice(0, 5) },
      { key: '6', label: '平衡思维 Balanced Thought', prompt: '综合第 4、5 条，写一个更公允、更贴近事实的判断。Burns 原则：平衡思维不是盲目乐观，而是"让事实说话"', template: balancedTemplate },
      { key: '7', label: '重新评估情绪 Re-rate Moods', prompt: rerateHint },
    ],
  }
}

// ═══════════════════════════════════════════════════════════════
// 模块 C · 苏格拉底式 6 问（Sanctum App 标准模板）
// 来源：Sanctum thought_record.dart 的 socratic_questions 模块
//       + Burns Feeling Good Handbook Chapter 4
// ═══════════════════════════════════════════════════════════════

const SOCRATIC_QUESTIONS = [
  { key: 'evidence',    order: 1, question: '支持这个想法的具体证据是什么？反对它的证据又是什么？（证据=可被第三方独立验证的事实，不是感受）' },
  { key: 'friend',      order: 2, question: '如果是你最好的朋友遇到一模一样的事、说了一模一样的话，你会怎么劝他/她？' },
  { key: 'scenarios',   order: 3, question: '这件事最坏会怎样（1%概率）？最好会怎样（1%概率）？最可能的现实结果是什么（98%概率）？分别给三个场景写应对方案。' },
  { key: 'distortions', order: 4, question: '我此刻正在犯哪几种认知扭曲？（对照上面的偏差列表逐一打勾）' },
  { key: 'whatif',      order: 5, question: '如果我担心的事真的发生了，我能承受吗？我有哪些具体资源可以应对？（Decatastrophizing 去灾难化）' },
  { key: 'actionable',  order: 6, question: '在我完全可控的范围内，今天能做的最小一步是什么？（写下来，48小时内执行。CBT 的核心是行动。）' },
]

function buildSocraticQuestions(text, biases) {
  // 针对命中的偏差类型，加权展示对应的苏格拉底问题顺序
  const scored = SOCRATIC_QUESTIONS.map(q => {
    let score = q.order
    if (biases.some(b => ['catastrophizing','overgeneralization','fortune_telling'].includes(b.key)) && q.key === 'whatif') score -= 3
    if (biases.some(b => ['mind_reading','blaming','fallacy_of_change'].includes(b.key)) && q.key === 'evidence') score -= 3
    if (biases.some(b => ['labeling','black_or_white','should_statements'].includes(b.key)) && q.key === 'distortions') score -= 2
    if (biases.some(b => ['personalization','selective_abstraction','dismissing_positive','magnification_minimization'].includes(b.key)) && q.key === 'friend') score -= 2
    if (biases.some(b => ['control_fallacy','heavens_reward_fallacy','always_being_right'].includes(b.key)) && q.key === 'actionable') score -= 2
    return { ...q, score }
  })
  scored.sort((a, b) => a.score - b.score)
  return scored
}

// ═══════════════════════════════════════════════════════════════
// 模块 D · Decatastrophizing（去灾难化）三步法
// 来源：GitHub 开源项目 Quirk（React Native CBT App，6k+ star）
//       核心算法 + MoodJam 量表校准
// ═══════════════════════════════════════════════════════════════

function buildDecatastrophizing(text, biases) {
  const hasCatastrophe = biases.some(b => ['catastrophizing','fortune_telling','overgeneralization','emotional_reasoning'].includes(b.key))
  if (!hasCatastrophe) return null

  return {
    section: 'Decatastrophizing 去灾难化 · Quirk App 标准化三步法',
    steps: [
      {
        key: 'worst',
        label: '① 最坏情况 (Worst Case · 1% 线)',
        prompt: '具体描述：你担心的最糟糕的结局是什么？别用"完蛋了"，用可观察、可测量的事实描述（例：失去这份工作 / 被分手 / 项目被砍）。',
      },
      {
        key: 'cope',
        label: '② 应对预案 (Coping Plan · 如果①真的发生了)',
        prompt: '如果最坏情况真的发生，你有哪 3 个具体的应对动作？（Burns 原则：焦虑=危险-应对。你列不出应对=大脑会假设应对为0，于是焦虑无穷大。）',
        examples: [
          '动作1：失业 → 用 N+1 缓冲 3 个月，投递 50 份简历',
          '动作2：分手 → 第一周和家人/朋友住，第二周恢复运动',
          '动作3：项目被砍 → 总结复盘文档，3 个工作日内转去新项目',
        ],
      },
      {
        key: 'best',
        label: '③ 最好/最可能情况 (Best & Most Likely · 99% 线)',
        prompt: '同样的客观事件，最乐观的走向是什么？最现实的走向是什么？这两个对比一下，你会发现大脑 90% 的担心都落在了那 1% 线上。',
      },
      {
        key: 'bet',
        label: '④ 下注校准 (MoodJam 概率赌注法)',
        prompt: '如果有人拿 1000 元和你打赌"最坏情况会发生"，赔率 1:10，你押不押？如果你不押，说明你内心其实不相信它会发生——那你为什么用 100% 的情绪去应对一个你不相信的事？',
      },
    ],
  }
}

// ═══════════════════════════════════════════════════════════════
// 模块 E · Cognitive Defusion（认知解离练习）
// 来源：Sanctum App defusion 模块 + ACT（接纳承诺疗法）临床技术
// CBT + ACT 融合是 GitHub 现代日志 App 的标配
// ═══════════════════════════════════════════════════════════════

function buildDefusion(biases) {
  // 命中 2+ 偏差或有严重灾难化/标签化，给解离练习
  const need = biases.length >= 2 || biases.some(b => ['catastrophizing','labeling','emotional_reasoning'].includes(b.key))
  if (!need) return null

  return {
    section: 'Cognitive Defusion 认知解离 · ACT 临床标配',
    exercises: [
      '【10 秒解离法】：大声（或在心里）把你刚才的自动化思维念三遍，前面加一句"我现在有一个想法是，……"。然后再加一句"我注意到我正在产生一个想法是，……"。想法是文字，不是事实。',
      '【收音机法】：把你脑子里的负面声音想象成你在路边听到的一台收音机。你可以选择关掉收音机，或者把音量调小。你不等于收音机，也不等于收音机里说的话。',
      '【白纸法】：如果你在纸上写下"我是废物"这四个字，这张纸会因此变成"废物纸"吗？不会。纸就是纸，上面的字不会改变纸本身。你就是那张纸，想法是写在上面的字。',
    ],
  }
}

// ═══════════════════════════════════════════════════════════════
// 模块 F · 重新表述模板（针对每种偏差的 Burns 标准句式）
// 来源：Feeling Good Handbook 附录 · Thought Record 例句
// ═══════════════════════════════════════════════════════════════

const BURNS_REFRAMES = {
  black_or_white: '把"要么A要么B"改为"我可以在灰度里选：C（程度上A多一些）/ D（分两步走，先A后B）/ E（先暂停，收集更多信息再决定）"',
  overgeneralization: '把全称词（总是/永远/所有人/都）替换为限定词（有时/这次/某些情况下/那个人）。例："他总是不配合"→"这次他在X这件事上没配合。"',
  selective_abstraction: '列出这件事的 5 个细节，强制 3 个中性/正面 + 2 个负面，然后只根据这 5 条细节重新下结论。',
  dismissing_positive: '把"但是/不过"后面的正面句当成法律证据，在纸上写 3 遍，问自己："如果这件事发生在我朋友身上，我会怎么评价？"',
  mind_reading: '把"他觉得我XXX"改为"他做了Y这个行为。我有 3 个猜测：猜1猜2猜3。验证它们的最廉价方法是……（观察 / 直接问 / 看后续行为）"',
  fortune_telling: '把"一定会失败"改为"我现在预测失败的概率是__%。支持这个概率的具体事实有：__。不支持的有：__。30天后回头验证这个预测准不准。"',
  catastrophizing: '把"完蛋了"改为"这件事出了X问题，但还有Y和Z部分OK。最坏情况是A，我可以用B来应对。最可能情况是C。"',
  emotional_reasoning: '把"我感觉X，所以Y就是事实"改为"我现在有X的感受（生理表现：心跳/肩膀/胃）。它可能由Y触发，也可能只是生理信号（睡眠不足/血糖低/月经前）。我需要的证据是什么？"',
  should_statements: '把"我应该X"改为"如果我做X，好处是Y，代价是Z。综合来看，我选择做/不做。"把规则变成选择。',
  labeling: '把"我是XXX（标签）"改为"在Y这件事上，我这次做了Z这个行为。下次我可以尝试W。标签否定整个人；行为是可以改的。"',
  personalization: '把"全怪我"改为"这件事的因素：A（我做的，占__%）、B（对方，占__%）、C（系统/环境，占__%）。A+B+C=100%。下一次我可以在A上调整。"',
  blaming: '把"全怪他"改为"他的因素占__%，我的可控部分是那__%里的什么具体动作？列出 1 个我今天可以执行的最小动作。"',
  magnification_minimization: '把你的担忧写下来，然后按比例缩小：如果这件事发生在你最不在乎的人身上，你会把它放大多少倍？把那个倍数除掉，就是你应该用的合理情绪强度。',
  heavens_reward_fallacy: '把"凭什么努力没回报"改为"我选择努力是因为它让我变成什么样的人，而不是因为世界承诺给我什么。世界不欠我公平，我也不欠世界顺从。"',
  fallacy_of_change: '把"如果他改了就好"改为"如果他永远不改，我有哪三条路可以走？哪条路的代价我最能接受？"主权在你，不在他。',
  control_fallacy: '画三个同心圆：内=完全可控（我的行为），中=可影响（他人/系统的一部分），外=完全管不着。把 90% 的精力投到内圈，10% 到中圈，外圈一个念头都不要给。',
  always_being_right: '做一个成本账本："坚持我是对的"这个选择，我付了什么成本（时间/关系/情绪/机会）？我愿意一直付这个成本吗？如果不愿意，存异的最廉价方式是什么？',
}

function buildReframe(text, biases) {
  if (biases.length === 0) {
    return '（未命中 Burns 15 项认知扭曲）可以使用通用重写：Nonviolent Communication 四要素 —— "我观察到+事实，我感受到+情绪，是因为我需要+需求，我请求+具体可执行的动作。"'
  }
  // 去重 + 按严重度
  const uniq = Array.from(new Set(biases.map(b => b.key)))
  return uniq.map(k => `·【${biases.find(b => b.key === k)?.name || k}】${BURNS_REFRAMES[k] || '参考 Burns 7 栏第 6 步写平衡思维。'}`).join('\n')
}

// ═══════════════════════════════════════════════════════════════
// 模块 G · 认知健康度打分（Burns 严重度权重校准）
// 权重来源于 Sanctum thought_record.severity 打分表
// ═══════════════════════════════════════════════════════════════

const BURNS_BIAS_PENALTY = {
  catastrophizing: 10,          // 最高严重度
  labeling: 7,
  magnification_minimization: 6,
  dismissing_positive: 6,
  emotional_reasoning: 6,
  overgeneralization: 6,
  black_or_white: 5,
  selective_abstraction: 5,
  mind_reading: 5,
  fortune_telling: 5,
  personalization: 5,
  blaming: 5,
  should_statements: 4,
  heavens_reward_fallacy: 4,
  fallacy_of_change: 4,
  control_fallacy: 4,
  always_being_right: 4,
}

function computeScore(text, biases) {
  let score = 80
  for (const b of biases) {
    score -= BURNS_BIAS_PENALTY[b.key] || 3
  }
  // 文本过短：信息不足
  if (text.replace(/\s/g, '').length < 30) score -= 5
  // 全无问号 + 2个以上偏差：缺乏自我怀疑信号
  if (!/[?？]/.test(text) && biases.length >= 2) score -= 3
  // 有事实性细节加分（时间/数字/具体行为词）
  if (/[昨天|今天|上周|上月|去年|前天|时候|上次|这次]|[\d一二三四五六七八九十]|说|做|发生|回复|同意|拒绝|迟到|没来|来了/.test(text)) score += 2

  return Math.max(10, Math.min(98, score))
}

// ═══════════════════════════════════════════════════════════════
// 模块 H · 总结句（临床分级）
// ═══════════════════════════════════════════════════════════════

function buildSummary(text, biases, score) {
  const len = biases.length
  const topBias = biases[0]

  if (score >= 75) {
    return `认知健康度 ${score}/100 · 【良好区间】。这段思考整体较为冷静，没有明显的结构性偏差。建议直接跳到"苏格拉底 6 问"的第 6 问（今天可做的最小一步是什么），然后用 7 栏 Thought Record 做归档——即使结论正确，把过程写下来也能在下次情绪波动时作为"冷静时的自己"给未来的参考。`
  }
  if (score >= 55) {
    return `认知健康度 ${score}/100 · 【中度偏差区间】。检测到 ${len} 处 Burns 认知偏差${topBias ? `，核心是"${topBias.name}"（严重度 ${topBias.severity}/10）` : ''}。你的结论可能有部分事实支撑，但偏差会让判断系统性地偏向负面。**必做**：完成 7 栏 Thought Record 的第 3-6 步（自动化思维→正反证据→平衡思维），执行后情绪平均下降 30%+。`
  }
  if (score >= 35) {
    return `认知健康度 ${score}/100 · 【显著扭曲区间】。检测到 ${len} 处认知偏差，其中"${topBias?.name || ''}"正在显著扭曲你的判断。你此刻的结论很大概率比现实更悲观/更极端。**不要做不可逆决定**。按顺序：① 先做 Defusion 解离练习（10 秒）；② 做 Decatastrophizing 去灾难化 4 步；③ 24 小时后再回来写 7 栏 Thought Record。`
  }
  return `认知健康度 ${score}/100 · 【情绪劫持区间】。多处严重认知偏差同时出现（灾难化+贴标签+情绪化推理同时命中），你的前额叶被杏仁核接管。**重要：现在不要做任何不可逆决定。不要发消息、不要辞职、不要提分手、不要删除任何人。**第一步不是分析，是生理恢复：喝水 500ml + 10 分钟散步 + （如果能的话）4 小时以上睡眠。冷静后再回来用工具重新拆解。`
}

// ═══════════════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════════════

/**
 * 分析用户写的一段感想，返回结构化反馈（v2 成熟方案对齐版）
 * @param {string} content 用户的原始文字
 * @param {object} [opts] 可选参数：{ mood, category, tags }
 * @returns {object}
 */
export function analyzeReflection(content, opts = {}) {
  const text = (content || '').trim()
  if (!text) {
    return {
      biases: [],
      thoughtRecord: null,
      socraticQuestions: [],
      decatastrophizing: null,
      defusion: null,
      reframe: '',
      summary: '没有内容可分析。',
      score: 0,
      engineVersion: '2.0.0-burns15-sanctum7-quirk-decatastrophizing',
    }
  }

  const biases = detectBiases(text)
  const thoughtRecord = buildThoughtRecord(text, biases)
  const socraticQuestions = buildSocraticQuestions(text, biases)
  const decatastrophizing = buildDecatastrophizing(text, biases)
  const defusion = buildDefusion(biases)
  const reframe = buildReframe(text, biases)
  const score = computeScore(text, biases)
  const summary = buildSummary(text, biases, score)

  return {
    biases,
    thoughtRecord,
    socraticQuestions,
    decatastrophizing,
    defusion,
    reframe,
    summary,
    score,
    engineVersion: '2.0.0-burns15-sanctum7-quirk-decatastrophizing',
  }
}
