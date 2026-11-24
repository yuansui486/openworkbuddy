/**
 * 阿里巴巴开放平台 OAuth 2.0 认证
 *
 * 官方文档：https://open.1688.com/doc/api/cn/api.htm?ns=cn.alibaba.open&n=user.get&v=1
 *
 * 流程：
 * 1. 用户点击"登录阿里巴巴"
 * 2. 打开阿里 OAuth 授权页（弹窗）
 * 3. 用户输入账号密码 + 验证码
 * 4. 阿里回调到我们的页面并带上 code
 * 5. 用 code 换取 access_token
 * 6. 保存 token，后续直接调用 API
 */

// ===== 配置（内置 App Key）=====
const ALIBABA_CONFIG = {
  // 内置的 App Key（从开发者账号获取）
  // 在 https://open.1688.com 申请后替换这两行
  appKey: '12345678',  // ← 替换为你的 App Key
  appSecret: 'abcdefghijklmnop',  // ← 替换为你的 App Secret

  // OAuth 授权地址
  authURL: 'https://auth.1688.com/oauth/authorize',
  tokenURL: 'https://gw.open.1688.com/openapi/param2/1/system.oauth2/getToken',

  // 回调地址
  get redirectURI() {
    return window.location.origin + '/oauth-callback.html'
  },

  // API 域名
  apiDomain: 'gw.open.1688.com'
}

export interface AlibabaOAuthToken {
  access_token: string
  refresh_token: string
  expires_in: number // 秒
  refresh_token_timeout: number
  alibaba_id: string // 会员 ID
  memberId: string
  resource_owner: string // 登录 ID
  expires_at: number // 本地计算的过期时间戳
}

// ===== 1. 发起授权 =====

/**
 * 打开阿里 OAuth 授权窗口
 * 用户完成登录后会回调到 redirectURI
 */
export function startOAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    // 生成随机 state 防 CSRF
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem('oauth_state', state)

    const params = new URLSearchParams({
      client_id: ALIBABA_CONFIG.appKey,
      site: 'china', // 'china' = 1688中国站, 'international' = 国际站
      redirect_uri: ALIBABA_CONFIG.redirectURI,
      state,
      _aop_signature: '' // 可选，高级签名
    })

    const authURL = `${ALIBABA_CONFIG.authURL}?${params}`

    // 打开弹窗（800x600）
    const popup = window.open(
      authURL,
      'alibaba_oauth',
      'width=800,height=600,top=100,left=100'
    )

    if (!popup) {
      reject(new Error('弹窗被阻止，请允许弹窗后重试'))
      return
    }

    // 监听回调消息（从 /oauth/callback 页面 postMessage）
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'alibaba_oauth_success') {
        window.removeEventListener('message', messageHandler)
        popup.close()
        resolve(event.data.code)
      } else if (event.data.type === 'alibaba_oauth_error') {
        window.removeEventListener('message', messageHandler)
        popup.close()
        reject(new Error(event.data.error))
      }
    }

    window.addEventListener('message', messageHandler)

    // 30 秒超时
    setTimeout(() => {
      if (popup && !popup.closed) {
        window.removeEventListener('message', messageHandler)
        popup.close()
        reject(new Error('授权超时'))
      }
    }, 30000)
  })
}

// ===== 2. 换取 Token =====

/**
 * 用授权 code 换取 access_token
 */
export async function exchangeToken(code: string): Promise<AlibabaOAuthToken> {
  const params = {
    client_id: ALIBABA_CONFIG.appKey,
    client_secret: ALIBABA_CONFIG.appSecret,
    grant_type: 'authorization_code',
    need_refresh_token: true,
    code,
    redirect_uri: ALIBABA_CONFIG.redirectURI
  }

  const response = await fetch(
    `${ALIBABA_CONFIG.tokenURL}/${ALIBABA_CONFIG.appKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params as any)
    }
  )

  if (!response.ok) {
    throw new Error(`获取 Token 失败: ${response.status}`)
  }

  const data = await response.json()

  if (!data.access_token) {
    throw new Error(`Token 响应异常: ${JSON.stringify(data)}`)
  }

  // 计算过期时间
  const now = Date.now()
  const token: AlibabaOAuthToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    refresh_token_timeout: data.refresh_token_timeout,
    alibaba_id: data.alibaba_id,
    memberId: data.memberId || data.alibaba_id,
    resource_owner: data.resource_owner,
    expires_at: now + data.expires_in * 1000
  }

  return token
}

// ===== 3. 刷新 Token =====

export async function refreshToken(refreshToken: string): Promise<AlibabaOAuthToken> {
  const params = {
    client_id: ALIBABA_CONFIG.appKey,
    client_secret: ALIBABA_CONFIG.appSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  }

  const response = await fetch(
    `${ALIBABA_CONFIG.tokenURL}/${ALIBABA_CONFIG.appKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params as any)
    }
  )

  const data = await response.json()
  const now = Date.now()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in,
    refresh_token_timeout: data.refresh_token_timeout,
    alibaba_id: data.alibaba_id,
    memberId: data.memberId || data.alibaba_id,
    resource_owner: data.resource_owner,
    expires_at: now + data.expires_in * 1000
  }
}

// ===== 4. API 调用 =====

/**
 * 通用阿里 API 调用
 *
 * 示例：
 * callAlibabaAPI('com.alibaba.product:alibaba.product.get-1', { productId: '123' })
 */
export async function callAlibabaAPI(
  apiPath: string,
  params: Record<string, any>,
  accessToken: string
): Promise<any> {
  const url = `https://${ALIBABA_CONFIG.apiDomain}/openapi/${apiPath}/${ALIBABA_CONFIG.appKey}`

  const body = {
    access_token: accessToken,
    ...params
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status}`)
  }

  return response.json()
}

// ===== Token 存储 =====

const TOKEN_STORAGE_KEY = 'alibaba_oauth_token'

export function saveToken(token: AlibabaOAuthToken) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
}

export function loadToken(): AlibabaOAuthToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const token = JSON.parse(raw) as AlibabaOAuthToken

    // 检查是否过期
    if (Date.now() >= token.expires_at) {
      return null // 过期了，需要重新登录或刷新
    }

    return token
  } catch {
    return null
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
