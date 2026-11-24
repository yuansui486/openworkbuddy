# 外贸核心技能文档

本文档介绍 OpenWorkBuddy 的 5 个外贸核心技能，帮助外贸从业者快速完成供应商筛选、报价、市场分析、合规检查和运费计算。

## 技能列表

### 1. supplier-screening（供应商筛选）

**功能**：多维度评分、过滤、排序，输出可对比的供应商清单和推荐报告

**使用场景**：
- 寻找合适的供应商
- 供应商比价
- 供应商尽调
- 采购决策支持

**输入参数**：
```javascript
{
  product: "产品名称/关键词",
  minOrder: 1000,              // 最小起订量要求
  country: "China",            // 供应商所在国家
  certifications: ["ISO9001", "CE", "RoHS"]  // 必需认证
}
```

**输出**：
- 多维度评分报告（价格、MOQ、认证、评分、响应率、经营年限）
- Top 5-8 供应商对比表
- 推荐方案（首选、备选、性价比之选）
- 风险提示
- Markdown 格式的完整筛选报告

**核心特性**：
- 调用 `alibaba-intl` 插件搜索供应商
- 100 分制综合评分模型
- 硬性过滤（必需认证、MOQ 超标）
- 自动货币转换（可选）

---

### 2. quotation-generator（报价单生成）

**功能**：成本计算、利润定价、货币转换，输出专业的报价单文档

**使用场景**：
- 给客户出报价
- 询盘回复
- 投标文件准备
- 内部成本核算

**输入参数**：
```javascript
{
  product: "产品名称",
  quantity: 5000,                    // 采购数量
  unitCost: 1.5,                     // 单位成本（USD）
  incoterm: "FOB",                   // 贸易条款（EXW/FOB/CIF/CFR/DDP）
  destination: "Los Angeles, USA",   // 目的地
  currency: "USD"                    // 报价币种（可选，默认 USD）
}
```

**输出**：
- 完整的中英双语报价单（Markdown）
- 费用明细拆解（产品成本、运费、利润、附加费）
- 价格梯度建议（鼓励大量采购）
- 贸易条款说明
- 可选 Excel 版本

**核心特性**：
- 自动计算总成本（成本 + 运费 + 利润 + 其他费用）
- 调用 `exchange-rate` 插件转换货币
- 支持 EXW/FOB/CIF/CFR/DDP 等 Incoterm
- 包含汇率、有效期、付款方式

**公式**：
```
总报价 = (单位成本 + 单位运费) × 数量 × (1 + 利润率) + 其他费用
```

---

### 3. market-analysis（市场分析）

**功能**：目标市场规模、竞品、价格、SWOT，输出可决策的市场进入报告

**使用场景**：
- 开拓新市场
- 产品出海
- 市场进入决策
- 投资可行性分析

**输入参数**：
```javascript
{
  product: "智能插座",
  targetMarket: "USA"  // 目标市场国家/地区
}
```

**输出**：
- 市场规模与趋势分析
- 国际竞品对比（至少 5-8 家）
- 目标客户画像（B 端 + C 端）
- 价格策略（三步定价法）
- SWOT 分析（针对该市场）
- 进入壁垒与合规要求
- 分阶段进入策略建议
- Markdown 格式的完整市场分析报告

**核心特性**：
- 联网搜索市场数据（`web_search` + `fetch_url`）
- 调用 `alibaba-intl` 验证供应商价格区间
- 调用 `exchange-rate` 转换目标市场货币
- 三步定价法（成本倒推 → 对标竞品 → 差异化）
- 具体的 SWOT（不空谈）

**分析框架**（五大模块）：
1. 市场规模与趋势
2. 竞品分析
3. 目标客户画像
4. 价格策略
5. SWOT 分析

---

### 4. compliance-check（合规检查）

**功能**：HS 编码、认证要求、禁限令、生成合规清单和风险提示

**使用场景**：
- 产品出口前的合规审查
- 清关准备
- 认证规划
- 风险评估

**输入参数**：
```javascript
{
  product: "Type-C USB 充电线",
  hsCode: "8544.42.9000",  // HS 编码（可选，系统可协助查询）
  destination: "USA"        // 目的国
}
```

