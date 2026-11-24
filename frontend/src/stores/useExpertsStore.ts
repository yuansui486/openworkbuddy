/**
 * 专家状态管理
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Expert {
  id: string
  name: string
  avatar?: string        // 头像 URL
  avatarColor: string    // 头像背景色
  avatarText: string     // 头像文字
  specialty: string      // 专长描述
  description: string
  tags: string[]
  rating: number         // 评分 1-5
  responseTime: string   // 响应时间描述
  skills: string[]       // 关联技能 (skill IDs)
  plugins: string[]      // 关联插件 (plugin IDs)
  systemPrompt: string   // 核心指令
  knowledgeFiles: string[] // 知识库文件列表
  online: boolean
  verified: boolean
  category?: string      // 专家分类
  createdAt?: number
  updatedAt?: number
}

export interface ExpertTeam {
  id: string
  name: string
  description: string
  members: string[]      // Expert IDs
  createdAt: number
}

const BUILT_IN_EXPERTS: Expert[] = [
  {
    id: 'global-trade-expert',
    name: '跨境贸易专家',
    avatarColor: '#1677ff',
    avatarText: '贸',
    specialty: '国际站运营 · RFQ · 买家管理',
    description: '专注于阿里巴巴国际站卖家运营，擅长 RFQ 商机挖掘、买家背调与询盘转化，帮助中小外贸企业开拓海外市场。',
    tags: ['国际贸易', 'RFQ', '买家分析', '询盘优化'],
    rating: 4.8,
    responseTime: '通常在几秒内响应',
    skills: ['alibaba-global-rfq-discovery', 'alibaba-global-chat-analysis-pro', 'alibaba-global-buyercheck-bgcheck'],
    plugins: ['alibaba-international'],
    systemPrompt: '你是跨境贸易专家，专注于阿里巴巴国际站卖家运营。',
    knowledgeFiles: [],
    online: true,
    verified: true,
    category: 'ecommerce',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'product-operation-expert',
    name: '商品运营专家',
    avatarColor: '#52c41a',
    avatarText: '品',
    specialty: '商品发布 · SEO优化 · 类目分析',
    description: '深耕跨境电商商品运营，提供商品标题、详情、关键词优化，助力商品排名提升和曝光增长。',
    tags: ['商品优化', 'SEO', '类目规划', '图片优化'],
    rating: 4.7,
    responseTime: '通常在几秒内响应',
    skills: ['alibaba-global-smart-publish', 'alibaba-global-smart-optimize', 'alibaba-global-product-deep-dive'],
    plugins: ['alibaba-international'],
    systemPrompt: '你是商品运营专家，专注于商品发布与优化。',
    knowledgeFiles: [],
    online: true,
    verified: true,
    category: 'ecommerce',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'data-analyst-expert',
    name: '数据分析师',
    avatarColor: '#722ed1',
    avatarText: '析',
    specialty: '店铺数据 · 市场趋势 · 竞品研究',
    description: '专注于跨境电商数据分析，整合多平台数据，提供市场趋势洞察、竞品分析和经营优化建议。',
    tags: ['数据分析', '市场调研', '竞品分析', '趋势预测'],
    rating: 4.9,
    responseTime: '通常在几秒内响应',
    skills: ['alibaba-global-store-diagnosis', 'alibaba-global-blue-ocean-finder', 'alibaba-global-hot-product-insight'],
    plugins: ['alibaba-international'],
    systemPrompt: '你是数据分析师，专注于电商数据分析与市场洞察。',
    knowledgeFiles: [],
    online: true,
    verified: true,
    category: 'data',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'logistics-expert',
    name: '物流专家',
    avatarColor: '#fa8c16',
    avatarText: '运',
    specialty: '国际物流 · 关税 · 清关',
    description: '熟悉全球主流物流渠道，提供运费估算、物流方案对比、清关建议，帮助优化供应链成本。',
    tags: ['国际物流', '关税计算', '清关', '供应链'],
    rating: 4.6,
    responseTime: '通常在几秒内响应',
    skills: ['alibaba-global-logistics-assistant'],
    plugins: [],
    systemPrompt: '你是物流专家，擅长国际物流与供应链管理。',
    knowledgeFiles: [],
    online: false,
    verified: true,
    category: 'logistics',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'ai-content-expert',
    name: 'AI 内容创作专家',
    avatarColor: '#eb2f96',
    avatarText: '创',
    specialty: '文案创作 · 视频脚本 · 营销内容',
    description: '结合 AI 技术与营销经验，高效生成产品描述、营销文案、视频脚本，支持多语言内容创作。',
    tags: ['文案创作', '多语言', '视频脚本', 'AI生成'],
    rating: 4.8,
    responseTime: '通常在几秒内响应',
    skills: ['alibaba-global-ai-image-studio', 'alibaba-global-smart-publish'],
    plugins: ['alibaba-international'],
    systemPrompt: '你是AI内容创作专家，擅长文案与营销内容创作。',
    knowledgeFiles: [],
    online: true,
    verified: false,
    category: 'ecommerce',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'amazon-expert',
    name: '亚马逊运营专家',
    avatarColor: '#ff9900',
    avatarText: '亚',
    specialty: '亚马逊 · FBA · PPC广告',
    description: '专注亚马逊平台运营，提供选品分析、Listing 优化、PPC 广告策略和 FBA 管理建议。',
    tags: ['亚马逊', 'FBA', 'PPC', 'Listing优化'],
    rating: 4.7,
    responseTime: '通常在几秒内响应',
    skills: ['alibaba-global-amazon-market-intel'],
    plugins: [],
    systemPrompt: '你是亚马逊运营专家，专注于亚马逊平台运营。',
    knowledgeFiles: [],
    online: true,
    verified: true,
    category: 'ecommerce',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

// 内置专家团
const BUILT_IN_TEAMS: ExpertTeam[] = [
  {
    id: 'team-global-trade',
    name: '跨境电商全链路团队',
    description: '覆盖选品、运营、营销、物流全流程，为跨境卖家提供一站式运营建议。',
    members: ['global-trade-expert', 'product-operation-expert', 'data-analyst-expert', 'logistics-expert'],
    createdAt: Date.now()
  },
  {
    id: 'team-amazon',
    name: '亚马逊增长专家团',
    description: '专注亚马逊卖家运营，从市场情报到广告优化全链路支持。',
    members: ['amazon-expert', 'data-analyst-expert', 'ai-content-expert'],
    createdAt: Date.now()
  },
  {
    id: 'team-content',
    name: 'AI 内容创作工作室',
    description: '商品文案、营销海报、短视频脚本一站式创作团队。',
    members: ['ai-content-expert', 'product-operation-expert'],
    createdAt: Date.now()
  }
]

export interface ResolvedExpertTeam {
  id: string
  name: string
  description: string
  members: Expert[]
  createdAt: number
}

function loadStoredTeams(): ExpertTeam[] {
  try {
    const raw = localStorage.getItem('alibaba_expert_teams')
    if (raw) {
      const parsed = JSON.parse(raw) as ExpertTeam[]
      return parsed.length ? parsed : [...BUILT_IN_TEAMS]
    }
  } catch {}
  return [...BUILT_IN_TEAMS]
}

interface ExpertsStore {
  experts: Expert[]
  teams: ExpertTeam[]
  activeTab: 'expert' | 'team'

  // Computed
  allExperts: Expert[]
  expertTeams: ResolvedExpertTeam[]
  onlineExperts: Expert[]
  offlineExperts: Expert[]

  // Actions
  getExpertById: (id: string) => Expert | undefined
  addExpert: (expert: Omit<Expert, 'id' | 'rating' | 'responseTime' | 'verified' | 'createdAt' | 'updatedAt'>) => Expert
  updateExpert: (id: string, updates: Partial<Expert>) => void
  deleteExpert: (id: string) => void
  createTeam: (name: string, description: string, memberIds: string[]) => ExpertTeam
  deleteTeam: (id: string) => void
  setActiveTab: (tab: 'expert' | 'team') => void
}

export const useExpertsStore = create<ExpertsStore>()(
  persist(
    (set, get) => {
      const saveTeams = () => {
        try {
          localStorage.setItem('alibaba_expert_teams', JSON.stringify(get().teams))
        } catch {}
      }

      return {
        experts: BUILT_IN_EXPERTS,
        teams: loadStoredTeams(),
        activeTab: 'expert',

        get allExperts() {
          return get().experts
        },

        get expertTeams() {
          const { teams, experts } = get()
          return teams.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            createdAt: t.createdAt,
            members: t.members
              .map(id => experts.find(e => e.id === id))
              .filter((e): e is Expert => Boolean(e))
          }))
        },

        get onlineExperts() {
          return get().experts.filter(e => e.online)
        },

        get offlineExperts() {
          return get().experts.filter(e => !e.online)
        },

        getExpertById: (id) => {
          return get().experts.find(e => e.id === id)
        },

        addExpert: (expertData) => {
          const newExpert: Expert = {
            ...expertData,
            id: `expert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            rating: 5.0,
            responseTime: '通常在几秒内响应',
            verified: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }

          set((state) => ({
            experts: [...state.experts, newExpert]
          }))

          return newExpert
        },

        updateExpert: (id, updates) => {
          set((state) => ({
            experts: state.experts.map(e =>
              e.id === id
                ? { ...e, ...updates, updatedAt: Date.now() }
                : e
            )
          }))
        },

        deleteExpert: (id) => {
          set((state) => ({
            experts: state.experts.filter(e => e.id !== id),
            teams: state.teams.map(t => ({
              ...t,
              members: t.members.filter(mid => mid !== id)
            }))
          }))
          saveTeams()
        },

        createTeam: (name, description, memberIds) => {
          const team: ExpertTeam = {
            id: `team-${Date.now()}`,
            name,
            description,
            members: memberIds,
            createdAt: Date.now()
          }

          set((state) => ({ teams: [...state.teams, team] }))
          saveTeams()
          return team
        },

        deleteTeam: (id) => {
          set((state) => ({
            teams: state.teams.filter(t => t.id !== id)
          }))
          saveTeams()
        },

        setActiveTab: (tab) => set({ activeTab: tab })
      }
    },
    {
      name: 'alibaba-experts-storage',
      version: 1,
      partialize: (state) => ({
        experts: state.experts,
        teams: state.teams
      })
    }
  )
)
