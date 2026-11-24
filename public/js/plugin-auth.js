/**
 * 插件授权管理模块
 * Plugin Authorization Manager
 *
 * 提供插件 OAuth 授权的前端交互功能
 */

class PluginAuthManager {
  constructor() {
    this.authStatus = {};
    this.activePolling = new Map(); // 存储活跃的轮询任务
    this.authWindows = new Map(); // 存储授权窗口引用
  }

  /**
   * 获取插件授权状态
   * @param {string} pluginId - 插件 ID
   * @returns {Promise<object>} 授权状态信息
   */
  async getAuthStatus(pluginId) {
    try {
      const response = await fetch(`/api/plugins/${pluginId}/auth/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const status = await response.json();
      this.authStatus[pluginId] = status;
      return status;
    } catch (error) {
      console.error(`[PluginAuth] 获取授权状态失败 (${pluginId}):`, error);
      return {
        authorized: false,
        error: error.message
      };
    }
  }

  /**
   * 启动授权流程
   * @param {string} pluginId - 插件 ID
   * @param {object} options - 配置选项
   * @returns {Promise<object>} 授权结果
   */
  async startAuth(pluginId, options = {}) {
    try {
      // 1. 生成授权 URL
      const response = await fetch(`/api/plugins/${pluginId}/auth/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const { authUrl, state, sessionId } = await response.json();

      // 2. 在新窗口打开授权页面
      const authWindow = this.openAuthWindow(authUrl, pluginId);
      this.authWindows.set(pluginId, authWindow);

      // 3. 轮询检查授权状态
      const result = await this.pollAuthStatus(pluginId, state, sessionId, authWindow);

      // 4. 清理
      this.authWindows.delete(pluginId);

      return result;
    } catch (error) {
      console.error(`[PluginAuth] 授权启动失败 (${pluginId}):`, error);
      this.authWindows.delete(pluginId);
      throw error;
    }
  }

  /**
   * 打开授权窗口
   * @param {string} authUrl - 授权 URL
   * @param {string} pluginId - 插件 ID
   * @returns {Window} 授权窗口对象
   */
  openAuthWindow(authUrl, pluginId) {
    const width = 600;
    const height = 700;
    const left = Math.floor((screen.width - width) / 2);
    const top = Math.floor((screen.height - height) / 2);

    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
      'resizable=yes',
      'scrollbars=yes'
    ].join(',');

    const authWindow = window.open(
      authUrl,
      `oauth-auth-${pluginId}`,
      features
    );

    if (!authWindow) {
      throw new Error('无法打开授权窗口，请检查浏览器是否阻止了弹出窗口');
    }

    return authWindow;
  }

  /**
   * 轮询授权状态
   * @param {string} pluginId - 插件 ID
   * @param {string} state - 状态令牌
   * @param {string} sessionId - 会话 ID
   * @param {Window} authWindow - 授权窗口引用
   * @returns {Promise<object>} 授权结果
   */
  async pollAuthStatus(pluginId, state, sessionId, authWindow) {
    const maxAttempts = 60; // 最多等待 5 分钟
    const pollInterval = 5000; // 每 5 秒检查一次
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;

        try {
          // 检查窗口是否关闭
          if (authWindow.closed) {
            clearInterval(interval);
            this.activePolling.delete(pluginId);
            reject(new Error('授权窗口已关闭，授权流程中断'));
            return;
          }

          // 检查授权状态
          const status = await this.checkAuthCallback(pluginId, state, sessionId);

          if (status.authorized) {
            clearInterval(interval);
            this.activePolling.delete(pluginId);
            if (!authWindow.closed) {
              authWindow.close();
            }
            resolve(status);
            return;
          }

          if (status.error) {
            clearInterval(interval);
            this.activePolling.delete(pluginId);
            if (!authWindow.closed) {
              authWindow.close();
            }
            reject(new Error(status.error));
            return;
          }

          // 超时检查
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            this.activePolling.delete(pluginId);
            if (!authWindow.closed) {
              authWindow.close();
            }
            reject(new Error('授权超时，请重试'));
          }
        } catch (error) {
          console.error(`[PluginAuth] 轮询检查失败 (${pluginId}):`, error);
        }
      }, pollInterval);

      this.activePolling.set(pluginId, interval);
    });
  }

  /**
   * 检查授权回调
   * @param {string} pluginId - 插件 ID
   * @param {string} state - 状态令牌
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<object>} 授权状态
   */
  async checkAuthCallback(pluginId, state, sessionId) {
    try {
      const params = new URLSearchParams({ state });
      if (sessionId) {
        params.append('sessionId', sessionId);
      }

      const response = await fetch(`/api/plugins/${pluginId}/auth/check?${params}`);

      if (!response.ok) {
        return { authorized: false };
      }

      return await response.json();
    } catch (error) {
      console.error(`[PluginAuth] 检查授权回调失败 (${pluginId}):`, error);
      return { authorized: false };
    }
  }

  /**
   * 撤销授权
   * @param {string} pluginId - 插件 ID
   * @returns {Promise<object>} 撤销结果
   */
  async revokeAuth(pluginId) {
    try {
      const response = await fetch(`/api/plugins/${pluginId}/auth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.authStatus[pluginId] = { authorized: false };
      return result;
    } catch (error) {
      console.error(`[PluginAuth] 撤销授权失败 (${pluginId}):`, error);
      throw error;
    }
  }

  /**
   * 取消授权流程
   * @param {string} pluginId - 插件 ID
   */
  cancelAuth(pluginId) {
    // 停止轮询
    if (this.activePolling.has(pluginId)) {
      clearInterval(this.activePolling.get(pluginId));
      this.activePolling.delete(pluginId);
    }

    // 关闭授权窗口
    if (this.authWindows.has(pluginId)) {
      const authWindow = this.authWindows.get(pluginId);
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      this.authWindows.delete(pluginId);
    }
  }

  /**
   * 刷新所有插件的授权状态
   * @param {string[]} pluginIds - 插件 ID 列表
   * @returns {Promise<object>} 所有插件的授权状态
   */
  async refreshAllStatus(pluginIds) {
    const results = {};
    await Promise.all(
      pluginIds.map(async (pluginId) => {
        try {
          results[pluginId] = await this.getAuthStatus(pluginId);
        } catch (error) {
          results[pluginId] = { authorized: false, error: error.message };
        }
      })
    );
    return results;
  }
}

// 导出全局实例
if (typeof window !== 'undefined') {
  window.PluginAuthManager = PluginAuthManager;
  window.pluginAuthManager = new PluginAuthManager();
}

// 支持 CommonJS 和 ES6 模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PluginAuthManager;
}
