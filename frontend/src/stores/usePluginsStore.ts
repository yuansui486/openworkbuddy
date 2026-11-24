/**
 * 插件市场状态管理
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PluginCategory = 'featured' | 'ecommerce' | 'tools' | 'data' | 'communication'
export type PluginSource = 'official' | 'third_party'
export type AuthStatus = 'authorized' | 'unauthorized' | 'none'

export interface Plugin {
  id: string
  name: string
  publisher: string
  publisherIcon?: string  // 发布者图标 URL
  iconUrl?: string        // 插件图标 URL
  iconColor?: string      // 图标背景色
  iconText?: string       // 图标文字（无图片时用）
  description: string
  category: PluginCategory
  source: PluginSource
  authStatus: AuthStatus  // 授权状态
  installed: boolean
  featured?: boolean
  tags?: string[]
  version?: string        // 插件版本
}

const MARKETPLACE_PLUGINS: Plugin[] = [
  // ===== 精选 =====
  {
    id: 'accio-sourcing',
    name: 'Accio 采购工具箱',
    publisher: 'Accio Work',
    iconColor: '#000000',
    iconText: 'A',
    description: '您的 24/7 AI 采购（sourcing）团队，我们寻找最佳供应商、处理谈判，并管理从工厂到门口的订单。',
    category: 'featured',
    source: 'official',
    authStatus: 'none',
    installed: false,
    featured: true,
    version: '1.0.0',
    tags: ['采购', 'AI', '供应链']
  },
  {
    id: 'alibaba-international',
    name: '国际站生意助手',
    publisher: 'Accio Work',
    iconColor: '#ff6600',
    iconText: '阿',
    description: '阿里巴巴国际站（Alibaba.com）跨境外贸B2B卖家经营助手，为国际店铺/商家/卖家提供选品、发品、商品发布与优化...',
    category: 'featured',
    source: 'official',
    authStatus: 'unauthorized',
    installed: true,
    featured: true,
    version: '1.0.0',
    tags: ['阿里巴巴', '国际站', 'B2B']
  },
  {
    id: 'okki-crm',
    name: 'OKKI CRM',
    publisher: 'OKKI',
    iconColor: '#1890ff',
    iconText: 'CRM',
    description: '专注于外贸业务经营的智能体，擅长客户全生命周期管理、外贸商机及订单全链路跟进及追踪、经营数据洞察，助力业务持续...',
    category: 'featured',
    source: 'third_party',
    authStatus: 'none',
    installed: false,
    featured: true,
    version: '1.0.0',
    tags: ['CRM', '客户管理', '外贸']
  },
  {
    id: 'shopify',
    name: 'Shopify',
    publisher: 'Accio Work',
    iconColor: '#96bf48',
    iconText: 'S',
    description: 'Shopify建站与运营插件：把 Agent 接入你的 Shopify 店铺，从 0 到发布上线，再到日常运营—选品寻源、目录与批量上架...',
    category: 'ecommerce',
    source: 'official',
    authStatus: 'none',
    installed: false,
    featured: true,
    version: '1.0.0',
    tags: ['Shopify', '独立站', '建站']
  },
  {
    id: 'shopline',
    name: 'SHOPLINE',
    publisher: 'SHOPLINE',
    iconColor: '#000000',
    iconText: 'SL',
    description: '从开店第一步到日常经营，用对话轻松搭建和管理 SHOPLINE 店铺。带你注册开店、准备商品、装修页面、做好上线准备...',
    category: 'ecommerce',
    source: 'third_party',
    authStatus: 'none',
    installed: false,
    featured: true,
    version: '1.0.0',
    tags: ['SHOPLINE', '独立站', '电商']
  },
  {
    id: 'cross-border-design',
    name: '跨境电商设计',
    publisher: 'Accio Work',
    iconColor: '#52c41a',
    iconText: '设',
    description: '全流程量商品素材分析、商品图片生成、品牌策划和营销投放四大能力模块，支持输入商品链接、商品图片或国际店铺链接...',
    category: 'tools',
    source: 'official',
    authStatus: 'none',
    installed: false,
    featured: true,
    version: '1.0.0',
    tags: ['设计', 'AI生图', '营销']
  },
  {
    id: '1688-helper',
    name: '1688采购助手',
    publisher: 'Accio Work',
    iconColor: '#ff9800',
    iconText: '16',
    description: '连接1688批发平台，智能选品、比价、下单，帮助卖家找到性价比最高的货源。',
    category: 'ecommerce',
    source: 'official',
    authStatus: 'unauthorized',
    installed: false,
    version: '1.0.0',
    tags: ['1688', '批发', '采购']
  },
  {
    id: 'data-analyzer',
    name: '数据分析工具',
    publisher: 'Accio Work',
    iconColor: '#9c27b0',
    iconText: '数',
    description: '强大的数据分析工具，支持销售数据、流量数据、用户行为分析，生成可视化报表。',
    category: 'data',
    source: 'official',
    authStatus: 'none',
    installed: false,
    version: '1.0.0',
    tags: ['数据分析', '报表', '可视化']
  }
]

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem('alibaba_installed_plugins')
    if (raw) {
      const ids: string[] = JSON.parse(raw)
      return new Set(ids)
    }
  } catch {}
  return new Set(['alibaba-international'])
}

interface PluginsStore {
  installedIds: Set<string>
  allPlugins: Plugin[]
  authStatuses: Record<string, AuthStatus> // 授权状态

  // Computed
  installedPlugins: Plugin[]
  marketplacePlugins: Plugin[]
  featuredPlugins: Plugin[]
  pluginsByCategory: Record<string, Plugin[]>

  // Actions
  installPlugin: (id: string) => void
  uninstallPlugin: (id: string) => void
  getPluginById: (id: string) => Plugin | undefined
  updateAuthStatus: (id: string, status: AuthStatus) => void
}

export const usePluginsStore = create<PluginsStore>()(
  persist(
    (set, get) => {
      const saveToStorage = () => {
        try {
          localStorage.setItem('alibaba_installed_plugins',
            JSON.stringify([...get().installedIds]))
        } catch {}
      }

      const initialInstalledIds = loadFromStorage()
      const initialAuthStatuses: Record<string, AuthStatus> = {}

      return {
        installedIds: initialInstalledIds,
        authStatuses: initialAuthStatuses,
        allPlugins: MARKETPLACE_PLUGINS.map(p => ({
          ...p,
          installed: initialInstalledIds.has(p.id)
        })),

        get installedPlugins() {
          const { allPlugins, installedIds } = get()
          return allPlugins.filter(p => installedIds.has(p.id))
        },

        get marketplacePlugins() {
          return get().allPlugins
        },

        get featuredPlugins() {
          return get().allPlugins.filter(p => p.featured)
        },

        get pluginsByCategory() {
          const map: Record<string, Plugin[]> = {}
          for (const p of get().allPlugins) {
            if (!map[p.category]) map[p.category] = []
            map[p.category].push(p)
          }
          return map
        },

        installPlugin: (id) => {
          set((state) => {
            const newInstalledIds = new Set(state.installedIds)
            newInstalledIds.add(id)

            return {
              installedIds: newInstalledIds,
              allPlugins: state.allPlugins.map(p =>
                p.id === id ? { ...p, installed: true } : p
              )
            }
          })
          saveToStorage()
        },

        uninstallPlugin: (id) => {
          set((state) => {
            const newInstalledIds = new Set(state.installedIds)
            newInstalledIds.delete(id)

            return {
              installedIds: newInstalledIds,
              allPlugins: state.allPlugins.map(p =>
                p.id === id ? { ...p, installed: false } : p
              )
            }
          })
          saveToStorage()
        },

        getPluginById: (id) => {
          return get().allPlugins.find(p => p.id === id)
        },

        updateAuthStatus: (id, status) => {
          set((state) => ({
            authStatuses: { ...state.authStatuses, [id]: status },
            allPlugins: state.allPlugins.map(p =>
              p.id === id ? { ...p, authStatus: status } : p
            )
          }))
        }
      }
    },
    {
      name: 'plugins-storage',
      partialize: (state) => ({
        installedIds: Array.from(state.installedIds),
        authStatuses: state.authStatuses
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        installedIds: new Set(persistedState?.installedIds || []),
        authStatuses: persistedState?.authStatuses || {}
      })
    }
  )
)
