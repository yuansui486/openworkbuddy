import { create } from 'zustand'

export interface Skill {
  id: string
  name: string
  description: string
  icon?: string
  category: 'ggs' | 'cgs' | 'general'
  triggers: string[]
  enabled: boolean
  skillMdPath?: string
}

// 完整技能列表，来自 plugin.json 逆向分析
export const GGS_SKILLS: Skill[] = [
  {
    id: 'alibaba-global-smart-publish',
    name: '智能发品',
    description: 'GGS 国际站发品：素材包、外站商品URL、Excel批量发品，支持模版。',
    category: 'ggs',
    triggers: ['发品', '上架商品', '发布产品', 'publish', '素材发品', 'Excel发品'],
    enabled: true
  },
  {
    id: 'alibaba-global-smart-optimize',
    name: '商品优化',
    description: '编辑优化已发布/草稿商品：标题、描述、价格、图片等字段。',
    category: 'ggs',
    triggers: ['优化商品', '编辑商品', '修改价格', '完善标题', 'optimize', '提升商品质量分'],
    enabled: true
  },
  {
    id: 'alibaba-global-rfq-discovery',
    name: 'RFQ 商机发现',
    description: '搜索国际站 RFQ（Request for Quotation）商机，智能匹配报价机会。',
    category: 'ggs',
    triggers: ['RFQ', '商机', '询盘搜索', '找商机', '搜索RFQ'],
    enabled: true
  },
  {
    id: 'alibaba-global-store-diagnosis',
    name: '店铺诊断',
    description: '月度店铺经营健康诊断、指标分析、改善建议。',
    category: 'ggs',
    triggers: ['店铺诊断', '经营分析', '店铺报告', '月度诊断'],
    enabled: true
  },
  {
    id: 'alibaba-global-chat-analysis-pro',
    name: '询盘分析',
    description: '对话历史分析、高意向买家筛选、询盘质量评估、智能回复。',
    category: 'ggs',
    triggers: ['询盘分析', '聊天分析', '买家分析', '回复询盘', '高意向买家'],
    enabled: true
  },
  {
    id: 'alibaba-global-buyercheck-bgcheck',
    name: '买家背调',
    description: '对潜在买家公司进行背景调查，评估客户质量和风险。',
    category: 'ggs',
    triggers: ['买家背调', '客户调查', '公司背景', '背景调查', 'buyer check'],
    enabled: true
  },
  {
    id: 'alibaba-global-ai-image-studio',
    name: 'AI 图片工作室',
    description: '商品图片智能处理：背景替换、图片优化、批量生成营销素材。',
    category: 'ggs',
    triggers: ['图片处理', 'AI图片', '背景替换', '商品图优化', '图片生成'],
    enabled: true
  },
  {
    id: 'alibaba-global-blue-ocean-finder',
    name: '蓝海选品',
    description: '发现低竞争高潜力品类，助力选品决策。',
    category: 'ggs',
    triggers: ['蓝海选品', '选品分析', '蓝海市场', '低竞争品类'],
    enabled: true
  },
  {
    id: 'alibaba-global-hot-product-insight',
    name: '爆品洞察',
    description: '分析当前热销品趋势，发现爆品机会。',
    category: 'ggs',
    triggers: ['爆品', '热销品', '趋势分析', '爆款洞察'],
    enabled: true
  },
  {
    id: 'alibaba-global-amazon-market-intel',
    name: 'Amazon 市场情报',
    description: '获取亚马逊市场数据，分析竞品与市场机会。',
    category: 'ggs',
    triggers: ['亚马逊', 'Amazon', '竞品分析', '市场情报', 'amazon数据'],
    enabled: true
  },
  {
    id: 'alibaba-global-logistics-assistant',
    name: '物流助手',
    description: '物流方案咨询、运费计算、关税查询、海运/空运建议。',
    category: 'ggs',
    triggers: ['物流', '运费', '关税', '海运', '空运', '物流方案'],
    enabled: true
  },
  {
    id: 'alibaba-global-product-deep-dive',
    name: '商品深度分析',
    description: '对指定商品进行全面深度分析，包含竞争力评估。',
    category: 'ggs',
    triggers: ['商品分析', '深度分析', '产品分析', '竞争力分析'],
    enabled: true
  },
  {
    id: 'alibaba-global-knowledge-base',
    name: '知识库',
    description: '上传并管理店铺知识库文档，支持 RAG 检索增强。',
    category: 'ggs',
    triggers: ['知识库', '上传文档', '知识管理', 'RAG', '文档检索'],
    enabled: true
  },
  {
    id: 'alibaba-global-create-website',
    name: '独立站建站',
    description: 'AI 辅助创建独立站落地页和产品页。',
    category: 'ggs',
    triggers: ['独立站', '建站', '落地页', 'landing page'],
    enabled: true
  },
  {
    id: 'alibaba-global-smart-assistant-settings',
    name: '助手设置',
    description: '配置智能接待、自动回复规则和助手行为偏好。',
    category: 'ggs',
    triggers: ['助手设置', '自动接待', '回复规则', '智能接待设置'],
    enabled: true
  }
]

