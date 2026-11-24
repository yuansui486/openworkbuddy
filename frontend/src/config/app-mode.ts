/**
 * 完全独立模式配置
 *
 * 移除 MCP 网关依赖，改用以下方式：
 * 1. Mock 数据模式 - LLM 生成模拟数据
 * 2. 直连 API 模式 - 直接调用阿里开放平台（需要 appKey）
 */

export const APP_MODE = {
  /** 使用 MCP 网关（需要 Accio Desktop 运行）*/
  MCP_GATEWAY: 'mcp',
  /** 模拟数据模式（LLM 生成合理数据）*/
  MOCK_DATA: 'mock',
  /** 直连阿里 API（需要开放平台授权）*/
  DIRECT_API: 'direct'
} as const

export type AppMode = typeof APP_MODE[keyof typeof APP_MODE]

/** 当前运行模式（从 localStorage 读取用户设置）*/
export function getCurrentMode(): AppMode {
  try {
    const saved = localStorage.getItem('app_mode')
    if (saved && Object.values(APP_MODE).includes(saved as AppMode)) {
      return saved as AppMode
    }
  } catch {}
  return APP_MODE.MOCK_DATA // 默认模拟数据模式
}

export const CURRENT_MODE = getCurrentMode()

/**
 * 在 Mock 模式下，技能调用会：
 * 1. 用户问："帮我查询最新 RFQ"
 * 2. LLM 收到增强提示："你需要生成 5-10 条模拟的 RFQ 数据，包含标题、价格、买家国家、发布时间"
 * 3. LLM 直接生成合理的表格数据返回
 *
 * 优点：
 * - 完全独立，无需任何外部依赖
 * - 演示/测试场景完全够用
 * - 可以切换到真实 API 模式
 */

export const MOCK_MODE_PROMPT_ENHANCEMENT = `
## 当前为模拟数据模式

用户请求的数据工具调用（如 RFQ 搜索、商品查询、店铺诊断）无法连接真实数据源。
请根据用户问题生成**合理、详细的模拟数据**，确保：

1. **数据结构完整**：包含所有关键字段（标题、价格、时间、地区等）
2. **数值合理**：价格、数量、百分比符合行业常识
3. **明确标注**：在回复开头说明"以下为模拟数据"

示例：
- RFQ 查询 → 生成 5-10 条询盘（产品名、目标价格、买家国家、MOQ、发布时间）
- 商品列表 → 生成 10-20 个商品（标题、价格、库存、销量、评分）
- 店铺诊断 → 生成健康评分、流量数据、转化率、建议清单
`
