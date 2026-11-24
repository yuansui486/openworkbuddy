/**
 * MCP Gateway 客户端 —— 基于逆向得到的 Accio Work 网关协议
 *
 * 逆向来源:
 *   - out/main/chunks/gw-mcp-proxy-caller-BJNLPEil.js (渲染进程 MCP 代理调用器)
 *   - resources/accio-mcp-cli/accio-mcp.mjs (CLI 工具代理)
 *
 * 协议要点:
 *   端点: http://localhost:4097/mcp/proxy
 *   认证: Authorization: Basic phoenix:<ACCIO_GATEWAY_TOKEN>
 *   请求体:
 *     {
 *       accessToken: "<用户登录 token>",
 *       request: {
 *         method: "tools/call" | "tools/list",
 *         params: { name, arguments }   // tools/call
 *       },
 *       // 追踪字段（可选，来自 gw-mcp-proxy-caller 中的 trace 对象）
 *       messageId?, requestId?, agentId?, conversationId?,
 *       language?, clientType?, teamId?, traceId?, userRequestId?,
 *       connectId?  // 店铺绑定: "<connectorId>:<accountId>"
 *     }
 *   响应:
 *     - JSON: { success: boolean, data: <mcp result>, message?: string }
 *       data 结构: { content: [{ type: "text", text: "..." }], mcpApp?: { textFallback } }
 *     - SSE: 多行 "data: <json>\n\n"
 *
 * 本服务是自研 AI 内核的"工具手"：LLM 决定调用哪个 MCP 工具，
 * 由本服务向本地 Accio 网关发起真实请求，再把结果交还 LLM。
 */

// ===== 类型定义 =====

export interface McpTool {
  name: string
  description?: string
  inputSchema?: {
    type: string
    properties?: Record<string, unknown>
    required?: string[]
  }
}

export interface McpToolCallParams {
  name: string
  arguments: Record<string, unknown>
}

export interface McpToolResult {
  content: Array<{ type: string; text: string }>
  mcpApp?: { textFallback?: string }
  isError?: boolean
}

export interface McpTraceContext {
  messageId?: string
  requestId?: string
  agentId?: string
  parentAgentId?: string
  conversationId?: string
  conversationName?: string
  language?: string
  clientType?: string
  teamId?: string
  traceId?: string
  userRequestId?: string
  parentSpanId?: string
  connectId?: string  // 店铺绑定 "<connectorId>:<accountId>"
}

// ===== 配置 =====

const DEFAULT_GATEWAY_PORT = 4097
const DEFAULT_GATEWAY_USERNAME = 'phoenix'

function getGatewayOrigin(): string {
  const port = (typeof window !== 'undefined' && (window as any).electronAPI?.gatewayPort) || DEFAULT_GATEWAY_PORT
  return `http://localhost:${port}`
}

function getGatewayToken(): string {
  // 1. Electron 环境: 从主进程读取
  if (typeof window !== 'undefined' && (window as any).electronAPI?.getAccioToken) {
    // 同步缓存（主进程在启动时注入到 window.__accioToken）
    return (window as any).__accioToken || ''
  }
  // 2. 开发环境: 从 localStorage 读取用户手动填入的 token
  try {
    return localStorage.getItem('accio_gateway_token') || ''
  } catch {
    return ''
  }
}

function getAccessToken(): string {
  // 用户登录 token，从 settings store 缓存读取
  try {
    const raw = localStorage.getItem('alibaba_auth')
    if (raw) {
      const auth = JSON.parse(raw)
      return auth.token || ''
    }
  } catch {}
  return ''
}

function buildAuthHeaders(token: string): Record<string, string> {
  const credentials = btoa(`${DEFAULT_GATEWAY_USERNAME}:${token}`)
  return { Authorization: `Basic ${credentials}` }
}

function buildHeaders(token: string): Record<string, string> {
  return {
    ...buildAuthHeaders(token),
    'Content-Type': 'application/json'
  }
}

// ===== 核心: MCP 请求 =====

interface ProxyRequest {
  accessToken: string
  request: {
    method: string
    params?: McpToolCallParams | Record<string, unknown>
  }
  [key: string]: unknown  // tracing fields
}

