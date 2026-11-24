/**
 * LLM 服务层 —— 支持任意兼容 OpenAI 协议的接口（自定义 baseURL + API Key + 模型）
 * 支持 MCP 工具调用：LLM 决策 → MCP 执行 → 结果回注 → 继续对话
 */
import OpenAI from 'openai'
import type { LLMConfig } from '@/stores/useSettingsStore'
import type { Message } from '@/stores/useChatStore'

let _client: OpenAI | null = null
let _config: LLMConfig | null = null

export function initLLM(config: LLMConfig) {
  _config = config
  _client = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true
  })
}

export function getClient(): OpenAI {
  if (!_client) throw new Error('LLM 未初始化，请先配置 API')
  return _client
}

export interface ToolDefinition {
  name: string
  description?: string
  inputSchema?: {
    type: string
    properties?: Record<string, unknown>
    required?: string[]
  }
}

export interface ResolvedToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface StreamCallbacks {
  onToken: (delta: string) => void
  onDone: () => void
  onError: (err: Error) => void
  /**
   * 当 LLM 决定调用工具时触发。调用者负责执行工具并返回文本结果。
   * 返回 null 表示执行失败或跳过。
   */
  onToolCalls?: (calls: ResolvedToolCall[]) => Promise<string[]>
}

/** 将应用内部 Message 格式转为 OpenAI API 格式 */
function toAPIMessages(messages: Message[]): OpenAI.ChatCompletionMessageParam[] {
  return messages
    .filter(m => m.content || m.role === 'assistant')
    .map(m => {
      if (m.role === 'user') return { role: 'user' as const, content: m.content }
      if (m.role === 'assistant') return { role: 'assistant' as const, content: m.content }
      if (m.role === 'system') return { role: 'system' as const, content: m.content }
      return { role: 'user' as const, content: m.content }
    })
}

/** 将 ToolDefinition 转为 OpenAI tools 参数格式 */
function toOpenAITools(tools: ToolDefinition[]): OpenAI.ChatCompletionTool[] {
  return tools.map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description || '',
      parameters: t.inputSchema || { type: 'object', properties: {} }
    }
  }))
}

export async function streamChat(
  messages: Message[],
  systemPrompt: string,
  signal: AbortSignal,
  callbacks: StreamCallbacks,
  tools?: ToolDefinition[]
) {
  const client = getClient()
  if (!_config) throw new Error('LLM config not set')

  const apiMsgs: OpenAI.ChatCompletionMessageParam[] = []
  if (systemPrompt) {
    apiMsgs.push({ role: 'system', content: systemPrompt })
  }
  apiMsgs.push(...toAPIMessages(messages))

  // 最多 5 轮工具调用循环，防止死循环
  for (let round = 0; round < 5; round++) {
    try {
      const reqParams: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
        model: _config.model,
        messages: apiMsgs,
        temperature: _config.temperature,
        max_tokens: _config.maxTokens || 8192,
        stream: true
      }

      // 只在有工具且调用者提供了 onToolCalls 时才传 tools
      if (tools && tools.length > 0 && callbacks.onToolCalls) {
        reqParams.tools = toOpenAITools(tools)
        reqParams.tool_choice = 'auto'
      }

      const stream = await client.chat.completions.create(reqParams, { signal })

      // 收集完整 assistant 响应（文本 + 工具调用）
      let accumulatedText = ''
      let finishReason: string | null = null
      // 收集 tool_calls: index → { id, name, arguments(累积) }
      const toolCallsMap: Record<number, { id: string; name: string; arguments: string }> = {}

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (!delta) continue

        // 收集文本 token
        if (delta.content) {
          accumulatedText += delta.content
          callbacks.onToken(delta.content)
        }

        // 收集 tool_calls delta
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0
            if (!toolCallsMap[idx]) {
              toolCallsMap[idx] = { id: tc.id ?? '', name: '', arguments: '' }
            }
            if (tc.id) toolCallsMap[idx].id = tc.id
            if (tc.function?.name) toolCallsMap[idx].name += tc.function.name
            if (tc.function?.arguments) toolCallsMap[idx].arguments += tc.function.arguments
          }
        }

        finishReason = chunk.choices[0]?.finish_reason ?? finishReason
        if (finishReason === 'stop' || finishReason === 'tool_calls') break
      }

      // 检查是否有工具调用
      const rawToolCalls = Object.values(toolCallsMap)
      if (finishReason === 'tool_calls' && rawToolCalls.length > 0 && callbacks.onToolCalls) {
        // 解析 arguments JSON
        const resolvedCalls: ResolvedToolCall[] = rawToolCalls
          .filter(tc => tc.name)
          .map(tc => {
            let args: Record<string, unknown> = {}
            try { args = JSON.parse(tc.arguments || '{}') } catch {}
            return { id: tc.id, name: tc.name, arguments: args }
          })

        // 把 assistant 的工具调用消息加入上下文
        apiMsgs.push({
          role: 'assistant',
          content: accumulatedText || null,
          tool_calls: rawToolCalls
            .filter(tc => tc.name)
            .map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: tc.arguments }
            }))
        })

        // 执行工具并收集结果
        const results = await callbacks.onToolCalls(resolvedCalls)

        // 把每个工具结果加入上下文
        resolvedCalls.forEach((call, i) => {
          apiMsgs.push({
            role: 'tool',
            tool_call_id: call.id,
            content: results[i] ?? '工具执行失败'
          })
        })

        // 继续下一轮让 LLM 整合结果
        continue
      }

      // 正常完成
      callbacks.onDone()
      return
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
      return
    }
  }

  // 超出轮次限制
  callbacks.onToken('\n\n[工具调用轮次超限，已停止]')
  callbacks.onDone()
}

/** 一次性非流式调用 */
export async function chatOnce(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  const client = getClient()
  if (!_config) throw new Error('LLM config not set')

  const apiMsgs: OpenAI.ChatCompletionMessageParam[] = []
  if (systemPrompt) apiMsgs.push({ role: 'system', content: systemPrompt })
  apiMsgs.push(...toAPIMessages(messages))

  const res = await client.chat.completions.create({
    model: _config.model,
    messages: apiMsgs,
    temperature: _config.temperature,
    max_tokens: _config.maxTokens || 4096
  })
  return res.choices[0]?.message?.content ?? ''
}

/** 测试连接 */
export async function testConnection(config: LLMConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true
    })
    const res = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 5
    })
    return { ok: !!(res.choices?.[0]?.message) }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
