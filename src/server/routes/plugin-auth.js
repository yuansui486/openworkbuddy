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

    // 生成授权 URL（返回对象）
    const authResult = plugin.oauth.generateAuthUrl({ state });

    res.json({
      success: true,
      authUrl: authResult.authUrl || authResult.url,
      state: authResult.state || state
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

/**
 * GET /api/plugins/:pluginId/auth/callback
 * OAuth 回调端点
 */
router.get('/:pluginId/auth/callback', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { code, state } = req.query;

    console.log(`[PluginAuth] 收到 OAuth 回调: pluginId=${pluginId}, state=${state}, code=${code ? '存在' : '缺失'}`);

    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>授权失败</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>❌ 授权失败</h1>
            <p>未收到授权码，请重试。</p>
            <button onclick="window.close()">关闭窗口</button>
          </body>
        </html>
      `);
    }

    const plugin = await getPluginInstance(pluginId);
    if (!plugin) {
      return res.status(404).send(`
        <html>
          <head><title>插件不存在</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>❌ 插件不存在</h1>
            <p>找不到插件: ${pluginId}</p>
            <button onclick="window.close()">关闭窗口</button>
          </body>
        </html>
      `);
    }

    // 使用授权码交换 Token
    if (plugin.oauth && typeof plugin.oauth.exchangeCodeForToken === 'function') {
      const tokenResult = await plugin.oauth.exchangeCodeForToken(code);

      if (tokenResult && tokenResult.access_token) {
        // 保存 Token
        await plugin.tokenManager.saveToken({
          access_token: tokenResult.access_token,
          refresh_token: tokenResult.refresh_token,
          expires_in: tokenResult.expires_in,
          token_type: tokenResult.token_type
        });

        console.log('[PluginAuth] ✅ OAuth 授权成功');

        return res.send(`
          <html>
            <head><title>授权成功</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1>✅ 授权成功</h1>
              <p>您已成功授权，窗口将自动关闭...</p>
              <script>
                setTimeout(() => window.close(), 2000);
              </script>
            </body>
          </html>
        `);
      }
    }

    throw new Error('Token 交换失败');

  } catch (error) {
    console.error('[PluginAuth] OAuth 回调失败:', error);
    res.status(500).send(`
      <html>
        <head><title>授权失败</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>❌ 授权失败</h1>
          <p>${error.message}</p>
          <button onclick="window.close()">关闭窗口</button>
        </body>
      </html>
    `);
  }
});

module.exports = router;
