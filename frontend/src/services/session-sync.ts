/**
 * 会话同步服务
 * 同步电脑端和手机端的会话状态、消息、任务等
 */

import { remoteServer, type RemoteCommand, type RemoteResponse } from './remote-server'
import { useChatStore } from '@/stores/useChatStore'
import { useTasksStore } from '@/stores/useTasksStore'
import { useSkillsStore } from '@/stores/useSkillsStore'

export interface SyncState {
  lastSyncTime: number
  pendingChanges: number
}

class SessionSync {
  private syncInterval: NodeJS.Timeout | null = null
  private readonly SYNC_INTERVAL_MS = 5000 // 每 5 秒同步一次

  /**
   * 初始化会话同步
   */
  initialize() {
    console.log('[SessionSync] 初始化会话同步服务')

    // 注册命令处理器
    this.registerCommandHandlers()

    // 开始定期同步
    this.startPeriodicSync()
  }

  /**
   * 停止会话同步
   */
  stop() {
    console.log('[SessionSync] 停止会话同步服务')
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * 注册远程命令处理器
   */
  private registerCommandHandlers() {
    // 执行技能
    remoteServer.registerHandler('execute_skill', async (command: RemoteCommand) => {
      const { skillId, prompt } = command.payload

      try {
        // 导入技能执行器
        const { skillExecutor } = await import('./skill-executor')
        const { useSkillsStore: getSkillsStore } = await import('@/stores/useSkillsStore')
        const skill = getSkillsStore.getState().getAllSkills().find(s => s.id === skillId)

        if (!skill) {
          throw new Error('技能不存在')
        }

        const result = await skillExecutor.executeSkill(skill, { message: prompt })

        return {
          success: true,
          data: result,
          timestamp: Date.now()
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '执行失败',
          timestamp: Date.now()
        }
      }
    })

    // 发送消息
    remoteServer.registerHandler('send_message', async (command: RemoteCommand) => {
      const { message, conversationId } = command.payload

      try {
        const chatStore = useChatStore.getState()
        const convId = conversationId || chatStore.activeConvId || chatStore.getOrCreateConversation().id

        chatStore.addMessage(convId, {
          role: 'user',
          content: message,
          status: 'done'
        })

        return {
          success: true,
          data: { conversationId: convId },
          timestamp: Date.now()
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '发送失败',
          timestamp: Date.now()
        }
      }
    })

    // 控制任务
    remoteServer.registerHandler('control_task', async (command: RemoteCommand) => {
      const { taskId, action } = command.payload

      try {
        const tasksStore = useTasksStore.getState()

        switch (action) {
          case 'start':
            tasksStore.toggleTask(taskId)
            break
          case 'pause':
            tasksStore.toggleTask(taskId)
            break
          case 'execute':
            await tasksStore.executeTask(taskId)
            break
          case 'delete':
            tasksStore.deleteTask(taskId)
            break
          default:
            throw new Error(`不支持的操作: ${action}`)
        }

        return {
          success: true,
          timestamp: Date.now()
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '操作失败',
          timestamp: Date.now()
        }
      }
    })

    // 获取状态
    remoteServer.registerHandler('get_status', async (command: RemoteCommand) => {
      const { type } = command.payload

      try {
        let data: any = {}

        switch (type) {
          case 'chat':
            const chatStore = useChatStore.getState()
            const conv = chatStore.activeConversation
            data = {
              conversations: chatStore.conversations.slice(-5), // 最近 5 个会话
              activeConversation: conv
            }
            break

          case 'tasks':
            const tasksStore = useTasksStore.getState()
            data = {
              tasks: tasksStore.allTasks,
              activeCount: tasksStore.allTasks.filter((t: any) => t.status === 'active').length
            }
            break

          case 'skills':
            const skillsStore = useSkillsStore.getState()
            const allSkills = skillsStore.getAllSkills()
            data = {
              skills: allSkills,
              enabledCount: allSkills.filter(s => s.enabled).length
            }
            break

          default:
            // 返回所有状态
            const cs = useChatStore.getState()
            data = {
              chat: cs.conversations.slice(-3),
              tasks: useTasksStore.getState().allTasks,
              skills: useSkillsStore.getState().getAllSkills().slice(0, 10)
            }
        }

        return {
          success: true,
          data,
          timestamp: Date.now()
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '获取状态失败',
          timestamp: Date.now()
        }
      }
    })
  }

  /**
   * 开始定期同步
   */
  private startPeriodicSync() {
    // 清除旧的定时器
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    // 设置新的定时器
    this.syncInterval = setInterval(() => {
      this.syncStatus()
    }, this.SYNC_INTERVAL_MS)
  }

  /**
   * 同步状态到所有连接的设备
   */
  private syncStatus() {
    const devices = remoteServer.getConnectedDevices()
    if (devices.length === 0) {
      return
    }

    // 收集需要同步的状态
    const chatStore = useChatStore.getState()
    const tasksStore = useTasksStore.getState()

    const status = {
      type: 'status_update',
      data: {
        timestamp: Date.now(),
        chat: {
          conversationCount: chatStore.conversations.length,
          lastConversation: chatStore.activeConversation
        },
        tasks: {
          total: tasksStore.allTasks.length,
          active: tasksStore.allTasks.filter(t => t.status === 'active').length,
          running: tasksStore.allTasks.filter(t => t.status === 'running').length
        }
      }
    }

    // 广播到所有设备
    remoteServer.broadcast(status)
  }

  /**
   * 手动触发同步
   */
  async manualSync(): Promise<void> {
    console.log('[SessionSync] 手动触发同步')
    this.syncStatus()
  }

  /**
   * 获取同步状态
   */
  getSyncState(): SyncState {
    return {
      lastSyncTime: Date.now(),
      pendingChanges: 0
    }
  }
}

// 导出单例
export const sessionSync = new SessionSync()

// 自动初始化（可选）
if (typeof window !== 'undefined') {
  // 延迟初始化，等待 stores 就绪
  setTimeout(() => {
    sessionSync.initialize()
  }, 3000)

  // 页面卸载时停止
  window.addEventListener('beforeunload', () => {
    sessionSync.stop()
  })
}
