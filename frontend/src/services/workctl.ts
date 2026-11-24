/**
 * workctl 桥接层 —— 基于逆向得到的 Accio Gateway MCP 协议
 *
 * 原始应用通过本地网关 (localhost:4097/mcp/proxy) 代理所有 MCP 工具调用。
 * 本服务封装该协议，并对外暴露高层 API。
 *
 * 逆向来源: out/main/chunks/gw-mcp-proxy-caller-BJNLPEil.js
 *   POST /mcp/proxy
 *   Authorization: Basic phoenix:<ACCIO_GATEWAY_TOKEN>
 *   Body: { accessToken, request: { method, params: { name, arguments } }, ...tracing }
 *   Response: { success, data } 或 SSE 流 (data: <json>\n\n)
 */
import { callMcpTool, listMcpTools, type McpTool, type McpToolResult } from './mcp'

export interface WorkctlResult {
  success: boolean
  data?: unknown
  error?: {
    reason: string
    message: string
    next_action?: string
  }
}

/** 从 Accio Desktop 获取 gateway token */
export async function getGatewayToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getAccioToken) {
      return await (window as any).electronAPI.getAccioToken()
    }
    // 开发环境兜底：从 localStorage 读取用户手动填入的 token
    return localStorage.getItem('accio_gateway_token') || null
  } catch {
    return null
  }
}

/** 列出所有可用 MCP 工具 */
export async function listTools(): Promise<McpTool[]> {
  return listMcpTools()
}

/** 调用 MCP 工具（高层封装） */
export async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<WorkctlResult> {
  try {
    const result = await callMcpTool(name, args)
    return { success: true, data: result }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      success: false,
      error: { reason: 'mcp_error', message: msg }
    }
  }
}

/**
 * workctl 命令映射表 —— 国际站(GGS) 工具名
 * 逆向来源: accio-mcp-cli/accio-mcp.mjs + skills 目录
 */
export const WORKCTL_COMMANDS = {
  ggs: {
    productList: 'alibaba-global-product-list',
    productDetail: 'alibaba-global-product-detail',
    productPublish: 'alibaba-global-smart-publish',
    productOptimize: 'alibaba-global-smart-optimize',
    rfqSearch: 'alibaba-global-rfq-discovery',
    shopInfo: 'alibaba-global-shop-info',
    shopDiagnosis: 'alibaba-global-store-diagnosis',
    buyerInfo: 'alibaba-global-buyercheck-bgcheck',
    dataAdvisor: 'alibaba-global-product-data-advisor-category-infer'
  },
  cgs: {
    shopInfo: 'alibaba-1688-shop-info',
    productSearch: 'alibaba-1688-product-search',
    orderList: 'alibaba-1688-order-list'
  }
} as const
