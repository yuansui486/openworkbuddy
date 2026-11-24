/**
 * 内嵌 MCP 代理服务器
 *
 * 替代 Accio Desktop 的 localhost:4097/mcp/proxy
 * 直接用用户的 OAuth accessToken 调用阿里开放平台 API
 *
 * 工作原理：
 * 1. 前端调用 callMcpTool("alibaba-global-product-list", {...})
 * 2. 映射到阿里 API：com.alibaba.product:alibaba.product.search
 * 3. 用 OAuth token 调用真实 API
 * 4. 转换响应格式为 MCP 标准格式
 */

import { callAlibabaAPI } from './alibaba-oauth'

// ===== MCP 工具名称 → 阿里 API 映射 =====

const MCP_TO_ALIBABA_API: Record<string, {
  apiPath: string
  paramsMapper: (args: any) => any
  resultMapper: (data: any) => string
}> = {
  'alibaba-global-product-list': {
    apiPath: 'com.alibaba.product:alibaba.product.search-1',
    paramsMapper: (args) => ({
      keywords: args.query || args.keywords,
      beginPage: args.page || 1,
      pageSize: args.pageSize || 20,
      status: 'approved' // 只查已上架商品
    }),
    resultMapper: (data) => {
      const products = data.productList || []
      return `找到 ${products.length} 个商品：\n\n` +
        products.map((p: any, i: number) =>
          `${i + 1}. ${p.subject}\n   价格：${p.price} ${p.priceUnit}\n   链接：${p.productUrl}`
        ).join('\n\n')
    }
  },

  'alibaba-global-rfq-discovery': {
    apiPath: 'com.alibaba.trade:alibaba.trade.rfq.list-1',
    paramsMapper: (args) => ({
      pageNum: args.page || 1,
      pageSize: args.pageSize || 10,
      keywords: args.keywords || args.query
    }),
    resultMapper: (data) => {
      const rfqs = data.result?.list || []
      return `找到 ${rfqs.length} 条 RFQ 询盘：\n\n` +
        rfqs.map((r: any, i: number) =>
          `${i + 1}. ${r.subject}\n   目标价格：${r.targetPrice}\n   采购数量：${r.quantity}\n   发布时间：${r.gmtCreate}`
        ).join('\n\n')
    }
  },

  'alibaba-global-store-diagnosis': {
    apiPath: 'com.alibaba.shop:alibaba.shop.get-1',
    paramsMapper: (args) => ({
      memberId: args.memberId || args.shopId
    }),
    resultMapper: (data) => {
      const shop = data.shop || {}
      return `店铺诊断报告：\n\n` +
        `店铺名称：${shop.shopName}\n` +
        `会员等级：${shop.memberLevel}\n` +
        `店铺评分：${shop.score}\n` +
        `商品数量：${shop.productCount}\n` +
        `主营类目：${shop.mainCategory}`
    }
  },

  // TODO: 添加其他 45 个技能的映射...
}

// ===== 内嵌 MCP 调用 =====

export async function callEmbeddedMCP(
  toolName: string,
  args: Record<string, any>,
  accessToken: string
): Promise<{ content: Array<{ type: string; text: string }> }> {

  const mapping = MCP_TO_ALIBABA_API[toolName]

  if (!mapping) {
    throw new Error(`未实现的 MCP 工具: ${toolName}。需要添加到映射表中。`)
  }

  try {
    // 1. 映射参数
    const apiParams = mapping.paramsMapper(args)

    // 2. 调用阿里 API
    const rawResponse = await callAlibabaAPI(mapping.apiPath, apiParams, accessToken)

    // 3. 转换为 MCP 格式
    const text = mapping.resultMapper(rawResponse)

    return {
      content: [
        {
          type: 'text',
          text
        }
      ]
    }
  } catch (error) {
    // 返回错误信息（也是 MCP 格式）
    return {
      content: [
        {
          type: 'text',
          text: `工具调用失败: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    }
  }
}

// ===== 列出所有工具 =====

export function listEmbeddedMCPTools() {
  return Object.keys(MCP_TO_ALIBABA_API).map(name => ({
    name,
    description: `阿里巴巴 ${name} 数据查询`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        page: { type: 'number' },
        pageSize: { type: 'number' }
      }
    }
  }))
}
