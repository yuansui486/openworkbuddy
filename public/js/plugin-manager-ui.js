/**
 * 插件管理界面
 * Plugin Manager UI
 *
 * 提供插件列表展示和授权管理的用户界面
 */

class PluginManagerUI {
  constructor(containerId = 'plugin-manager') {
    this.container = document.getElementById(containerId);
    this.authManager = window.pluginAuthManager;
    this.plugins = [];
  }

  /**
   * 初始化插件管理界面
   */
  async init() {
    if (!this.container) {
      console.error('[PluginManagerUI] 容器元素不存在');
      return;
    }

    await this.loadPlugins();
    this.render();
    await this.refreshAuthStatus();
  }

  /**
   * 加载插件列表
   */
  async loadPlugins() {
    try {
      const response = await fetch('/api/plugins');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.plugins = await response.json();
    } catch (error) {
      console.error('[PluginManagerUI] 加载插件列表失败:', error);
      this.plugins = this.getDefaultPlugins();
    }
  }

  /**
   * 获取默认插件列表（后备方案）
   */
  getDefaultPlugins() {
    return [
      {
        id: 'alibaba-intl',
        name: '阿里巴巴国际站',
        description: '阿里巴巴国际站供应商和产品查询插件，支持 OAuth 授权',
        version: '2.0.0',
        author: 'OpenWorkBuddy',
        supportsAuth: true
      },
      {
        id: 'exchange-rate',
        name: '汇率查询',
        description: '实时汇率查询和货币转换插件',
        version: '1.0.0',
        author: 'OpenWorkBuddy',
        supportsAuth: false
      },
      {
        id: 'shipping-calculator',
        name: '物流计算',
        description: '国际物流运费计算和时效查询插件',
        version: '1.0.0',
        author: 'OpenWorkBuddy',
        supportsAuth: false
      },
      {
        id: 'hs-code',
        name: 'HS编码查询',
        description: '海关编码（HS Code）查询和关税信息查询插件',
        version: '1.0.0',
        author: 'OpenWorkBuddy',
        supportsAuth: false
      },
      {
        id: 'google-trends',
        name: '趋势分析',
        description: '市场趋势分析和关键词搜索热度查询插件',
        version: '1.0.0',
        author: 'OpenWorkBuddy',
        supportsAuth: false
      }
    ];
  }

