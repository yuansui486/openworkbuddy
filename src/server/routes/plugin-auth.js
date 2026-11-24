/**
 * 插件授权 API 路由
 * Plugin Authorization API Routes
 */

const express = require('express');
const router = express.Router();
const path = require('path');

/**
 * 获取插件实例
 */
async function getPluginInstance(pluginName) {
  try {
    const pluginDirMap = {
      'alibaba-international': 'alibaba-intl',
      'exchange-rate': 'exchange-rate',
      'google-trends': 'google-trends',
      'hs-code-lookup': 'hs-code',
      'shipping-calculator': 'shipping-calculator'
    };
    
    const pluginDir = pluginDirMap[pluginName] || pluginName;
    const pluginPath = path.join(__dirname, '../../../plugins', pluginDir);
    
    const PluginClass = require(pluginPath);
    
    const config = { 
      mode: 'oauth',
      enableOAuth: true
    };
    const plugin = new PluginClass(config);
    
    // 调用 onInit 初始化
    if (typeof plugin.onInit === 'function') {
      await plugin.onInit();
    }

    return plugin;
  } catch (error) {
    console.error(`[PluginAuth] 无法加载插件 ${pluginName}:`, error);
    return null;
  }
}

/**
 * GET /api/plugins/:pluginId/auth/status
 * 获取插件授权状态
 */
router.get('/:pluginId/auth/status', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const plugin = await getPluginInstance(pluginId);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: '插件不存在'
      });
    }

    // 检查授权状态
    if (plugin.tokenManager && typeof plugin.tokenManager.isAuthorized === 'function') {
      const isAuthorized = await plugin.tokenManager.isAuthorized();
      
      res.json({
        success: true,
        authorized: isAuthorized
      });
    } else {
      res.json({
        success: true,
        authorized: false
      });
    }
  } catch (error) {
    console.error('[PluginAuth] 获取授权状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:pluginId/auth/start
 * 启动授权流程
 */
router.post('/:pluginId/auth/start', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const plugin = await getPluginInstance(pluginId);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: '插件不存在'
      });
    }

    if (!plugin.oauth || typeof plugin.oauth.generateAuthUrl !== 'function') {
      return res.status(400).json({
        success: false,
        error: '插件不支持 OAuth 授权'
      });
    }

    // 生成 state
    const state = Math.random().toString(36).substring(7);
    
    // 生成授权 URL
    const authUrl = plugin.oauth.generateAuthUrl({ state });

    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('[PluginAuth] 启动授权失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/:pluginId/auth/check
 * 检查授权是否完成
 */
router.get('/:pluginId/auth/check', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const plugin = await getPluginInstance(pluginId);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: '插件不存在'
      });
    }

    // 检查授权状态
    const isAuthorized = await plugin.tokenManager.isAuthorized();

    res.json({
      success: true,
      authorized: isAuthorized
    });
  } catch (error) {
    console.error('[PluginAuth] 检查授权失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:pluginId/auth/revoke
 * 撤销授权
 */
router.post('/:pluginId/auth/revoke', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const plugin = await getPluginInstance(pluginId);

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: '插件不存在'
      });
    }

    if (plugin.tokenManager && typeof plugin.tokenManager.deleteToken === 'function') {
      await plugin.tokenManager.deleteToken();
      
      res.json({
        success: true,
        message: '授权已撤销'
      });
    } else {
      res.status(400).json({
        success: false,
        error: '插件不支持撤销授权'
      });
    }
  } catch (error) {
    console.error('[PluginAuth] 撤销授权失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
