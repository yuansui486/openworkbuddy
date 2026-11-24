/**
 * 定时任务状态管理
 */
import { create } from 'zustand'

export type TaskStatus = 'active' | 'paused' | 'running' | 'failed'

export interface ScheduledTask {
  id: string
  name: string
  description: string
  skillId: string
  skillName: string
  prompt: string
  frequency: string        // 每天 | 每周 | 每月 | 自定义
  cronExpr?: string
  nextRunAt: string        // 显示用字符串
  lastRunAt?: string       // 显示用字符串
  lastResult?: string
  status: TaskStatus
  createdAt: string
  tags: string[]
}

function fmt(d: Date): string {
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const tomorrow9 = new Date()
tomorrow9.setDate(tomorrow9.getDate() + 1)
tomorrow9.setHours(9, 0, 0, 0)

const nextMonday9 = new Date()
nextMonday9.setDate(nextMonday9.getDate() + (8 - nextMonday9.getDay()) % 7 + 1)
nextMonday9.setHours(9, 0, 0, 0)

const yesterday9 = new Date()
yesterday9.setDate(yesterday9.getDate() - 1)
yesterday9.setHours(9, 0, 0, 0)

const DEMO_TASKS: ScheduledTask[] = [
  {
    id: 'demo-rfq-daily',
    name: '每日 RFQ 商机筛选',
    description: '每天早上自动搜索最新 RFQ 询盘，筛选高价值商机并发送汇总报告',
    skillId: 'alibaba-global-rfq-discovery',
    skillName: 'RFQ 商机发现',
    prompt: '请帮我搜索今天最新的 RFQ 询盘，重点关注电子产品类目，价值超过 $5000 的询盘，列出前 10 个最有价值的商机',
    frequency: '每天',
    nextRunAt: fmt(tomorrow9),
    lastRunAt: fmt(yesterday9),
    lastResult: '今日发现 23 条 RFQ，筛选出 5 条高价值询盘',
    status: 'active',
    createdAt: fmt(new Date(Date.now() - 7 * 24 * 3600 * 1000)),
    tags: ['每天', 'RFQ']
  },
  {
    id: 'demo-shop-weekly',
    name: '每周店铺健康诊断',
    description: '每周一自动分析店铺运营数据，生成健康诊断报告并提出改进建议',
    skillId: 'alibaba-global-smart-diagnose',
    skillName: '店铺智能诊断',
    prompt: '请对我的店铺进行全面健康诊断，分析过去7天的访客、询盘、商品曝光数据，给出本周的运营建议',
    frequency: '每周',
    nextRunAt: fmt(nextMonday9),
    lastRunAt: fmt(new Date(Date.now() - 7 * 24 * 3600 * 1000 + 9 * 3600 * 1000)),
    lastResult: '本周店铺评分 82 分，主推商品曝光下降 15%，建议优化标题关键词',
    status: 'active',
    createdAt: fmt(new Date(Date.now() - 30 * 24 * 3600 * 1000)),
    tags: ['每周', '诊断']
  }
]

const STORAGE_KEY = 'alibaba_tasks'

function loadFromStorage(): ScheduledTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : [...DEMO_TASKS]
  } catch {
    return [...DEMO_TASKS]
  }
}

/** 根据频率计算下一次运行时间 */
function calcNextRun(frequency: string): string {
  const d = new Date()
  if (frequency === '每天') {
    d.setDate(d.getDate() + 1)
  } else if (frequency === '每周') {
    d.setDate(d.getDate() + 7)
  } else if (frequency === '每月') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setDate(d.getDate() + 1)
  }
  d.setHours(9, 0, 0, 0)
  return fmt(d)
}

interface TasksStore {
  allTasks: ScheduledTask[]

  // Actions
  createTask: (data: Omit<ScheduledTask, 'id' | 'createdAt'>) => void
  updateTask: (id: string, data: Partial<ScheduledTask>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  executeTask: (id: string) => Promise<string>
}

export const useTasksStore = create<TasksStore>((set, get) => {
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().allTasks))
    } catch {}
  }

  return {
    allTasks: loadFromStorage(),

    createTask: (data) => {
      const task: ScheduledTask = {
        ...data,
        id: `task-${Date.now()}`,
        createdAt: fmt(new Date())
      }

      set((state) => ({ allTasks: [task, ...state.allTasks] }))
      persist()
    },

    updateTask: (id, data) => {
      set((state) => ({
        allTasks: state.allTasks.map(t => t.id === id ? { ...t, ...data } : t)
      }))
      persist()
    },

    deleteTask: (id) => {
      set((state) => ({ allTasks: state.allTasks.filter(t => t.id !== id) }))
      persist()
    },

    toggleTask: (id) => {
      set((state) => ({
        allTasks: state.allTasks.map(t =>
          t.id === id
            ? { ...t, status: t.status === 'active' ? 'paused' : 'active' }
            : t
        )
      }))
      persist()
    },

    /**
     * 执行一个任务（调用 MCP 工具 + LLM 整合结果）
     * 由 TasksView 触发（手动立即执行）或调度器定时触发
     */
    executeTask: async (id) => {
      const task = get().allTasks.find(t => t.id === id)
      if (!task) throw new Error('任务不存在')

      // 标记运行中
      get().updateTask(id, { status: 'running' })

      try {
        // 动态导入，避免循环依赖
        const { callMcpTool, extractToolText } = await import('@/services/mcp')
        const { chatOnce, initLLM } = await import('@/services/llm')

        // 读取 LLM 配置
        let llmResult = ''
        try {
          const { useSettingsStore } = await import('@/stores/useSettingsStore')
          const settingsStore = useSettingsStore()
          if (settingsStore.isLLMConfigured) {
            initLLM(settingsStore.llm)
          }

          // 先通过技能 ID 调用对应的 MCP 工具
          let toolOutput = ''
          try {
            const mcpResult = await callMcpTool(task.skillId, {
              query: task.prompt,
              memberId: settingsStore.auth.memberId || '',
              shopId: settingsStore.auth.shopId || ''
            })
            toolOutput = extractToolText(mcpResult)
          } catch (e) {
            // MCP 不可用时仅用 LLM
            toolOutput = ''
          }

          // 用 LLM 整合结果
          const systemPrompt = '你是阿里巴巴国际站卖家运营助手，请基于提供的数据给出简洁的分析报告。'
          const userContent = toolOutput
            ? `${task.prompt}\n\n【数据来源】\n${toolOutput}`
            : task.prompt
          const msgs = [{
            id: 'q',
            role: 'user' as const,
            content: userContent,
            status: 'done' as const,
            createdAt: Date.now()
          }]
          llmResult = await chatOnce(msgs, systemPrompt)
        } catch (e) {
          llmResult = `执行失败：${e instanceof Error ? e.message : String(e)}`
        }

        const result = llmResult || '任务已执行，无输出'
        const now = fmt(new Date())
        get().updateTask(id, {
          status: 'active',
          lastRunAt: now,
          lastResult: result.slice(0, 200) + (result.length > 200 ? '...' : ''),
          nextRunAt: calcNextRun(task.frequency)
        })
        persist()
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        get().updateTask(id, { status: 'failed', lastResult: `执行失败：${msg}` })
        persist()
        throw e
      }
    }
  }
})
