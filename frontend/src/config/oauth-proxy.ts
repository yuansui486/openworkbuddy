/**
 * 公共 OAuth 代理配置
 *
 * 提供一个公共的阿里 OAuth 代理服务
 * 用户无需申请 App Key，直接登录即可使用
 */

export const PUBLIC_OAUTH_PROXY = {
  // 公共代理服务器地址（TODO: 部署后替换）
  proxyURL: 'https://alibaba-oauth-proxy.example.com',

  // 或者使用本地代理（如果 Accio Desktop 在运行）
  localGatewayURL: 'http://localhost:4097',

  /**
   * 使用策略：
   * 1. 优先使用本地 Accio Gateway（如果可用）
   * 2. 回退到公共代理
   * 3. 都不可用时提示用户
   */
  async getAvailableProxy(): Promise<string | null> {
    // 检测本地 Gateway
    try {
      const response = await fetch(`${this.localGatewayURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      })
      if (response.ok) {
        console.log('[OAuth Proxy] 使用本地 Accio Gateway')
        return this.localGatewayURL
      }
    } catch {}

    // 检测公共代理
    try {
      const response = await fetch(`${this.proxyURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      })
      if (response.ok) {
        console.log('[OAuth Proxy] 使用公共代理服务')
        return this.proxyURL
      }
    } catch {}

    return null
  }
}

/**
 * 说明：
 *
 * 公共代理的工作原理：
 * 1. 用户点击"登录阿里巴巴"
 * 2. 跳转到代理服务器的 OAuth 页面
 * 3. 代理服务器用它的 App Key 完成授权
 * 4. 返回 accessToken 给用户
 * 5. 用户用这个 token 直接调用阿里 API
 *
 * 安全性：
 * - 代理服务器不存储任何用户数据
 * - accessToken 直接返回给用户，存在用户浏览器
 * - 所有 API 调用都是用户浏览器直连阿里服务器
 */
