const crypto = require('crypto');
const https = require('https');
const http = require('http');

/**
 * 阿里巴巴国际站 OAuth 授权核心模块
 * Alibaba International OAuth Core Module
 *
 * 基于观察到的授权 URL 分析：
 * https://login.alibaba.com/v2/common_second_part_login.htm?from=buyeragent&subScene=acciowork&return_url=...
 *
 * 参数说明：
 * - from: buyeragent (买家代理)
 * - subScene: acciowork (应用场景标识，需要改为自己的应用名)
 * - return_url: 回调地址，包含 state 参数
 * - state: 随机字符串，用于防止 CSRF 攻击
 */
class AlibabaOAuth {
  constructor(config = {}) {
    // OAuth 配置
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';

    // 应用场景标识（类似 acciowork）
    this.appScene = config.appScene || 'openworkbuddy';

    // 授权端点
    this.authUrl = config.authUrl || 'https://login.alibaba.com/v2/common_second_part_login.htm';

    // 回调端点（使用本地服务器）
    this.callbackGateway = config.callbackGateway || 'http://localhost:3800/api/plugins/alibaba-international/auth/callback';

    // Token 端点（阿里巴巴官方API）
    this.tokenUrl = config.tokenUrl || 'https://gw.open.1688.com/openapi/param2/1/com.alibaba.account/token.oauth2.getToken';

    // 本地回调服务器配置
    this.localCallbackPort = config.localCallbackPort || 3000;
    this.localCallbackPath = config.localCallbackPath || '/callback';
    this.localCallbackUrl = `http://localhost:${this.localCallbackPort}${this.localCallbackPath}`;

    // 请求配置
    this.timeout = config.timeout || 30000;

    // PKCE 支持（Proof Key for Code Exchange）
    this.usePKCE = config.usePKCE !== false;

    // 授权作用域
    this.scopes = config.scopes || ['read', 'write'];
  }

  /**
   * 生成随机 state 参数（用于防止 CSRF 攻击）
   */
  generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 生成 PKCE code verifier
   */
  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * 生成 PKCE code challenge
   */
  generateCodeChallenge(codeVerifier) {
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }

