/**
 * 技能执行引擎 - 负责检测、匹配、执行技能
 */
import { Skill } from '@/stores/useSkillsStore'
import { useSkillLogsStore } from '@/stores/useSkillLogsStore'
import { SKILL_HANDLERS } from '@/skills/handlers'

export interface SkillContext {
  message: string
  userId?: string
  conversationId?: string
  metadata?: Record<string, any>
}

export interface SkillResult {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export interface SkillConfig {
  enabled: boolean
  autoExecute: boolean
  requireConfirm: boolean
  params: Record<string, any>
}

export class SkillExecutor {
  /**
   * 检测消息是否触发技能
   */
  detectSkills(message: string, allSkills: Skill[]): Skill[] {
    const triggeredSkills: Skill[] = []
    const lowerMessage = message.toLowerCase()

    for (const skill of allSkills) {
      if (!skill.enabled) continue

      for (const trigger of skill.triggers) {
        if (lowerMessage.includes(trigger.toLowerCase())) {
          triggeredSkills.push(skill)
          break
        }
      }
    }

    return triggeredSkills
  }

  /**
   * 执行技能
   */
  async executeSkill(
    skill: Skill,
    context: SkillContext,
    config?: SkillConfig
  ): Promise<SkillResult> {
    const startTime = Date.now()

    try {
      // 1. 验证技能是否启用
      if (!skill.enabled) {
        throw new Error('技能未启用')
      }

      // 2. 获取技能处理器
      const handler = SKILL_HANDLERS[skill.id]
      if (!handler) {
        throw new Error(`技能处理器未找到: ${skill.id}`)
      }

      // 3. 提取参数
      const params = await this.extractParams(skill, context, config?.params)

      // 4. 验证参数
      if (handler.validate && !handler.validate(params)) {
        throw new Error('参数验证失败')
      }

      // 5. 执行技能
      const result = await handler.execute(params, context)

      // 6. 记录日志
      const duration = Date.now() - startTime
      useSkillLogsStore.getState().addLog({
        skillId: skill.id,
        skillName: skill.name,
        triggeredBy: context.message,
        params,
        result,
        timestamp: Date.now(),
        duration,
        status: 'success'
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorResult: SkillResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }

      // 记录错误日志
      useSkillLogsStore.getState().addLog({
        skillId: skill.id,
        skillName: skill.name,
        triggeredBy: context.message,
        params: {},
        result: errorResult,
        timestamp: Date.now(),
        duration,
        status: 'error'
      })

      return errorResult
    }
  }

  /**
   * 从消息中提取技能所需参数
   */
  async extractParams(
    skill: Skill,
    context: SkillContext,
    configParams?: Record<string, any>
  ): Promise<any> {
    // 优先使用配置中的参数
    if (configParams && Object.keys(configParams).length > 0) {
      return configParams
    }

    // 从消息中智能提取参数
    const params: Record<string, any> = {}

    // 根据技能 ID 进行特定的参数提取
    switch (skill.id) {
      case 'alibaba-global-smart-publish':
        // 提取商品名称
        params.productName = this.extractProductName(context.message)
        params.description = context.message
        break

      case 'alibaba-global-smart-optimize':
        // 提取商品 ID
        params.productId = this.extractProductId(context.message)
        params.optimizeFields = this.extractOptimizeFields(context.message)
        break

      case 'alibaba-global-smart-rfq-reply':
        // 提取 RFQ ID
        params.rfqId = this.extractRFQId(context.message)
        params.context = context.message
        break

      case 'alibaba-global-store-diagnosis':
        // 店铺诊断一般不需要参数
        break

      default:
        // 通用参数提取
        params.query = context.message
        break
    }

    return params
  }

  /**
   * 辅助方法：提取商品名称
   */
  private extractProductName(message: string): string {
    // 简单提取：去掉触发词后的内容
    const triggers = ['发品', '上架', '发布产品', '发布商品']
    let name = message

    for (const trigger of triggers) {
      const index = message.indexOf(trigger)
      if (index !== -1) {
        name = message.substring(index + trigger.length).trim()
        break
      }
    }

    // 去掉引号
    name = name.replace(/["'「」]/g, '').trim()
    return name || '未命名商品'
  }

  /**
   * 辅助方法：提取商品 ID
   */
  private extractProductId(message: string): string {
    // 提取数字 ID
    const match = message.match(/\d{10,}/)
    return match ? match[0] : ''
  }

  /**
   * 辅助方法：提取优化字段
   */
  private extractOptimizeFields(message: string): string[] {
    const fields: string[] = []
    const fieldMap: Record<string, string> = {
      标题: 'title',
      描述: 'description',
      价格: 'price',
      图片: 'images',
      关键词: 'keywords',
      详情: 'details'
    }

    for (const [chinese, english] of Object.entries(fieldMap)) {
      if (message.includes(chinese)) {
        fields.push(english)
      }
    }

    return fields.length > 0 ? fields : ['all']
  }

  /**
   * 辅助方法：提取 RFQ ID
   */
  private extractRFQId(message: string): string {
    const match = message.match(/RFQ[:\s]*(\d+)/i) || message.match(/\d{8,}/)
    return match ? match[1] || match[0] : ''
  }
}

export const skillExecutor = new SkillExecutor()
