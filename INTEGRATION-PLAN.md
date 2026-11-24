# OpenWorkBuddy × Accio Work 整合计划

**项目目标**: 基于 OpenWorkBuddy，整合 Accio Work 的核心功能，打造针对外贸（阿里巴巴国际站）的专业 AI 工具

**时间**: 2026-11-23  
**负责人**: Claude + 子 Agents

---

## 🎯 项目概览

### 目标定位
- **基础项目**: OpenWorkBuddy（已有的 AI 办公工作台）
- **整合来源**: Accio Work 克隆项目（alibaba 目录）
- **垂直领域**: 外贸行业，特别是阿里巴巴国际站
- **交付成果**: 功能完整的外贸 AI 工作台

### 核心价值
1. **专家系统** - 外贸专业的 AI 专家团队
2. **插件生态** - 阿里巴巴国际站等外贸平台集成
3. **技能库** - 外贸业务流程自动化
4. **可视化界面** - 参考 Accio Work 的优秀 UI/UX

---

## 📊 资源盘点

### OpenWorkBuddy 现状

**架构**:
```
openworkbuddy/
├── src/
│   ├── agent/          # Agent 系统
│   ├── core/           # 核心功能
│   ├── desktop/        # 桌面应用
│   ├── domains/        # 领域模块
│   ├── engines/        # 执行引擎
│   ├── tools/          # 工具集
│   └── server/         # 服务端
├── skills/             # 技能库
├── experts.json        # 专家定义（已有）
└── package.json        # Node.js + Electron
```

**已有能力**:
- ✅ 专家系统框架（experts.json）
- ✅ 技能系统（skills/）
- ✅ Agent 协作机制
- ✅ 文件生成（PPT/Word/Excel）
- ✅ 联网搜索
- ✅ 定时任务
- ✅ IM 集成（飞书等）

**技术栈**:
- Node.js (>=22)
- Electron（桌面应用）
- Express（服务端）
- Anthropic SDK
- 文档处理（docx, exceljs, pptxgenjs）

---

### Accio Work 克隆现状

**架构**:
```
alibaba/
├── src/
│   ├── components/     # React 组件
│   │   ├── chat/      # 聊天界面
│   │   ├── common/    # 通用组件
│   │   └── ...
│   ├── views/          # 页面视图
│   ├── stores/         # 状态管理（Zustand）
│   ├── layouts/        # 布局
│   └── styles/         # 样式系统
├── public/             # 静态资源
└── package.json        # React + Vite + Tauri
```

**已实现功能**:
- ✅ 完整的专家管理界面
- ✅ 插件市场
- ✅ 技能管理
- ✅ 聊天界面
- ✅ 设置面板
- ✅ 完整的设计系统（94% 还原度）
- ✅ 状态管理（Zustand stores）

**技术栈**:
- React 18
- TypeScript
- Vite
- Tauri（桌面应用）
- Ant Design
- Zustand（状态管理）

---

## 🔄 整合策略

### 方案选择：混合架构

**核心理念**: 
- 保留 OpenWorkBuddy 的后端能力（Agent 系统、文件生成、技能执行）
- 采用 Accio Work 的前端界面（React + 现代化 UI）
- 新增外贸垂直领域的专家和插件

**技术路线**:
```
前端（来自 Accio）       后端（来自 OpenWorkBuddy）
     ↓                           ↓
React + Tauri     ←→ IPC →    Node.js + Express
     ↓                           ↓
  UI/UX 界面                 Agent 引擎
  状态管理                   技能执行
  专家/插件展示              文件生成
                            外部集成
```

---

## 📋 详细任务分解

### 阶段 1: 基础整合（预计 2-3 小时）

#### 1.1 目录结构设计
```
openworkbuddy/
├── frontend/           # 新增：React 前端（从 alibaba 迁移）
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   └── styles/
│   ├── public/
│   └── package.json
├── src/               # 保留：Node.js 后端
│   ├── agent/
│   ├── core/
│   ├── api/          # 新增：前后端通信 API
│   └── ...
├── skills/            # 扩展：新增外贸技能
├── experts.json       # 扩展：新增外贸专家
└── plugins/           # 新增：插件定义
```

#### 1.2 前端迁移
- [ ] 创建 `frontend/` 目录
- [ ] 复制 Accio Work 的前端代码
- [ ] 调整构建配置（Vite + Tauri）
- [ ] 配置前后端通信接口

#### 1.3 API 设计
```typescript
// 专家管理 API
GET    /api/experts              // 获取专家列表
POST   /api/experts              // 创建专家
PUT    /api/experts/:id          // 更新专家
DELETE /api/experts/:id          // 删除专家

// 插件管理 API
GET    /api/plugins              // 获取插件列表
POST   /api/plugins/:id/install  // 安装插件
POST   /api/plugins/:id/config   // 配置插件

// 技能管理 API
GET    /api/skills               // 获取技能列表
POST   /api/skills/:id/execute   // 执行技能

// 聊天 API
POST   /api/chat/send            // 发送消息
GET    /api/chat/history         // 获取历史
WS     /api/chat/stream          // 流式响应
```