  /**
   * 生成授权 URL
   * @param {object} options - 选项
   * @param {string} options.state - 自定义 state（可选，不提供则自动生成）
   * @param {string} options.redirectUri - 自定义回调地址（可选）
   * @returns {object} - { authUrl, state, codeVerifier }
   */
  generateAuthUrl(options = {}) {
    const state = options.state || this.generateState();
    const redirectUri = options.redirectUri || this.localCallbackUrl;

    // 准备 PKCE 参数
    let codeVerifier = null;
    let codeChallenge = null;

    if (this.usePKCE) {
      codeVerifier = this.generateCodeVerifier();
      codeChallenge = this.generateCodeChallenge(codeVerifier);
    }

    // 构建完整的回调 URL（包含 state）
    // 参考 Accio Work 的模式：
    // return_url=https://phoenix-gw.alibaba.com/mcp/alibaba/callback?state=xxx
    const fullCallbackUrl = `${this.callbackGateway}?state=${state}`;

    // 构建授权 URL 参数
    const params = new URLSearchParams({
      from: 'buyeragent',
      subScene: this.appScene,  // 使用自己的应用标识
      return_url: fullCallbackUrl
    });

    // 如果有 client_id，添加到参数中
    if (this.clientId) {
      params.append('client_id', this.clientId);
    }

    // 如果使用 PKCE，添加 code_challenge
    if (this.usePKCE && codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    const authUrl = `${this.authUrl}?${params.toString()}`;

    return {
      authUrl,
      state,
      codeVerifier,
      fullCallbackUrl,
      localRedirectUri: redirectUri
    };
  }

  /**
   * 处理授权回调
   * @param {object} callbackParams - 回调参数
   * @param {string} callbackParams.code - 授权码
   * @param {string} callbackParams.state - State 参数
   * @param {string} expectedState - 预期的 state 值
   * @param {string} codeVerifier - PKCE code verifier（如果使用 PKCE）
   * @returns {object} - Token 响应
   */
  async handleCallback(callbackParams, expectedState, codeVerifier = null) {
    const { code, state, error, error_description } = callbackParams;

    // 检查错误
    if (error) {
      throw new Error(`OAuth Error: ${error} - ${error_description || 'Unknown error'}`);
    }

    // 验证 state（防止 CSRF 攻击）
    if (state !== expectedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // 验证授权码
    if (!code) {
      throw new Error('Authorization code not found in callback');
    }

    // 交换 access token
    return await this.exchangeToken(code, codeVerifier);
  }

  /**
   * 使用授权码交换 access token
   * @param {string} code - 授权码
   * @param {string} codeVerifier - PKCE code verifier（如果使用 PKCE）
   * @returns {object} - Token 响应
   */
  async exchangeToken(code, codeVerifier = null) {
    const tokenData = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.localCallbackUrl
    };

    // 如果提供了 client credentials，添加到请求中
    if (this.clientId) {
      tokenData.client_id = this.clientId;
    }
    if (this.clientSecret) {
      tokenData.client_secret = this.clientSecret;
    }

    // 如果使用 PKCE，添加 code_verifier
    if (this.usePKCE && codeVerifier) {
      tokenData.code_verifier = codeVerifier;
    }

    return await this.makeTokenRequest(tokenData);
  }

  /**
   * 刷新 access token
   * @param {string} refreshToken - Refresh token
   * @returns {object} - 新的 token 响应
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const tokenData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    // 如果提供了 client credentials，添加到请求中
    if (this.clientId) {
      tokenData.client_id = this.clientId;
    }
    if (this.clientSecret) {
      tokenData.client_secret = this.clientSecret;
    }

    return await this.makeTokenRequest(tokenData);
  }

  /**
   * 发起 token 请求
   * @param {object} data - 请求数据
   * @returns {object} - Token 响应
   */
  async makeTokenRequest(data) {
    const url = new URL(this.tokenUrl);
    const postData = new URLSearchParams(data).toString();

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Accept': 'application/json',
          'User-Agent': 'OpenWorkBuddy/1.0'
        },
        timeout: this.timeout
      };

      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(body);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                success: true,
                data: response
              });
            } else {
              reject(new Error(`Token request failed: ${res.statusCode} - ${response.error || body}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse token response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Token request error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Token request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 撤销 token
   * @param {string} token - 要撤销的 token（access_token 或 refresh_token）
   * @param {string} tokenTypeHint - Token 类型提示：'access_token' 或 'refresh_token'
   */
  async revokeToken(token, tokenTypeHint = 'access_token') {
    const revokeUrl = this.tokenUrl.replace('/token', '/revoke');
    const url = new URL(revokeUrl);

    const postData = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: this.clientId,
      client_secret: this.clientSecret
    }).toString();

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'OpenWorkBuddy/1.0'
        },
        timeout: this.timeout
      };

      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            reject(new Error(`Token revocation failed: ${res.statusCode} - ${body}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Token revocation error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Token revocation timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 验证 token 是否有效
   * @param {string} accessToken - Access token
   * @returns {object} - Token 信息
   */
  async validateToken(accessToken) {
    const validateUrl = this.tokenUrl.replace('/token', '/tokeninfo');
    const url = new URL(validateUrl);

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}?access_token=${encodeURIComponent(accessToken)}`,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OpenWorkBuddy/1.0'
        },
        timeout: this.timeout
      };

      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(body);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                success: true,
                valid: true,
                data: response
              });
            } else {
              resolve({
                success: true,
                valid: false,
                error: response.error || 'Invalid token'
              });
            }
          } catch (error) {
            reject(new Error(`Failed to parse validation response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Token validation error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Token validation timeout'));
      });

      req.end();
    });
  }

  /**
   * 获取授权状态
   * @param {object} tokenData - Token 数据（包含 access_token, refresh_token, expires_at）
   * @returns {object} - 授权状态
   */
  getAuthStatus(tokenData) {
    if (!tokenData || !tokenData.access_token) {
      return {
        authorized: false,
        message: 'Not authorized'
      };
    }

    const now = Date.now();
    const expiresAt = tokenData.expires_at || 0;
    const isExpired = now >= expiresAt;

    if (isExpired) {
      if (tokenData.refresh_token) {
        return {
          authorized: true,
          expired: true,
          refreshable: true,
          message: 'Token expired but can be refreshed'
        };
      } else {
        return {
          authorized: false,
          expired: true,
          refreshable: false,
          message: 'Token expired and no refresh token available'
        };
      }
    }

    const expiresIn = Math.floor((expiresAt - now) / 1000);

    return {
      authorized: true,
      expired: false,
      expiresIn,
      message: `Token valid, expires in ${expiresIn} seconds`
    };
  }
}

module.exports = AlibabaOAuth;
