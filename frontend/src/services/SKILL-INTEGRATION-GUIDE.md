/**
 * 技能系统集成示例 - 在聊天视图中使用技能执行引擎
 *
 * 将以下代码集成到 ChatView.tsx 中，实现消息触发技能的功能
 */

import { skillExecutor } from '@/services/skill-executor'
import { useSkillsStore } from '@/stores/useSkillsStore'
import type { SkillContext } from '@/services/skill-executor'

/**
 * 示例 1: 在发送消息时检测并执行技能
 */
async function handleSendMessage(message: string) {
  const skillsStore = useSkillsStore.getState()
  const allSkills = skillsStore.getAllSkills()

  // 1. 检测消息是否触发技能
  const triggeredSkills = skillExecutor.detectSkills(message, allSkills)

  if (triggeredSkills.length > 0) {
    const skill = triggeredSkills[0] // 选择第一个匹配的技能

    // 2. 获取技能配置
    const config = skillsStore.getSkillConfig(skill.id)

    // 3. 准备执行上下文
    const context: SkillContext = {
      message,
      conversationId: 'current-conversation-id',
      userId: 'current-user-id'
    }

    // 4. 检查是否需要确认
    if (config?.requireConfirm && !config?.autoExecute) {
      // 显示确认对话框
      const confirmed = await showSkillConfirmDialog(skill)
      if (!confirmed) return
    }

    // 5. 执行技能
    const result = await skillExecutor.executeSkill(skill, context, config)

    // 6. 处理执行结果
    if (result.success) {
      console.log('技能执行成功:', result.data)
      // 将结果显示在聊天界面
      appendSystemMessage(`✅ ${result.message || '技能执行完成'}`)

      // 如果有详细数据，格式化显示
      if (result.data) {
        appendSystemMessage(formatSkillResult(result.data))
      }
    } else {
      console.error('技能执行失败:', result.error)
      appendSystemMessage(`❌ ${result.error || '技能执行失败'}`)
    }
  }
}

/**
 * 示例 2: 显示技能确认对话框
 */
function showSkillConfirmDialog(skill: any): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '执行技能',
      content: `即将执行技能: ${skill.name}`,
      okText: '执行',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
}

/**
 * 示例 3: 格式化技能执行结果
 */
function formatSkillResult(data: any): string {
  // 根据不同的数据类型格式化显示
  if (typeof data === 'string') return data

  if (Array.isArray(data)) {
    return data.map((item, index) => `${index + 1}. ${JSON.stringify(item)}`).join('\n')
  }

  return JSON.stringify(data, null, 2)
}

/**
 * 示例 4: 批量检测和显示可用技能
 */
function detectAvailableSkills(message: string) {
  const skillsStore = useSkillsStore.getState()
  const allSkills = skillsStore.getAllSkills()
  const triggeredSkills = skillExecutor.detectSkills(message, allSkills)

  if (triggeredSkills.length > 0) {
    // 在聊天界面显示可用技能建议
    return (
      <div className="skill-suggestions">
        <div>检测到可用技能：</div>
        {triggeredSkills.map(skill => (
          <Button
            key={skill.id}
            type="link"
            size="small"
            onClick={() => executeSkillFromSuggestion(skill, message)}
          >
            {skill.name}
          </Button>
        ))}
      </div>
    )
  }
  return null
}

/**
 * 示例 5: 从建议中执行技能
 */
async function executeSkillFromSuggestion(skill: any, message: string) {
  const skillsStore = useSkillsStore.getState()
  const config = skillsStore.getSkillConfig(skill.id)

  const context: SkillContext = {
    message,
    conversationId: 'current-conversation-id'
  }

  const result = await skillExecutor.executeSkill(skill, context, config)

  if (result.success) {
    console.log('技能执行成功:', result)
  }
}

/**
 * 示例 6: 在聊天输入框显示技能提示
 */
function SkillInputHelper({ inputValue }: { inputValue: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([])

  useEffect(() => {
    if (inputValue.length > 2) {
      const skillsStore = useSkillsStore.getState()
      const allSkills = skillsStore.getAllSkills()
      const detected = skillExecutor.detectSkills(inputValue, allSkills)
      setSuggestions(detected)
    } else {
      setSuggestions([])
    }
  }, [inputValue])

  if (suggestions.length === 0) return null

  return (
    <div className="skill-input-helper">
      {suggestions.map(skill => (
        <Tag key={skill.id} color="blue">
          {skill.name}
        </Tag>
      ))}
    </div>
  )
}

/**
 * 使用说明:
 *
 * 1. 在 ChatView.tsx 中导入技能执行器:
 *    import { skillExecutor } from '@/services/skill-executor'
 *
 * 2. 在消息发送处理函数中检测和执行技能:
 *    const triggeredSkills = skillExecutor.detectSkills(message, allSkills)
 *
 * 3. 在 LLM 流式输出的 onToolCalls 回调中集成技能:
 *    onToolCalls: async (calls) => {
 *      // 检查是否有技能调用
 *      for (const call of calls) {
 *        const skill = skillsStore.getSkillById(call.name)
 *        if (skill) {
 *          const result = await skillExecutor.executeSkill(skill, context)
 *          return [JSON.stringify(result)]
 *        }
 *      }
 *    }
 *
 * 4. 显示技能执行日志:
 *    const logs = useSkillLogsStore(state => state.getRecentLogs(10))
 */