  /**
   * 渲染插件列表
   */
  render() {
    const html = `
      <div class="plugin-manager-container">
        <div class="plugin-manager-header">
          <h2>插件管理</h2>
          <button class="refresh-btn" onclick="pluginManagerUI.refreshAuthStatus()">
            刷新状态
          </button>
        </div>
        <div class="plugin-list">
          ${this.plugins.map(plugin => this.renderPluginCard(plugin)).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * 渲染插件卡片
   */
  renderPluginCard(plugin) {
    const authHtml = plugin.supportsAuth
      ? `
        <div class="plugin-auth-status">
          <button
            class="auth-btn unauthorized"
            id="auth-btn-${plugin.id}"
            onclick="pluginManagerUI.handleAuth('${plugin.id}')"
          >
            <span class="icon">🔒</span>
            授权未连接
          </button>
        </div>
      `
      : `
        <div class="plugin-auth-status">
          <span class="auth-badge no-auth">无需授权</span>
        </div>
      `;

    return `
      <div class="plugin-card" id="plugin-${plugin.id}">
        <div class="plugin-header">
          <h3 class="plugin-title">${plugin.name}</h3>
          ${authHtml}
        </div>
        <div class="plugin-description">${plugin.description}</div>
        <div class="plugin-meta">
          <span class="plugin-meta-item">
            <span class="icon">📦</span>
            版本 ${plugin.version}
          </span>
          <span class="plugin-meta-item">
            <span class="icon">👤</span>
            ${plugin.author}
          </span>
        </div>
        <div id="auth-info-${plugin.id}" class="auth-info-container"></div>
      </div>
    `;
  }

  /**
   * 刷新所有插件的授权状态
   */
  async refreshAuthStatus() {
    const authPlugins = this.plugins.filter(p => p.supportsAuth);

    for (const plugin of authPlugins) {
      try {
        const status = await this.authManager.getAuthStatus(plugin.id);
        this.updateAuthButton(plugin.id, status);
      } catch (error) {
        console.error(`[PluginManagerUI] 刷新授权状态失败 (${plugin.id}):`, error);
      }
    }
  }

  /**
   * 更新授权按钮状态
   */
  updateAuthButton(pluginId, status) {
    const btn = document.getElementById(`auth-btn-${pluginId}`);
    if (!btn) return;

    // 移除所有状态类
    btn.classList.remove('unauthorized', 'authorized', 'authorizing', 'error', 'unsupported');

    if (!status.supported) {
      btn.classList.add('unsupported');
      btn.innerHTML = '<span class="icon">ℹ️</span> 不支持授权';
      btn.disabled = true;
      return;
    }

    if (status.authorized) {
      btn.classList.add('authorized');
      btn.innerHTML = '<span class="icon">✓</span> 已授权';
      btn.onclick = () => this.showAuthDetails(pluginId, status);

      // 显示授权信息
      this.showAuthInfo(pluginId, '授权成功', 'success');
    } else {
      btn.classList.add('unauthorized');
      btn.innerHTML = '<span class="icon">🔒</span> 授权未连接';
      btn.onclick = () => this.handleAuth(pluginId);
    }
  }

  /**
   * 处理授权流程
   */
  async handleAuth(pluginId) {
    const btn = document.getElementById(`auth-btn-${pluginId}`);
    if (!btn) return;

    try {
      // 更新按钮状态为授权中
      btn.classList.remove('unauthorized', 'authorized', 'error');
      btn.classList.add('authorizing');
      btn.innerHTML = '<span class="spinner"></span> 授权中...';
      btn.disabled = true;

      this.showAuthInfo(pluginId, '正在打开授权窗口，请在新窗口中完成授权...', 'warning');

      // 启动授权流程
      const result = await this.authManager.startAuth(pluginId);

      // 授权成功
      btn.classList.remove('authorizing');
      btn.classList.add('authorized');
      btn.innerHTML = '<span class="icon">✓</span> 已授权';
      btn.disabled = false;
      btn.onclick = () => this.showAuthDetails(pluginId, result);

      this.showAuthInfo(pluginId, '授权成功！插件已连接', 'success');
    } catch (error) {
      console.error(`[PluginManagerUI] 授权失败 (${pluginId}):`, error);

      // 授权失败
      btn.classList.remove('authorizing');
      btn.classList.add('error');
      btn.innerHTML = '<span class="icon">⚠️</span> 授权失败';
      btn.disabled = false;
      btn.onclick = () => this.handleAuth(pluginId);

      this.showAuthInfo(pluginId, `授权失败: ${error.message}`, 'error');

      // 3秒后恢复未授权状态
      setTimeout(() => {
        btn.classList.remove('error');
        btn.classList.add('unauthorized');
        btn.innerHTML = '<span class="icon">🔒</span> 授权未连接';
      }, 3000);
    }
  }

  /**
   * 显示授权详情
   */
  showAuthDetails(pluginId, status) {
    const container = document.getElementById(`auth-info-${pluginId}`);
    if (!container) return;

    const hasDetails = status.tokenInfo || status.expiresAt || status.scope;

    if (!hasDetails) {
      // 如果没有详情，提供撤销选项
      container.innerHTML = `
        <div class="auth-info success">
          <span class="icon">✓</span>
          <span>已授权</span>
          <button class="revoke-btn" onclick="pluginManagerUI.handleRevoke('${pluginId}')">
            撤销授权
          </button>
        </div>
      `;
      return;
    }

    const expiresAt = status.expiresAt || status.tokenInfo?.expiresAt;
    const expiresText = expiresAt
      ? new Date(expiresAt).toLocaleString('zh-CN')
      : '长期有效';

    container.innerHTML = `
      <div class="auth-details">
        <div class="auth-details-row">
          <span class="auth-details-label">授权状态:</span>
          <span class="auth-details-value">✓ 已授权</span>
        </div>
        ${expiresAt ? `
          <div class="auth-details-row">
            <span class="auth-details-label">过期时间:</span>
            <span class="auth-details-value">${expiresText}</span>
          </div>
        ` : ''}
        ${status.scope ? `
          <div class="auth-details-row">
            <span class="auth-details-label">授权范围:</span>
            <span class="auth-details-value">${status.scope}</span>
          </div>
        ` : ''}
        <div class="auth-details-row">
          <button class="revoke-btn" onclick="pluginManagerUI.handleRevoke('${pluginId}')">
            撤销授权
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 处理撤销授权
   */
  async handleRevoke(pluginId) {
    if (!confirm('确定要撤销授权吗？')) {
      return;
    }

    try {
      await this.authManager.revokeAuth(pluginId);

      // 更新UI
      const btn = document.getElementById(`auth-btn-${pluginId}`);
      if (btn) {
        btn.classList.remove('authorized');
        btn.classList.add('unauthorized');
        btn.innerHTML = '<span class="icon">🔒</span> 授权未连接';
        btn.onclick = () => this.handleAuth(pluginId);
      }

      // 清除授权详情
      const container = document.getElementById(`auth-info-${pluginId}`);
      if (container) {
        container.innerHTML = '';
      }

      this.showAuthInfo(pluginId, '授权已撤销', 'warning');

      // 3秒后清除消息
      setTimeout(() => {
        const infoContainer = document.getElementById(`auth-info-${pluginId}`);
        if (infoContainer) {
          infoContainer.innerHTML = '';
        }
      }, 3000);
    } catch (error) {
      console.error(`[PluginManagerUI] 撤销授权失败 (${pluginId}):`, error);
      this.showAuthInfo(pluginId, `撤销失败: ${error.message}`, 'error');
    }
  }

  /**
   * 显示授权信息提示
   */
  showAuthInfo(pluginId, message, type = 'info') {
    const container = document.getElementById(`auth-info-${pluginId}`);
    if (!container) return;

    const icons = {
      success: '✓',
      error: '⚠️',
      warning: 'ℹ️',
      info: 'ℹ️'
    };

    container.innerHTML = `
      <div class="auth-info ${type}">
        <span class="icon">${icons[type]}</span>
        <span>${message}</span>
      </div>
    `;
  }
}

// 全局实例
if (typeof window !== 'undefined') {
  window.PluginManagerUI = PluginManagerUI;
  window.pluginManagerUI = new PluginManagerUI();
}

// 支持模块导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PluginManagerUI;
}