export const CGS_SKILLS: Skill[] = [
  {
    id: 'alibaba-rfq-discovery',
    name: 'RFQ 商机',
    description: '搜索中国站 RFQ 商机。',
    category: 'cgs',
    triggers: ['RFQ', '商机'],
    enabled: true
  },
  {
    id: 'alibaba-analysis-brief',
    name: '经营分析',
    description: '店铺经营数据分析简报。',
    category: 'cgs',
    triggers: ['经营分析', '数据分析', '店铺数据'],
    enabled: true
  },
  {
    id: 'alibaba-data-advisor',
    name: '数据参谋',
    description: '深度数据分析与建议。',
    category: 'cgs',
    triggers: ['数据参谋', '数据洞察'],
    enabled: true
  },
  {
    id: 'alibaba-market-analysis',
    name: '市场分析',
    description: '行业市场趋势分析。',
    category: 'cgs',
    triggers: ['市场分析', '行业趋势'],
    enabled: true
  },
  {
    id: 'alibaba-product-optimization',
    name: '商品优化',
    description: '中国站商品内容优化。',
    category: 'cgs',
    triggers: ['优化商品', '商品内容'],
    enabled: true
  },
  {
    id: 'alibaba-buyer-bgcheck',
    name: '买家背调',
    description: '买家背景调查。',
    category: 'cgs',
    triggers: ['买家背调', '客户调查'],
    enabled: true
  },
  {
    id: 'alibaba-logistics-assistant',
    name: '物流助手',
    description: '物流与关税咨询。',
    category: 'cgs',
    triggers: ['物流', '运费', '关税'],
    enabled: true
  },
  {
    id: 'alibaba-ads-marketing-analysis',
    name: '广告分析',
    description: 'P4P 广告效果分析与优化建议。',
    category: 'cgs',
    triggers: ['广告', 'P4P', '推广'],
    enabled: true
  },
  {
    id: 'alibaba-competitor-analysis',
    name: '竞品分析',
    description: '竞争对手分析。',
    category: 'cgs',
    triggers: ['竞品', '竞争分析', '对手分析'],
    enabled: true
  },
  {
    id: 'alibaba-blue-ocean-finder',
    name: '蓝海选品',
    description: '低竞争高潜力品类发现。',
    category: 'cgs',
    triggers: ['蓝海选品', '选品'],
    enabled: true
  },
  {
    id: 'alibaba-local-data-analysis',
    name: '本地数据分析',
    description: '使用 SQLite 本地数据库进行自定义维度 SQL 分析。',
    category: 'cgs',
    triggers: ['本地数据', 'SQL', 'SQLite', '自定义分析'],
    enabled: true
  },
  {
    id: 'alibaba-scheduled-task',
    name: '定时任务',
    description: '设置定时执行的自动化任务。',
    category: 'cgs',
    triggers: ['定时任务', '自动执行', '定期'],
    enabled: true
  }
]

interface SkillsStore {
  allSkills: Skill[]
  activeSkillId: string | null
  customSkills: Skill[]
  skillConfigs: Record<string, SkillConfig>

  // Computed
  ggsSkills: Skill[]
  cgsSkills: Skill[]
  enabledSkills: Skill[]

  // Actions
  getSkillById: (id: string) => Skill | undefined
  getAllSkills: () => Skill[]
  matchSkill: (text: string) => Skill | null
  setActiveSkill: (id: string | null) => void
  toggleSkill: (id: string, enabled: boolean) => void
  addCustomSkill: (skill: Skill) => void
  removeCustomSkill: (id: string) => void
  updateSkillConfig: (id: string, config: SkillConfig) => void
  getSkillConfig: (id: string) => SkillConfig | undefined
}

export interface SkillConfig {
  enabled: boolean
  autoExecute: boolean
  requireConfirm: boolean
  params: Record<string, any>
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  allSkills: [...GGS_SKILLS, ...CGS_SKILLS],
  activeSkillId: null,
  customSkills: [],
  skillConfigs: {},

  get ggsSkills() {
    return get().getAllSkills().filter(s => s.category === 'ggs')
  },

  get cgsSkills() {
    return get().getAllSkills().filter(s => s.category === 'cgs')
  },

  get enabledSkills() {
    return get().getAllSkills().filter(s => s.enabled)
  },

  getSkillById: (id) => {
    return get().getAllSkills().find(s => s.id === id)
  },

  getAllSkills: () => {
    return [...get().allSkills, ...get().customSkills]
  },

  matchSkill: (text) => {
    const lower = text.toLowerCase()
    const enabledSkills = get().getAllSkills().filter(s => s.enabled)

    for (const skill of enabledSkills) {
      if (skill.triggers.some(t => lower.includes(t.toLowerCase()))) {
        return skill
      }
    }
    return null
  },

  setActiveSkill: (id) => set({ activeSkillId: id }),

  toggleSkill: (id, enabled) => {
    set((state) => ({
      allSkills: state.allSkills.map(s => s.id === id ? { ...s, enabled } : s),
      customSkills: state.customSkills.map(s => s.id === id ? { ...s, enabled } : s)
    }))
  },

  addCustomSkill: (skill) => {
    set((state) => ({
      customSkills: [...state.customSkills, skill]
    }))
  },

  removeCustomSkill: (id) => {
    set((state) => ({
      customSkills: state.customSkills.filter(s => s.id !== id)
    }))
  },

  updateSkillConfig: (id, config) => {
    set((state) => ({
      skillConfigs: {
        ...state.skillConfigs,
        [id]: config
      }
    }))
  },

  getSkillConfig: (id) => {
    return get().skillConfigs[id]
  }
}))
