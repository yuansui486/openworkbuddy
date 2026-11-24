/**
 * Cron 表达式解析器
 * 支持标准 5 字段格式：分 时 日 月 周
 */

export interface CronFields {
  minute: string
  hour: string
  day: string
  month: string
  weekday: string
}

/**
 * 解析 Cron 表达式
 */
export function parseCronExpression(expr: string): CronFields {
  const parts = expr.trim().split(/\s+/)

  if (parts.length !== 5) {
    throw new Error(`无效的 Cron 表达式: ${expr}`)
  }

  return {
    minute: parts[0],
    hour: parts[1],
    day: parts[2],
    month: parts[3],
    weekday: parts[4]
  }
}

/**
 * 检查数字是否匹配 Cron 字段
 */
function matchesCronField(value: number, field: string, min: number, max: number): boolean {
  // * 匹配所有
  if (field === '*') return true

  // 单个数字
  if (/^\d+$/.test(field)) {
    return parseInt(field) === value
  }

  // 范围 (例如: 1-5)
  if (/^\d+-\d+$/.test(field)) {
    const [start, end] = field.split('-').map(Number)
    return value >= start && value <= end
  }

  // 列表 (例如: 1,3,5)
  if (field.includes(',')) {
    const values = field.split(',').map(Number)
    return values.includes(value)
  }

  // 步长 (例如: */5, 0-23/2)
  if (field.includes('/')) {
    const [range, step] = field.split('/')
    const stepNum = parseInt(step)

    if (range === '*') {
      return (value - min) % stepNum === 0
    } else if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number)
      return value >= start && value <= end && (value - start) % stepNum === 0
    }
  }

  return false
}

/**
 * 计算下一次执行时间
 */
export function getNextRunTime(expr: string, from: Date = new Date()): Date | null {
  try {
    const fields = parseCronExpression(expr)
    const start = new Date(from)
    start.setSeconds(0, 0) // 忽略秒和毫秒

    // 最多向前查找 365 天
    const maxIterations = 365 * 24 * 60
    let iterations = 0

    let current = new Date(start)
    current.setMinutes(current.getMinutes() + 1) // 从下一分钟开始

    while (iterations < maxIterations) {
      const minute = current.getMinutes()
      const hour = current.getHours()
      const day = current.getDate()
      const month = current.getMonth() + 1 // JavaScript 月份从 0 开始
      const weekday = current.getDay() // 0 = 周日

      // 检查所有字段是否匹配
      if (
        matchesCronField(minute, fields.minute, 0, 59) &&
        matchesCronField(hour, fields.hour, 0, 23) &&
        matchesCronField(day, fields.day, 1, 31) &&
        matchesCronField(month, fields.month, 1, 12) &&
        matchesCronField(weekday, fields.weekday, 0, 6)
      ) {
        return current
      }

      // 前进一分钟
      current.setMinutes(current.getMinutes() + 1)
      iterations++
    }

    console.error(`无法在 ${maxIterations} 次迭代内找到匹配的执行时间`)
    return null
  } catch (error) {
    console.error('解析 Cron 表达式失败:', error)
    return null
  }
}

/**
 * 验证 Cron 表达式是否有效
 */
export function validateCronExpression(expr: string): { valid: boolean; error?: string } {
  try {
    const fields = parseCronExpression(expr)

    // 基本格式检查
    const fieldRanges = [
      { name: '分钟', value: fields.minute, min: 0, max: 59 },
      { name: '小时', value: fields.hour, min: 0, max: 23 },
      { name: '日期', value: fields.day, min: 1, max: 31 },
      { name: '月份', value: fields.month, min: 1, max: 12 },
      { name: '星期', value: fields.weekday, min: 0, max: 6 }
    ]

    for (const field of fieldRanges) {
      if (field.value === '*') continue

      // 检查数字范围
      if (/^\d+$/.test(field.value)) {
        const num = parseInt(field.value)
        if (num < field.min || num > field.max) {
          return {
            valid: false,
            error: `${field.name}超出范围 (${field.min}-${field.max}): ${field.value}`
          }
        }
      }
    }

    // 尝试计算下一次执行时间
    const nextRun = getNextRunTime(expr)
    if (!nextRun) {
      return {
        valid: false,
        error: '无法计算下一次执行时间，请检查表达式'
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 生成人类可读的 Cron 描述
 */
export function describeCronExpression(expr: string): string {
  try {
    const fields = parseCronExpression(expr)
    const parts: string[] = []

    // 分钟
    if (fields.minute === '*') {
      parts.push('每分钟')
    } else if (fields.minute === '0') {
      parts.push('整点')
    } else {
      parts.push(`第 ${fields.minute} 分`)
    }

    // 小时
    if (fields.hour !== '*') {
      parts.push(`${fields.hour} 点`)
    }

    // 日期和星期
    if (fields.day !== '*' && fields.weekday !== '*') {
      parts.push(`每月 ${fields.day} 号`)
    } else if (fields.day !== '*') {
      parts.push(`每月 ${fields.day} 号`)
    } else if (fields.weekday !== '*') {
      const weekdayMap: Record<string, string> = {
        '0': '周日', '1': '周一', '2': '周二', '3': '周三',
        '4': '周四', '5': '周五', '6': '周六'
      }
      if (fields.weekday.includes('-')) {
        const [start, end] = fields.weekday.split('-')
        parts.push(`${weekdayMap[start]}-${weekdayMap[end]}`)
      } else if (fields.weekday.includes(',')) {
        const days = fields.weekday.split(',').map(d => weekdayMap[d]).join('、')
        parts.push(days)
      } else {
        parts.push(weekdayMap[fields.weekday])
      }
    }

    return parts.join(' ') + ' 执行'
  } catch (error) {
    return '无效的表达式'
  }
}
