/**
 * 技能执行日志存储
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SkillResult } from '@/services/skill-executor'

export interface SkillLog {
  id: string
  skillId: string
  skillName: string
  triggeredBy: string
  params: any
  result: SkillResult
  timestamp: number
  duration: number
  status: 'success' | 'error'
}

interface SkillLogsStore {
  logs: SkillLog[]

  // Actions
  addLog: (log: Omit<SkillLog, 'id'>) => void
  getLogs: (skillId?: string) => SkillLog[]
  getRecentLogs: (limit?: number) => SkillLog[]
  clearLogs: () => void
  deleteLog: (id: string) => void
}

function generateId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useSkillLogsStore = create<SkillLogsStore>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (log) => {
        set((state) => ({
          logs: [
            {
              ...log,
              id: generateId()
            },
            ...state.logs
          ].slice(0, 1000) // 保留最近 1000 条
        }))
      },

      getLogs: (skillId) => {
        const logs = get().logs
        return skillId ? logs.filter((l) => l.skillId === skillId) : logs
      },

      getRecentLogs: (limit = 50) => {
        return get().logs.slice(0, limit)
      },

      clearLogs: () => {
        set({ logs: [] })
      },

      deleteLog: (id) => {
        set((state) => ({
          logs: state.logs.filter((l) => l.id !== id)
        }))
      }
    }),
    {
      name: 'skill-logs'
    }
  )
)
