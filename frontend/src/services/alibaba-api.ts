/**
 * 阿里巴巴开放平台 API 直连服务（绕过 MCP 网关）
 *
 * 官方文档：https://open.1688.com/api/apidocdetail.htm
 *
 * 替代 MCP 工具：
 * - alibaba-global-product-list → /product/search
 * - alibaba-global-rfq-discovery → /rfq/search
 * - alibaba-global-store-diagnosis → /shop/analysis
 */

interface AlibabaAPIConfig {
  appKey: string
  appSecret: string
  accessToken: string
  apiDomain: string // 'gw.open.1688.com' 或 'api-sg.alibaba.com'
}

let _config: AlibabaAPIConfig | null = null

export function initAlibabaAPI(config: AlibabaAPIConfig) {
  _config = config
}

/**
 * 通用 API 调用（OAuth 2.0 签名）
 */
async function callAPI(
  path: string,
  params: Record<string, any>
): Promise<any> {
  if (!_config) throw new Error('阿里 API 未初始化，请先配置 appKey/appSecret')

  const url = `https://${_config.apiDomain}${path}`
  const timestamp = Date.now()

  // OAuth 签名逻辑（简化版，实际需要按阿里规范排序+HMAC-SHA256）
  const signParams = {
    app_key: _config.appKey,
    access_token: _config.accessToken,
    timestamp,
    ...params
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(signParams)
  })

  if (!response.ok) {
    throw new Error(`阿里 API 错误: ${response.status}`)
  }

  return response.json()
}

/** 商品搜索（替代 alibaba-global-product-list）*/
export async function searchProducts(query: string, page = 1, pageSize = 20) {
  return callAPI('/product/search', {
    q: query,
    page,
    pageSize
  })
}

/** RFQ 搜索（替代 alibaba-global-rfq-discovery）*/
export async function searchRFQ(keywords: string, category?: string) {
  return callAPI('/rfq/search', {
    keywords,
    category
  })
}

/** 店铺诊断（替代 alibaba-global-store-diagnosis）*/
export async function getShopDiagnosis(shopId: string) {
  return callAPI('/shop/analysis', {
    shopId
  })
}

/**
 * 注意：
 * 1. 需要在阿里开放平台申请 appKey/appSecret
 * 2. OAuth 签名逻辑需完整实现（参考官方 SDK）
 * 3. 或者使用阿里官方 npm 包：@alicloud/pop-core
 */
