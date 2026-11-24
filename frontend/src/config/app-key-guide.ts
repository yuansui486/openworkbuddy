/**
 * 阿里开放平台 App Key 一键申请引导
 *
 * 模拟 Accio Work 的零配置体验
 */

export const APP_KEY_GUIDE = {
  title: '连接阿里巴巴开放平台',

  steps: [
    {
      title: '1. 访问阿里开放平台',
      content: '打开 https://open.1688.com 并登录你的阿里巴巴账号',
      action: () => window.open('https://open.1688.com', '_blank')
    },
    {
      title: '2. 创建应用',
      content: '点击"控制台" → "应用管理" → "创建应用"',
      detail: `
应用名称：国际站生意助手
应用类型：网页应用
回调地址：${window.location.origin}/oauth-callback.html
授权范围：选择【商品】【订单】【店铺】相关权限
      `
    },
    {
      title: '3. 获取密钥',
      content: '创建完成后，复制 App Key 和 App Secret',
      note: '⚠️ App Secret 只显示一次，请妥善保存'
    },
    {
      title: '4. 粘贴到设置',
      content: '返回本应用，在设置页面填入 App Key 和 App Secret 即可使用'
    }
  ],

  // 快速申请链接（直达创建页面）
  quickApplyURL: 'https://open.1688.com/app/appList.htm',

  // 所需权限列表
  requiredScopes: [
    'alibaba.product:product.get',
    'alibaba.product:product.search',
    'alibaba.trade:trade.rfq.list',
    'alibaba.shop:shop.get',
    'alibaba.logistics:logistics.trace.query'
  ]
}

/**
 * 检测是否可以跳过申请（开发者模式）
 */
export function canSkipAppKey(): boolean {
  // 如果在 localhost 开发环境，可以使用沙箱模式
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1'
}
