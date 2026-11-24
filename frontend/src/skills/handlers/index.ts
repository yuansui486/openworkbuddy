/**
 * 技能处理器注册表
 */
import type { SkillContext, SkillResult } from '@/services/skill-executor'

export interface SkillHandler {
  execute(params: any, context?: SkillContext): Promise<SkillResult>
  validate?(params: any): boolean
}

// 导入各类技能处理器
import { ggsHandlers } from './ggs-handlers'
import { cgsHandlers } from './cgs-handlers'

// 合并所有技能处理器
export const SKILL_HANDLERS: Record<string, SkillHandler> = {
  ...ggsHandlers,
  ...cgsHandlers
}