---

### 阶段 2: 外贸专家开发（预计 3-4 小时）

#### 2.1 外贸专家定义

**采购专家**:
```json
{
  "name": "国际采购专家",
  "alias": "买得精",
  "avatar": "shopping-cart",
  "category": "外贸采购",
  "tags": ["供应商筛选", "价格谈判", "质量把控"],
  "description": "擅长阿里巴巴国际站供应商筛选、价格对比、采购建议",
  "skills": ["alibaba-search", "supplier-analysis", "price-compare"],
  "system": "你是国际采购专家，精通阿里巴巴国际站..."
}
```

**销售专家**:
```json
{
  "name": "外贸销售专家",
  "alias": "卖得好",
  "avatar": "dollar",
  "category": "外贸销售",
  "tags": ["客户开发", "报价", "跟进"],
  "description": "擅长外贸客户开发、产品报价、订单跟进",
  "skills": ["customer-search", "quotation", "email-template"],
  "system": "你是外贸销售专家..."
}
```

**合规专家**:
```json
{
  "name": "外贸合规专家",
  "alias": "守规矩",
  "avatar": "shield",
  "category": "外贸合规",
  "tags": ["海关", "认证", "风险"],
  "description": "擅长海关政策、产品认证、贸易风险分析",
  "skills": ["customs-check", "certification-query"],
  "system": "你是外贸合规专家..."
}
```

**物流专家**:
```json
{
  "name": "国际物流专家",
  "alias": "送得稳",
  "avatar": "truck",
  "category": "外贸物流",
  "tags": ["运输方式", "成本核算", "时效"],
  "description": "擅长国际物流方案、运费计算、货代选择",
  "skills": ["freight-calculate", "route-plan"],
  "system": "你是国际物流专家..."
}
```

#### 2.2 专家能力矩阵

| 专家 | 核心技能 | 适用场景 | 优先级 |
|------|----------|----------|--------|
| 国际采购专家 | 供应商筛选、价格对比 | 寻找供应商、采购决策 | P0 |
| 外贸销售专家 | 客户开发、报价生成 | 开发客户、报价单 | P0 |
| 产品分析师 | 市场分析、竞品研究 | 选品、定价策略 | P1 |
| 外贸合规专家 | 政策查询、认证指导 | 合规检查、认证咨询 | P1 |
| 国际物流专家 | 运费计算、路线规划 | 物流方案、成本控制 | P1 |
| 文案专员 | 产品描述、邮件模板 | 营销文案、商务邮件 | P2 |

---

### 阶段 3: 外贸插件开发（预计 4-5 小时）

#### 3.1 核心插件清单

**阿里巴巴国际站插件** (P0):
```typescript
{
  id: 'alibaba-intl',
  name: '阿里巴巴国际站',
  category: 'ecommerce',
  capabilities: [
    '供应商搜索',
    '产品搜索',
    '供应商详情',
    '价格监控',
    '评价分析'
  ],
  auth: 'api-key',
  tools: [
    'searchSuppliers',
    'getSupplierInfo',
    'searchProducts',
    'comparePrice'
  ]
}
```

**Google Trends 插件** (P1):
```typescript
{
  id: 'google-trends',
  name: 'Google Trends',
  category: 'market-research',
  capabilities: ['搜索趋势', '区域对比', '相关查询'],
  auth: 'none',
  tools: ['getTrends', 'compareRegions']
}
```

**海关数据插件** (P1):
```typescript
{
  id: 'customs-data',
  name: '海关数据查询',
  category: 'compliance',
  capabilities: ['HS编码', '关税查询', '进出口数据'],
  auth: 'api-key',
  tools: ['getHSCode', 'getTariff', 'getTradeData']
}
```

**汇率查询插件** (P2):
```typescript
{
  id: 'exchange-rate',
  name: '实时汇率',
  category: 'finance',
  capabilities: ['汇率查询', '历史汇率', '汇率预测'],
  auth: 'none',
  tools: ['getCurrentRate', 'getHistorical']
}
```

#### 3.2 插件架构设计

```typescript
// plugins/base.ts
interface Plugin {
  id: string
  name: string
  category: PluginCategory
  version: string
  description: string
  capabilities: string[]
  auth: AuthType
  config?: PluginConfig
  tools: PluginTool[]
}

interface PluginTool {
  name: string
  description: string
  parameters: ParameterSchema
  execute: (params: any) => Promise<any>
}

// plugins/alibaba-intl/index.ts
export const alibabaIntlPlugin: Plugin = {
  id: 'alibaba-intl',
  name: '阿里巴巴国际站',
  // ...
  tools: [
    {
      name: 'searchSuppliers',
      description: '搜索供应商',
      parameters: {
        keyword: 'string',
        country?: 'string',
        minOrder?: 'number'
      },
      execute: async (params) => {
        // 调用阿里巴巴 API
        return suppliers
      }
    }
  ]
}
```