**输出**：
- HS 编码验证（中国出口 + 目的国进口）
- 目的国认证要求清单（强制/自愿）
- 禁限令与管制检查
- 包装与标签要求
- 知识产权风险评估
- 合规清单（带状态标记 ✅/⚠️/💡）
- 风险分级提示（高/中/低）
- 下一步行动计划

**核心特性**：
- 双重 HS 编码验证（避免归类错误）
- 主要市场认证数据库（美国、欧盟、日本、澳洲）
- 关税税率计算
- 知识产权专利检索指导
- 合规时间表（甘特图）

**检查维度**（五大维度）：
1. HS 编码验证
2. 目的国认证要求
3. 禁限令与管制清单
4. 包装与标签要求
5. 知识产权风险

---

### 5. freight-calculator（运费计算）

**功能**：海运/空运/快递对比、时效分析、推荐最优方案

**使用场景**：
- 报价前的成本核算
- 物流方案选择
- 交期评估
- Incoterm 决策

**输入参数**：
```javascript
{
  weight: 1000,              // 实际重量（kg）
  volume: {                  // 体积（cm 或 m³）
    length: 500,
    width: 400,
    height: 300
  },
  origin: "Shenzhen, China",
  destination: "Los Angeles, USA",
  method: "all"              // 对比方式："sea"/"air"/"express"/"all"
}
```

**输出**：
- 计费重量计算（实重 vs 体积重）
- 海运/空运/快递三种方案对比
- 费用明细（运费 + 附加费 + 目的港费用）
- 时效分析（各环节耗时）
- 推荐最优方案（性价比或时效）
- Markdown 格式的运费报价单

**核心特性**：
- 自动计算体积重量（海运/空运/快递系数不同）
- 三种运输方式完整对比
- 费用拆解透明（基础运费 + 燃油 + 目的港杂费）
- 决策矩阵（根据货物特征推荐方案）
- Incoterm 匹配（FOB/CIF/DDP 包含的费用不同）

**运输方式对比**：
| 方式 | 适用 | 时效 | 成本 |
|---|---|---|---|
| **海运** | 大批量（> 1 CBM） | 3-6 周 | 最低 |
| **空运** | 中批量（100-500 kg） | 1-2 周 | 中等 |
| **快递** | 小件急货（< 100 kg） | 3-7 天 | 最高 |

---

## 技能组合使用示例

### 场景 1：开拓美国市场完整流程

```
步骤 1: market-analysis（市场分析）
→ 评估美国智能插座市场规模、竞品、定价策略

步骤 2: supplier-screening（供应商筛选）
→ 筛选 10+ 家供应商，选出 Top 5

步骤 3: compliance-check（合规检查）
→ 确认需要 FCC、UL 认证，HS 编码 8536.69

步骤 4: quotation-generator（报价单生成）
→ 生成 FOB 深圳报价单，$9.99/件，含价格梯度

步骤 5: freight-calculator（运费计算）
→ 对比海运/空运，推荐海运拼箱 $1.15/kg
```

### 场景 2：快速响应询盘

```
客户询盘：5000 件 USB 充电线，FOB 深圳，到美国

步骤 1: quotation-generator（报价单生成）
→ 立即生成报价单，$2.30/件

步骤 2: freight-calculator（运费计算）
→ 附加运费参考：海运 $1,150 (20-25 天)，空运 $5,400 (5-7 天)

步骤 3: compliance-check（合规检查）
→ 提示客户需要 FCC 认证，我方已具备
```

### 场景 3：供应商审核

```
需要为新产品找供应商

步骤 1: supplier-screening（供应商筛选）
→ 筛选出 Top 5 供应商

步骤 2: compliance-check（合规检查）
→ 验证供应商的认证是否齐全

步骤 3: quotation-generator（内部使用）
→ 计算成本，评估利润空间
```

---

## 技能与插件集成

### 依赖插件

**alibaba-intl（阿里巴巴国际站插件）**
- 用于：`supplier-screening`、`market-analysis`
- 功能：搜索供应商、获取产品价格、供应商详情

