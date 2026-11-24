/**
 * 定时任务调度器
 * 负责在后台监控所有 active 状态的任务，按 cron 表达式或频率定时触发
 */

import { useTasksStore, type ScheduledTask } from '@/stores/useTasksStore'
import { parseCronExpression, getNextRunTime } from './cron-parser'

interface SchedulerState {
  running: boolean
  timers: Map<string, NodeJS.Timeout>
  lastCheck: number
}

class TaskScheduler {
  private state: SchedulerState = {
    running: false,
    timers: new Map(),
    lastCheck: 0
  }

  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL_MS = 60000 // 每分钟检查一次

  /**
   * 启动调度器
   */
  start() {
    if (this.state.running) {
      console.warn('[TaskScheduler] 调度器已在运行')
      return
    }

    console.log('[TaskScheduler] 启动任务调度器')
    this.state.running = true
    this.scheduleTasks()

    // 定期检查并重新调度
    this.checkInterval = setInterval(() => {
      this.scheduleTasks()
    }, this.CHECK_INTERVAL_MS)
  }

  /**
   * 停止调度器
   */
  stop() {
    if (!this.state.running) {
      return
    }

    console.log('[TaskScheduler] 停止任务调度器')
    this.state.running = false

    // 清除所有定时器
    this.state.timers.forEach(timer => clearTimeout(timer))
    this.state.timers.clear()

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * 调度所有活跃任务
   */
  private scheduleTasks() {
    const store = useTasksStore.getState()
    const activeTasks = store.allTasks.filter(t => t.status === 'active')

    console.log(`[TaskScheduler] 调度 ${activeTasks.length} 个活跃任务`)

    activeTasks.forEach(task => {
      this.scheduleTask(task)
    })

    // 清理已删除或暂停的任务定时器
    this.state.timers.forEach((timer, taskId) => {
      const exists = activeTasks.find(t => t.id === taskId)
      if (!exists) {
        clearTimeout(timer)
        this.state.timers.delete(taskId)
      }
    })
  }

  /**
   * 调度单个任务
   */
  private scheduleTask(task: ScheduledTask) {
    // 如果已有定时器，先清除
    if (this.state.timers.has(task.id)) {
      clearTimeout(this.state.timers.get(task.id)!)
    }

    const nextRun = this.calculateNextRun(task)
    if (!nextRun) {
      console.warn(`[TaskScheduler] 无法计算任务 ${task.name} 的下次执行时间`)
      return
    }

    const delay = nextRun.getTime() - Date.now()

    // 如果延迟时间为负数或过小，说明应该立即执行
    if (delay <= 0) {
      console.log(`[TaskScheduler] 任务 ${task.name} 应该立即执行`)
      this.executeTask(task)
      return
    }

    // 如果延迟时间超过检查间隔，只设置到下一个检查点
    const actualDelay = Math.min(delay, this.CHECK_INTERVAL_MS)

    console.log(`[TaskScheduler] 任务 ${task.name} 将在 ${Math.round(actualDelay / 1000)}秒后执行`)

    const timer = setTimeout(() => {
      this.executeTask(task)
    }, actualDelay)

    this.state.timers.set(task.id, timer)
  }

  /**
   * 计算任务的下次执行时间
   */
  private calculateNextRun(task: ScheduledTask): Date | null {
    const now = new Date()

    // 如果有自定义 cron 表达式
    if (task.frequency === '自定义' && task.cronExpr) {
      return getNextRunTime(task.cronExpr, now)
    }

    // 根据频率计算
    const next = new Date(now)

    switch (task.frequency) {
      case '每天':
        next.setDate(next.getDate() + 1)
        next.setHours(9, 0, 0, 0)
        break

      case '每周':
        // 下周一 9:00
        const daysUntilMonday = (8 - next.getDay()) % 7 || 7
        next.setDate(next.getDate() + daysUntilMonday)
        next.setHours(9, 0, 0, 0)
        break

      case '每月':
        // 下月 1 号 9:00
        next.setMonth(next.getMonth() + 1)
        next.setDate(1)
        next.setHours(9, 0, 0, 0)
        break

      default:
        console.warn(`[TaskScheduler] 未知的频率类型: ${task.frequency}`)
        return null
    }

    // 如果计算出的时间已经过去，再推一个周期
    if (next <= now) {
      return this.calculateNextRun({
        ...task,
        lastRunAt: next.toISOString()
      })
    }

    return next
  }

  /**
   * 执行任务
   */
  private async executeTask(task: ScheduledTask) {
    console.log(`[TaskScheduler] 开始执行任务: ${task.name}`)

    try {
      const store = useTasksStore.getState()
      await store.executeTask(task.id)
      console.log(`[TaskScheduler] 任务执行成功: ${task.name}`)
    } catch (error) {
      console.error(`[TaskScheduler] 任务执行失败: ${task.name}`, error)
    } finally {
      // 执行完成后，重新调度该任务
      setTimeout(() => {
        const store = useTasksStore.getState()
        const updatedTask = store.allTasks.find(t => t.id === task.id)
        if (updatedTask && updatedTask.status === 'active') {
          this.scheduleTask(updatedTask)
        }
      }, 1000)
    }
  }

  /**
   * 手动触发任务调度刷新
   */
  refresh() {
    if (this.state.running) {
      this.scheduleTasks()
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus() {
    return {
      running: this.state.running,
      scheduledCount: this.state.timers.size,
      lastCheck: this.state.lastCheck
    }
  }
}

// 导出单例
export const taskScheduler = new TaskScheduler()

// 自动启动（可选）
if (typeof window !== 'undefined') {
  // 延迟启动，等待 stores 初始化
  setTimeout(() => {
    taskScheduler.start()
  }, 2000)

  // 页面卸载时停止
  window.addEventListener('beforeunload', () => {
    taskScheduler.stop()
  })
}