---

### 阶段 4: 外贸技能开发（预计 3-4 小时）

#### 4.1 技能库规划

**采购流程技能**:
- `supplier-screening` - 供应商筛选
- `price-negotiation` - 价格谈判辅助
- `sample-order` - 样品订单处理
- `bulk-order` - 批量订单管理

**销售流程技能**:
- `customer-outreach` - 客户开发
- `quotation-generation` - 报价单生成
- `order-tracking` - 订单跟踪
- `after-sales` - 售后支持

**分析决策技能**:
- `market-analysis` - 市场分析
- `competitor-research` - 竞品研究
- `supplier-evaluation` - 供应商评估
- `risk-assessment` - 风险评估

#### 4.2 技能实现示例

```javascript
// skills/supplier-screening.js
module.exports = {
  name: 'supplier-screening',
  description: '根据需求自动筛选阿里巴巴国际站供应商',
  
  parameters: {
    product: { type: 'string', required: true },
    minOrder: { type: 'number' },
    country: { type: 'string' },
    certifications: { type: 'array' }
  },
  
  async execute(params, context) {
    // 1. 搜索供应商
    const suppliers = await context.plugin('alibaba-intl')
      .searchSuppliers(params)
    
    // 2. 过滤条件
    const filtered = suppliers.filter(s => 
      s.minOrder <= params.minOrder &&
      s.verifiedLevel >= 3
    )
    
    // 3. 评分排序
    const scored = filtered.map(s => ({
      ...s,
      score: calculateScore(s)
    }))
    
    // 4. 生成报告
    return {
      total: scored.length,
      recommended: scored.slice(0, 5),
      report: generateMarkdownReport(scored)
    }
  }
}
```

---

### 阶段 5: UI 适配（预计 2-3 小时）

#### 5.1 主题定制
- 保留 Accio Work 的设计令牌
- 新增外贸主题色（商务蓝、专业灰）
- 优化图标库（外贸相关图标）

#### 5.2 页面扩展
- **供应商管理** - 收藏、对比、评价
- **订单跟踪** - 可视化流程
- **市场洞察** - 趋势图表、数据分析
- **知识库** - 外贸知识、政策法规

#### 5.3 组件开发
- `SupplierCard` - 供应商卡片
- `QuotationForm` - 报价单表单
- `OrderTimeline` - 订单时间线
- `MarketChart` - 市场图表

---

## 🎯 子 Agent 任务分配

### Agent 1: 架构师
**任务**: 设计前后端通信架构
- 分析 OpenWorkBuddy 的 API 结构
- 设计 RESTful API 规范
- 制定 IPC 通信方案（Tauri）
- 输出：架构设计文档

### Agent 2: 前端工程师
**任务**: 迁移和适配 React 前端
- 创建 frontend 目录结构
- 迁移 Accio Work 组件
- 适配 OpenWorkBuddy API
- 输出：可运行的前端应用

### Agent 3: 专家系统工程师
**任务**: 开发外贸专家
- 定义 5+ 个外贸专家
- 编写专家系统提示词
- 整合到 experts.json
- 输出：外贸专家配置

### Agent 4: 插件工程师
**任务**: 开发核心插件
- 阿里巴巴国际站插件
- 海关数据插件
- Google Trends 插件
- 输出：插件代码 + 测试

### Agent 5: 技能工程师
**任务**: 开发外贸技能
- 供应商筛选技能
- 报价生成技能
- 市场分析技能
- 输出：技能代码 + 文档

---

## 📅 时间规划

### Sprint 1（第 1 天，8 小时）
- 基础整合（3h）
- 外贸专家开发（3h）
- API 设计（2h）

### Sprint 2（第 2 天，8 小时）
- 插件开发（5h）
- 技能开发（3h）

### Sprint 3（第 3 天，6 小时）
- UI 适配（3h）
- 集成测试（2h）
- 文档完善（1h）

**总计**: 22 小时（约 3 个工作日）

---

## ✅ 验收标准

### 功能完整性
- [ ] 至少 5 个外贸专家可用
- [ ] 至少 3 个核心插件可用
- [ ] 至少 5 个外贸技能可用
- [ ] 前后端通信正常
- [ ] 界面操作流畅

### 质量标准
- [ ] 专家回复准确度 > 85%
- [ ] 插件调用成功率 > 95%
- [ ] 界面响应时间 < 500ms
- [ ] 完整的用户文档

### 商业价值
- [ ] 能独立完成供应商筛选
- [ ] 能生成专业报价单
- [ ] 能提供市场分析报告
- [ ] 能回答外贸常见问题

---

## 🚀 立即开始

准备好启动整合项目！

**第一步建议**:
1. 创建项目分支
2. 启动 5 个子 Agent
3. 并行执行任务
4. 持续集成测试

**需要我立即开始吗？**

---

**计划制定时间**: 2026-11-23 17:08  
**预计完成时间**: 2026-11-26  
**状态**: ✅ 计划就绪，等待启动