**exchange-rate（汇率查询插件）**
- 用于：`quotation-generator`、`market-analysis`、`freight-calculator`
- 功能：实时汇率查询、货币转换

### 插件调用示例

```javascript
// supplier-screening 调用 alibaba-intl
await alibabaIntl.execute('searchSuppliers', {
  keyword: "USB cable",
  country: "China",
  page: 1,
  pageSize: 20
});

// quotation-generator 调用 exchange-rate
await exchangeRate.execute('convert', {
  amount: 100,
  from: "USD",
  to: "EUR"
});
```

---

## 输出格式规范

所有技能生成的报告均为 **Markdown 格式**，包含：

### 文件命名规范
- 供应商筛选：`供应商筛选报告_[产品名]_[日期].md`
- 报价单：`报价单_QT-[日期编号].md`
- 市场分析：`[产品]_[目标市场]_市场分析报告_[日期].md`
- 合规清单：`[产品]_[目标市场]_合规清单_[日期].md`
- 运费报价：`运费报价_[起运地]-[目的地]_[日期].md`

### 报告结构
1. **标题与元信息**（产品、日期、编号）
2. **执行摘要**（3-5 条核心结论）
3. **详细分析**（表格 + 文字）
4. **推荐方案**（可执行的建议）
5. **风险提示**（具体风险 + 应对措施）
6. **参考来源**（所有数据来源链接）

---

## 质量标准

所有技能遵循统一的质量标准：

### 数据准确性
- ✅ 所有数字必须有来源或计算依据
- ✅ 时效信息必须标注日期
- ✅ 不编造数据，查不到就明确说明
- ✅ 区分"实际发生"和"预测"

### 可执行性
- ✅ 推荐方案可直接作为行动计划
- ✅ 风险提示包含具体应对措施
- ✅ 报告独立完整，不依赖口头补充
- ✅ 每个结论都能追溯到依据

### 专业性
- ✅ 使用行业标准术语（Incoterm、HS Code、MOQ）
- ✅ 中英双语对照（关键术语）
- ✅ 格式规范（表格、列表、编号）
- ✅ 视觉层次清晰（Markdown 标题、加粗、表格）

---

## 注意事项

### 数据时效性
- 汇率、运费、市场规模等数据有时效性
- 所有报告必须标注查询日期
- 建议定期更新（每季度或每次使用时）

### 插件配置
- `alibaba-intl` 默认使用 mock 数据模式
- 真实 API 需配置 `apiKey` 和 `apiSecret`
- `exchange-rate` 使用免费 API，有缓存机制（1 小时）

### 合规免责
- `compliance-check` 提供的信息仅供参考
- 具体认证和清关请咨询专业报关行/律师
- 本技能不承担因合规问题导致的损失

### 价格参考
- `freight-calculator` 的价格为市场参考价
- 实际运费需向货代询价
- 旺季（9-11 月）运费可能上浮 20-50%

---

## 技术实现

### 技能文件位置
```
openworkbuddy/
└── skills/
    ├── supplier-screening/
    │   └── skill.md
    ├── quotation-generator/
    │   └── skill.md
    ├── market-analysis/
    │   └── skill.md
    ├── compliance-check/
    │   └── skill.md
    └── freight-calculator/
        └── skill.md
```

### 技能加载
技能文件为 Markdown 格式的指令文档，由 OpenWorkBuddy 的 AI Agent 读取并执行。

### 插件加载
```javascript
// plugins/loader.js 自动加载插件
const alibabaIntl = require('./alibaba-intl');
const exchangeRate = require('./exchange-rate');
```

---

## 更新日志

### v1.0.0 (2026-11-23)
- ✅ 创建 5 个外贸核心技能
- ✅ 集成 alibaba-intl 和 exchange-rate 插件
- ✅ 完整的文档和示例
- ✅ 统一的质量标准和输出格式

---

## 反馈与改进

如有问题或建议，请：
1. 在项目 Issues 中提交
2. 或发送邮件至：contact@aijentra.com

---

## 许可证

遵循 OpenWorkBuddy 项目的 PolyForm Noncommercial 许可证。
个人非商用、学校和公益机构免费；公司及个人商用须获商业授权。