async function proxyRequest(
  method: string,
  params: McpToolCallParams | Record<string, unknown>,
  trace?: McpTraceContext
): Promise<unknown> {
  const token = getGatewayToken()
  if (!token) {
    throw new Error('MCP 网关未认证: 缺少 ACCIO_GATEWAY_TOKEN。请先登录 Accio Desktop 或在设置中填入网关 Token。')
  }

  const accessToken = getAccessToken()
  const body: ProxyRequest = {
    accessToken,
    request: { method, params },
    ...trace
  }

  const url = `${getGatewayOrigin()}/mcp/proxy`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    let errText = ''
    try { errText = await res.text() } catch {}
    throw new Error(`MCP 网关返回 HTTP ${res.status}: ${errText.slice(0, 200)}`)
  }

  const contentType = res.headers.get('content-type') || ''
  const raw = await res.text()

  // SSE 流式响应
  if (contentType.includes('text/event-stream') || raw.startsWith('event:') || raw.startsWith('data:')) {
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const jsonStr = trimmed.slice(5).trim()
      if (jsonStr) {
        try { return JSON.parse(jsonStr) } catch {}
      }
    }
    throw new Error('MCP 网关 SSE 响应中未找到有效 data 行')
  }

  // JSON 响应: { success, data, message? }
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`MCP 网关响应解析失败: ${raw.slice(0, 200)}`)
  }

  if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
    if (!parsed.success) {
      throw new Error(`MCP 网关错误: ${parsed.message || '未知错误'}`)
    }
    return parsed.data
  }

  return parsed
}

// ===== 高层 API =====

/** 列出所有可用 MCP 工具 */
export async function listMcpTools(): Promise<McpTool[]> {
  // 优先使用内嵌 MCP 的工具列表
  try {
    const { loadToken } = await import('./alibaba-oauth')
    const { listEmbeddedMCPTools } = await import('./embedded-mcp')

    const oauthToken = loadToken()
    if (oauthToken && oauthToken.access_token) {
      console.log('[MCP] 使用内嵌 MCP 工具列表')
      return listEmbeddedMCPTools()
    }
  } catch (e) {
    console.warn('[MCP] 内嵌 MCP 工具列表不可用:', e)
  }

  // 回退到网关模式
  try {
    const result = await proxyRequest('tools/list', {})
    if (result && typeof result === 'object' && Array.isArray((result as any).tools)) {
      return (result as any).tools as McpTool[]
    }
    if (Array.isArray(result)) {
      return result as McpTool[]
    }
    return []
  } catch (e) {
    console.warn('[MCP] listMcpTools failed:', e)
    return []
  }
}

/** 调用 MCP 工具 */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
  trace?: McpTraceContext
): Promise<McpToolResult> {
  // 优先使用内嵌 MCP（如果用户已 OAuth 登录）
  try {
    const { loadToken } = await import('./alibaba-oauth')
    const { callEmbeddedMCP } = await import('./embedded-mcp')

    const oauthToken = loadToken()
    if (oauthToken && oauthToken.access_token) {
      console.log('[MCP] 使用内嵌 MCP（直连阿里 API）')
      return await callEmbeddedMCP(name, args, oauthToken.access_token)
    }
  } catch (e) {
    console.warn('[MCP] 内嵌 MCP 不可用，回退到网关模式:', e)
  }

  // 回退到原有的网关模式（需要 Accio Desktop）
  console.log('[MCP] 使用网关模式（需要 Accio Desktop）')
  const result = await proxyRequest('tools/call', { name, arguments: args }, trace)
  return result as McpToolResult
}

/** 提取工具结果的文本内容 */
export function extractToolText(result: McpToolResult): string {
  if (result.mcpApp?.textFallback) return result.mcpApp.textFallback
  if (result.content && result.content.length > 0) {
    return result.content
      .filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n')
  }
  return ''
}

/** 设置网关 token（开发环境手动配置用） */
export function setGatewayToken(token: string): void {
  try {
    localStorage.setItem('accio_gateway_token', token)
  } catch {}
}

/** 检测网关是否可用 */
export async function pingGateway(): Promise<boolean> {
  try {
    const token = getGatewayToken()
    if (!token) return false
    const res = await fetch(`${getGatewayOrigin()}/health`, {
      headers: buildAuthHeaders(token)
    })
    return res.ok
  } catch {
    return false
  }
}
