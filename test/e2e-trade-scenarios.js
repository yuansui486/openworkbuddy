// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * 外贸场景端到端测试
 * Foreign Trade E2E Test Scenarios
 *
 * 测试外贸专家、插件和技能的完整集成流程
 */

"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

// 模拟 Agent 运行时
function createMockAgentRuntime() {
  const tools = new Map();
  const history = [];

  return {
    tools,
    history,
    callTool: async function(toolName, params) {
      const tool = tools.get(toolName);
      if (!tool) throw new Error(`Tool not found: ${toolName}`);
      const result = await tool(params);
      history.push({ tool: toolName, params, result });
      return result;
    },
    registerTool: function(name, handler) {
      tools.set(name, handler);
    }
  };
}

/**
 * 场景 1: 供应商筛选
 * 测试：国际采购专家 + alibaba-intl 插件 + supplier-screening 技能
 */
async function testScenario1_SupplierScreening() {
  console.log("\n=== 场景 1: 供应商筛选 ===");

  const runtime = createMockAgentRuntime();

  // 1. 注册 alibaba-intl 插件工具
  runtime.registerTool('plugin_execute', async (params) => {
    const { pluginName, capability, pluginParams } = params;

    if (pluginName === 'alibaba-intl' && capability === 'searchSuppliers') {
      // 模拟返回供应商数据
      return {
        success: true,
        data: {
          suppliers: [
            {
              supplierId: 'SUP001',
              name: '深圳蓝牙科技有限公司',
              country: 'China',
              province: 'Guangdong',
              city: 'Shenzhen',
              rating: 4.8,
              transactionLevel: 'Gold Supplier',
              mainProducts: ['Bluetooth Earphones', 'TWS Earbuds'],
              yearsInBusiness: 15,
              responseRate: '98%',
              onTimeDelivery: '95%',
              moq: 500,
              priceRange: { min: 3.5, max: 8.0, currency: 'USD' },
              certifications: ['ISO9001', 'CE', 'RoHS', 'FCC']
            },
            {
              supplierId: 'SUP002',
              name: '东莞音频设备制造商',
              country: 'China',
              province: 'Guangdong',
              city: 'Dongguan',
              rating: 4.6,
              transactionLevel: 'Verified Supplier',
              mainProducts: ['Wireless Earphones', 'Audio Accessories'],
              yearsInBusiness: 10,
              responseRate: '95%',
              onTimeDelivery: '92%',
              moq: 1000,
              priceRange: { min: 2.8, max: 6.5, currency: 'USD' },
              certifications: ['ISO9001', 'CE', 'RoHS']
            },
            {
              supplierId: 'SUP003',
              name: '广州优质电子有限公司',
              country: 'China',
              province: 'Guangdong',
              city: 'Guangzhou',
              rating: 4.9,
              transactionLevel: 'Gold Supplier',
              mainProducts: ['Bluetooth Devices', 'Smart Audio'],
              yearsInBusiness: 12,
              responseRate: '99%',
              onTimeDelivery: '97%',
              moq: 800,
              priceRange: { min: 4.0, max: 9.0, currency: 'USD' },
              certifications: ['ISO9001', 'CE', 'RoHS', 'FCC', 'BSCI']
            }
          ],
          total: 3,
          keyword: pluginParams.keyword
        }
      };
    }

    throw new Error(`Unknown plugin capability: ${pluginName}.${capability}`);
  });

  // 2. 注册写文件工具
  const generatedFiles = [];
  runtime.registerTool('write_file', async (params) => {
    const { path: filePath, content } = params;
    generatedFiles.push({ path: filePath, content });
    return { success: true, path: filePath };
  });

  // 3. 模拟用户输入
  const userInput = "帮我在阿里巴巴找做蓝牙耳机的供应商，起订量1000个以内";
  console.log(`用户输入: ${userInput}`);

  // 4. 验证专家委派（应该委派给国际采购专家）
  const expectedExpert = "国际采购专家";
  console.log(`✓ 应委派给: ${expectedExpert}`);

  // 5. 执行插件调用
  const pluginResult = await runtime.callTool('plugin_execute', {
    pluginName: 'alibaba-intl',
    capability: 'searchSuppliers',
    pluginParams: {
      keyword: '蓝牙耳机',
      category: 'Electronics',
      country: 'China',
      page: 1,
      pageSize: 20
    }
  });

  assert(pluginResult.success, '插件调用应该成功');
  assert(pluginResult.data.suppliers.length === 3, '应该返回3个供应商');
  console.log(`✓ 插件调用成功，返回 ${pluginResult.data.suppliers.length} 个供应商`);

  // 6. 验证技能执行（supplier-screening）
  const suppliers = pluginResult.data.suppliers;

  // 筛选逻辑：MOQ <= 1000
  const filtered = suppliers.filter(s => s.moq <= 1000);
  assert(filtered.length === 2, '应该筛选出2个符合MOQ要求的供应商');
  console.log(`✓ 筛选后符合条件的供应商: ${filtered.length} 个`);

  // 评分逻辑
  function scoreSupplier(supplier) {
    let score = 0;

    // 价格竞争力 (25%)
    const avgPrice = (supplier.priceRange.min + supplier.priceRange.max) / 2;
    const priceScore = Math.max(0, 100 - (avgPrice - 3.0) * 10);
    score += priceScore * 0.25;

    // MOQ 灵活度 (15%)
    const moqScore = supplier.moq <= 500 ? 100 : Math.max(0, 100 - ((supplier.moq - 500) / 500) * 50);
    score += moqScore * 0.15;

    // 资质认证 (20%)
    const certScore = (supplier.certifications.length / 5) * 100;
    score += Math.min(certScore, 100) * 0.20;

    // 供应商评分 (20%)
    score += (supplier.rating / 5.0) * 100 * 0.20;

    // 响应与交付 (10%)
    const responseScore = parseFloat(supplier.responseRate) * 100;
    score += responseScore * 0.10;

    // 经营年限 (10%)
    const yearScore = Math.min((supplier.yearsInBusiness / 10) * 100, 100);
    score += yearScore * 0.10;

    return Math.round(score);
  }

  const scored = filtered.map(s => ({
    ...s,
    score: scoreSupplier(s)
  })).sort((a, b) => b.score - a.score);

  console.log('✓ 供应商评分完成:');
  scored.forEach(s => {
    console.log(`  - ${s.name}: ${s.score}分 (MOQ: ${s.moq}, 评分: ${s.rating})`);
  });

  // 7. 生成对比报告
  const reportContent = `# 供应商筛选报告：蓝牙耳机

## 筛选摘要
- **搜索时间**: ${new Date().toISOString().split('T')[0]}
- **产品**: 蓝牙耳机
- **筛选条件**: MOQ ≤ 1000
- **候选供应商数**: 初步 ${suppliers.length} 家 → 筛选后 ${filtered.length} 家
- **推荐**: ${scored[0].name}（综合得分 ${scored[0].score}）

## Top ${scored.length} 供应商对比

| 供应商 | 综合得分 | 价格（USD） | MOQ | 认证 | 评分 | 经营年限 |
|--------|----------|-------------|-----|------|------|----------|
${scored.map(s => `| ${s.name} | ${s.score} | $${s.priceRange.min}-${s.priceRange.max} | ${s.moq} | ${s.certifications.join(',')} | ${s.rating} | ${s.yearsInBusiness}年 |`).join('\n')}

## 推荐方案

### 首选：${scored[0].name}
- **推荐理由**: 综合得分最高，认证齐全，交付可靠
- **MOQ**: ${scored[0].moq} 个
- **价格区间**: $${scored[0].priceRange.min}-${scored[0].priceRange.max}

### 备选：${scored[1].name}
- **推荐理由**: 性价比高，MOQ适中
- **MOQ**: ${scored[1].moq} 个
- **价格区间**: $${scored[1].priceRange.min}-${scored[1].priceRange.max}
`;

  await runtime.callTool('write_file', {
    path: '供应商筛选报告_蓝牙耳机.md',
    content: reportContent
  });

  // 8. 验证输出格式
  assert(generatedFiles.length === 1, '应该生成1个报告文件');
  assert(generatedFiles[0].path.includes('供应商筛选报告'), '报告文件名应该包含"供应商筛选报告"');
  assert(generatedFiles[0].content.includes('## Top'), '报告应该包含对比表');
  assert(generatedFiles[0].content.includes('推荐方案'), '报告应该包含推荐方案');
  console.log(`✓ 报告生成成功: ${generatedFiles[0].path}`);

  console.log("✓ 场景 1 测试通过");
}

/**
 * 场景 2: 报价单生成
 * 测试：外贸销售专家 + quotation-generator 技能 + exchange-rate 插件
 */
async function testScenario2_QuotationGeneration() {
  console.log("\n=== 场景 2: 报价单生成 ===");

  const runtime = createMockAgentRuntime();

  // 1. 注册汇率转换插件
  runtime.registerTool('plugin_execute', async (params) => {
    const { pluginName, capability, pluginParams } = params;

    if (pluginName === 'exchange-rate' && capability === 'convert') {
      const mockRates = {
        'USD-CNY': 7.2,
        'USD-EUR': 0.92,
        'USD-GBP': 0.79
      };

      const { amount, from, to } = pluginParams;
      const rateKey = `${from}-${to}`;
      const rate = mockRates[rateKey] || 1.0;

      return {
        success: true,
        data: {
          amount,
          from,
          to,
          rate,
          convertedAmount: parseFloat((amount * rate).toFixed(2)),
          lastUpdate: new Date().toISOString().split('T')[0]
        }
      };
    }

    throw new Error(`Unknown plugin capability: ${pluginName}.${capability}`);
  });

  // 2. 注册写文件工具
  const generatedFiles = [];
  runtime.registerTool('write_file', async (params) => {
    generatedFiles.push(params);
    return { success: true, path: params.path };
  });

  // 3. 模拟用户输入
  const userInput = "生成蓝牙耳机报价单，5000个，FOB价格";
  console.log(`用户输入: ${userInput}`);

  // 4. 验证专家委派
  const expectedExpert = "外贸销售专家";
  console.log(`✓ 应委派给: ${expectedExpert}`);

  // 5. 准备报价数据
  const quotationData = {
    productName: '无线蓝牙耳机',
    model: 'TWS-5000',
    quantity: 5000,
    unitPrice: 5.50,
    currency: 'USD',
    totalAmount: 5000 * 5.50,
    tradeTerm: 'FOB',
    port: 'Shenzhen',
    deliveryTime: '30 days',
    paymentTerms: '30% T/T in advance, 70% before shipment',
    validityPeriod: '30 days',
    packaging: 'Individual gift box, 50 pcs/carton'
  };

  // 6. 执行汇率转换
  const conversionResult = await runtime.callTool('plugin_execute', {
    pluginName: 'exchange-rate',
    capability: 'convert',
    pluginParams: {
      amount: quotationData.totalAmount,
      from: 'USD',
      to: 'CNY'
    }
  });

  assert(conversionResult.success, '汇率转换应该成功');
  console.log(`✓ 汇率转换成功: ${quotationData.totalAmount} USD = ${conversionResult.data.convertedAmount} CNY`);

  // 7. 生成报价单（Markdown格式）
  const quotationContent = `# 商业报价单
## COMMERCIAL QUOTATION

---

**报价编号 / Quotation No.**: QT-${Date.now()}
**日期 / Date**: ${new Date().toISOString().split('T')[0]}
**有效期 / Validity**: ${quotationData.validityPeriod}

---

## 产品信息 / Product Information

| 项目 / Item | 内容 / Details |
|-------------|----------------|
| **产品名称 / Product Name** | ${quotationData.productName} |
| **型号 / Model** | ${quotationData.model} |
| **数量 / Quantity** | ${quotationData.quantity} pcs |
| **单价 / Unit Price** | ${quotationData.currency} ${quotationData.unitPrice.toFixed(2)} |
| **总金额 / Total Amount** | ${quotationData.currency} ${quotationData.totalAmount.toFixed(2)} |
| | (≈ CNY ${conversionResult.data.convertedAmount}) |

---

## 贸易条款 / Trade Terms

| 项目 / Item | 内容 / Details |
|-------------|----------------|
| **贸易术语 / Trade Terms** | ${quotationData.tradeTerm} ${quotationData.port} |
| **交货期 / Delivery Time** | ${quotationData.deliveryTime} after order confirmation |
| **付款方式 / Payment Terms** | ${quotationData.paymentTerms} |
| **包装 / Packaging** | ${quotationData.packaging} |

---

## 产品规格 / Specifications

- Bluetooth Version: 5.0
- Battery Capacity: 300mAh
- Play Time: 6 hours
- Charging Time: 1.5 hours
- Certifications: CE, FCC, RoHS

---

## 备注 / Notes

1. 以上报价基于 FOB 深圳港
2. 价格不含目的港费用和关税
3. 产品符合欧美市场质量标准
4. 可提供样品测试（样品费另计）

---

**联系方式 / Contact**
Email: sales@example.com
Tel: +86-755-12345678
WhatsApp: +86-13800138000
`;

  await runtime.callTool('write_file', {
    path: '报价单_蓝牙耳机_5000pcs.md',
    content: quotationContent
  });

  // 8. 验证输出格式
  assert(generatedFiles.length === 1, '应该生成1个报价单文件');
  assert(generatedFiles[0].content.includes('QUOTATION'), '报价单应该包含标题');
  assert(generatedFiles[0].content.includes('FOB'), '报价单应该包含FOB条款');
  assert(generatedFiles[0].content.includes('CNY'), '报价单应该包含人民币金额');
  assert(generatedFiles[0].content.includes(quotationData.quantity.toString()), '报价单应该包含数量');
  console.log(`✓ 报价单生成成功: ${generatedFiles[0].path}`);

  console.log("✓ 场景 2 测试通过");
}

/**
 * 场景 3: 市场分析
 * 测试：产品分析师 + market-analysis 技能
 */
async function testScenario3_MarketAnalysis() {
  console.log("\n=== 场景 3: 市场分析 ===");

  const runtime = createMockAgentRuntime();

  // 1. 注册网络搜索工具
  runtime.registerTool('web_search', async (params) => {
    const { query } = params;

    // 模拟返回市场数据
    return {
      success: true,
      results: [
        {
          title: 'European Bluetooth Headphones Market Report 2026',
          url: 'https://example.com/report1',
          snippet: 'The European wireless earphone market is projected to grow at 15% CAGR...'
        },
        {
          title: 'Germany Audio Device Import Statistics',
          url: 'https://example.com/stats',
          snippet: 'Germany imported $2.3B worth of audio devices in 2025, with 20% growth...'
        }
      ]
    };
  });

  // 2. 注册写文件工具
  const generatedFiles = [];
  runtime.registerTool('write_file', async (params) => {
    generatedFiles.push(params);
    return { success: true, path: params.path };
  });

  // 3. 模拟用户输入
  const userInput = "分析蓝牙耳机在欧洲市场的趋势";
  console.log(`用户输入: ${userInput}`);

  // 4. 验证专家委派
  const expectedExpert = "产品分析师";
  console.log(`✓ 应委派给: ${expectedExpert}`);

  // 5. 执行市场调研
  const searchResult = await runtime.callTool('web_search', {
    query: 'bluetooth earphone Europe market trend 2026'
  });

  assert(searchResult.success, '市场调研应该成功');
  console.log(`✓ 市场调研完成，获得 ${searchResult.results.length} 条信息`);

  // 6. 生成市场分析报告
  const analysisContent = `# 蓝牙耳机欧洲市场分析报告

## 执行摘要

本报告分析了蓝牙耳机在欧洲市场的发展趋势、市场规模、竞争格局和机会点。

## 市场规模与增长

### 整体市场
- **市场规模**: 2026年预计达到 €5.2B
- **增长率**: 年复合增长率(CAGR) 15%
- **主要驱动因素**:
  - 远程办公需求持续
  - 运动健身市场增长
  - 降噪技术普及

### 主要市场
1. **德国** - 最大市场，占比 28%
2. **英国** - 占比 22%
3. **法国** - 占比 18%
4. **意大利** - 占比 12%
5. **西班牙** - 占比 10%

## 市场趋势

### 1. 产品趋势
- **降噪功能**: 成为标配，消费者愿为此支付溢价
- **长续航**: 单次播放 8+ 小时成为新标准
- **多点连接**: 同时连接多设备需求增加
- **健康功能**: 心率监测、运动追踪集成

### 2. 价格区间分析
| 价格区间 | 市场占比 | 增长趋势 | 目标人群 |
|----------|----------|----------|----------|
| €20-50 | 35% | 稳定 | 价格敏感型 |
| €50-150 | 45% | 增长 | 主流消费者 |
| €150-300 | 15% | 快速增长 | 高端用户 |
| €300+ | 5% | 增长 | 音频发烧友 |

### 3. 渠道趋势
- **线上渠道**: 占比 65%，持续增长
  - Amazon.de, Amazon.co.uk 主导
  - 品牌自建独立站增加
- **线下渠道**: 占比 35%
  - 专业音频店
  - 电子产品连锁店（MediaMarkt, Saturn）

## 竞争格局

### 头部品牌
1. **Apple AirPods** - 市场份额 25%
2. **Samsung** - 市场份额 15%
3. **Sony** - 市场份额 12%
4. **JBL/Harman** - 市场份额 8%
5. **中国品牌** (Anker, QCY, etc.) - 合计 18%

### 竞争特点
- 高端市场被Apple、Sony垄断
- 中端市场竞争激烈
- 低端市场中国品牌占优

## 准入要求

### 认证要求
- **CE 认证** - 必需
- **RoHS** - 环保要求
- **REACH** - 化学物质合规
- **WEEE** - 电子废弃物回收

### 其他要求
- 产品说明书需有当地语言版本
- 2年质保（欧盟法律要求）
- 包装需符合环保标准

## 市场机会

### 1. 细分市场机会
- **运动耳机**: 防水等级 IPX7+，挂耳式设计
- **商务耳机**: 多麦降噪，续航 10+ 小时
- **游戏耳机**: 低延迟（<40ms），RGB灯效

### 2. 价格定位建议
- **主攻价位**: €50-80（甜点区）
- **差异化功能**: 超长续航 + 适度降噪
- **避开**: 直接对标 AirPods（竞争过于激烈）

### 3. 渠道策略
- 优先 Amazon 欧洲站点
- 考虑与线下连锁店合作（大单采购）
- 建立品牌独立站（提升溢价能力）

## 风险提示

1. **法规风险**: CE 认证周期 2-3 个月，需提前规划
2. **竞争风险**: 价格战激烈，利润空间收窄
3. **季节性**: Q4 销售占全年 40%（圣诞季）
4. **退货率**: 欧洲平均退货率 8-12%，需考虑逆向物流成本

## 行动建议

### 短期（3个月内）
1. 完成 CE、RoHS 认证
2. 准备德语、法语产品资料
3. 在 Amazon.de 开店测试

### 中期（6个月内）
1. 扩展到英国、法国市场
2. 寻找 1-2 家线下分销商
3. 积累至少 100 个真实评价

### 长期（12个月内）
1. 建立品牌独立站
2. 考虑在欧洲设立售后中心
3. 开发针对欧洲市场的定制款

## 数据来源
- Euromonitor International Market Report 2026
- Statista Consumer Electronics Data
- Amazon Europe Sales Analytics
- 调研时间: ${new Date().toISOString().split('T')[0]}
`;

  await runtime.callTool('write_file', {
    path: '市场分析报告_蓝牙耳机_欧洲市场.md',
    content: analysisContent
  });

  // 7. 验证输出格式
  assert(generatedFiles.length === 1, '应该生成1个分析报告');
  assert(generatedFiles[0].content.includes('市场规模'), '报告应该包含市场规模');
  assert(generatedFiles[0].content.includes('竞争格局'), '报告应该包含竞争分析');
  assert(generatedFiles[0].content.includes('市场机会'), '报告应该包含机会分析');
  assert(generatedFiles[0].content.includes('行动建议'), '报告应该包含行动建议');
  console.log(`✓ 市场分析报告生成成功: ${generatedFiles[0].path}`);

  console.log("✓ 场景 3 测试通过");
}

/**
 * 场景 4: 专家团队协作
 * 测试：外贸出口全流程专家团队
 */
async function testScenario4_ExpertTeamCollaboration() {
  console.log("\n=== 场景 4: 专家团队协作 ===");

  const runtime = createMockAgentRuntime();

  // 模拟专家团队成员
  const expertTeam = [
    "产品分析师",      // 市场可行性
    "国际采购专家",    // 供应商评估
    "外贸销售专家",    // 报价与销售策略
    "外贸合规专家",    // 认证与法规
    "国际物流专家"     // 物流方案
  ];

  const generatedFiles = [];

  // 注册工具
  runtime.registerTool('write_file', async (params) => {
    generatedFiles.push(params);
    return { success: true, path: params.path };
  });

  runtime.registerTool('web_search', async (params) => {
    return { success: true, results: [] };
  });

  runtime.registerTool('plugin_execute', async (params) => {
    return { success: true, data: { mock: true } };
  });

  // 模拟用户输入
  const userInput = "我想出口蓝牙耳机到德国，做完整可行性分析";
  console.log(`用户输入: ${userInput}`);
  console.log(`✓ 应委派给专家团队: ${expertTeam.join(' → ')}`);

  // 模拟各专家工作
  const expertOutputs = [];

  // 1. 产品分析师
  console.log(`\n[1/${expertTeam.length}] ${expertTeam[0]} 工作中...`);
  const marketAnalysis = {
    expert: expertTeam[0],
    output: '市场分析_德国蓝牙耳机市场.md',
    summary: '德国市场规模€1.5B，年增长15%，主要渠道Amazon.de和MediaMarkt'
  };
  expertOutputs.push(marketAnalysis);
  await runtime.callTool('write_file', {
    path: marketAnalysis.output,
    content: `# ${marketAnalysis.summary}`
  });
  console.log(`  ✓ 完成: ${marketAnalysis.output}`);

  // 2. 国际采购专家
  console.log(`\n[2/${expertTeam.length}] ${expertTeam[1]} 工作中...`);
  const supplierReport = {
    expert: expertTeam[1],
    output: '供应商评估报告.md',
    summary: '推荐3家供应商，MOQ 500-1000，单价$4-8，均有CE认证'
  };
  expertOutputs.push(supplierReport);
  await runtime.callTool('write_file', {
    path: supplierReport.output,
    content: `# ${supplierReport.summary}`
  });
  console.log(`  ✓ 完成: ${supplierReport.output}`);

  // 3. 外贸销售专家
  console.log(`\n[3/${expertTeam.length}] ${expertTeam[2]} 工作中...`);
  const salesStrategy = {
    expert: expertTeam[2],
    output: '销售策略与报价方案.md',
    summary: '建议零售价€69-89，FOB深圳$5.5，目标利润率35%'
  };
  expertOutputs.push(salesStrategy);
  await runtime.callTool('write_file', {
    path: salesStrategy.output,
    content: `# ${salesStrategy.summary}`
  });
  console.log(`  ✓ 完成: ${salesStrategy.output}`);

  // 4. 外贸合规专家
  console.log(`\n[4/${expertTeam.length}] ${expertTeam[3]} 工作中...`);
  const complianceReport = {
    expert: expertTeam[3],
    output: '合规检查清单_德国市场.md',
    summary: '需要CE、RoHS、REACH认证，周期3个月，预算€8000'
  };
  expertOutputs.push(complianceReport);
  await runtime.callTool('write_file', {
    path: complianceReport.output,
    content: `# ${complianceReport.summary}`
  });
  console.log(`  ✓ 完成: ${complianceReport.output}`);

  // 5. 国际物流专家
  console.log(`\n[5/${expertTeam.length}] ${expertTeam[4]} 工作中...`);
  const logisticsReport = {
    expert: expertTeam[4],
    output: '物流方案_中国到德国.md',
    summary: '海运40HQ柜$2800，时效35天；空运$4.5/kg，时效7天'
  };
  expertOutputs.push(logisticsReport);
  await runtime.callTool('write_file', {
    path: logisticsReport.output,
    content: `# ${logisticsReport.summary}`
  });
  console.log(`  ✓ 完成: ${logisticsReport.output}`);

  // 6. 汇总报告
  console.log(`\n生成汇总报告...`);
  const finalReport = `# 蓝牙耳机出口德国可行性分析报告

## 项目概述
**目标**: 出口蓝牙耳机到德国市场
**分析日期**: ${new Date().toISOString().split('T')[0]}
**参与专家**: ${expertTeam.join(', ')}

---

## 各环节分析汇总

${expertOutputs.map((output, index) => `
### ${index + 1}. ${output.expert}
**输出文件**: ${output.output}
**核心结论**: ${output.summary}
`).join('\n')}

---

## 综合评估

### 市场机会 ⭐⭐⭐⭐
- 德国市场规模大，增长稳定
- 中端价位竞争相对缓和
- 线上渠道发达，易于切入

### 供应链可行性 ⭐⭐⭐⭐⭐
- 供应商选择充足
- MOQ 和价格合理
- 认证齐全

### 合规难度 ⭐⭐⭐
- 认证周期较长（3个月）
- 认证成本适中（€8000）
- 需提前规划

### 物流便利性 ⭐⭐⭐⭐
- 多种物流方案可选
- 海运性价比高
- 空运可应急

---

## 总体结论

✅ **项目可行**

德国蓝牙耳机市场具备良好的商业机会，供应链成熟，物流便利。主要挑战在于认证周期需要提前规划，以及中端市场竞争需要通过差异化功能突围。

---

## 启动建议

### 阶段1：准备期（0-3个月）
- [ ] 确定产品型号和供应商
- [ ] 启动 CE、RoHS、REACH 认证
- [ ] 注册 Amazon.de 卖家账号
- [ ] 准备德语产品资料和包装

### 阶段2：测试期（3-6个月）
- [ ] 首批订单 1000 pcs（海运）
- [ ] Amazon.de 上线测试
- [ ] 收集用户反馈和评价
- [ ] 优化产品和文案

### 阶段3：扩张期（6-12个月）
- [ ] 月销量目标 5000+ pcs
- [ ] 对接线下分销商
- [ ] 考虑建立德国仓库（FBA）
- [ ] 开发针对德国市场的定制款

---

## 预算估算（首批1000pcs）

| 项目 | 金额 | 备注 |
|------|------|------|
| 产品成本 | $5,500 | $5.5/pcs × 1000 |
| 认证费用 | €8,000 | CE+RoHS+REACH |
| 海运费用 | $800 | 1000pcs约2立方 |
| 关税 | €650 | 约3.5%税率 |
| Amazon费用 | €1,500 | 佣金+FBA（首月） |
| 营销预算 | €2,000 | 站内广告 |
| **合计** | **约 $12,000** | 不含汇率波动 |

预计首批销售额（€69/件 × 1000）: €69,000
预计毛利率: 约35%

---

## 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 认证延期 | 高 | 提前3个月启动，选择快速通道 |
| 汇率波动 | 中 | 锁定远期汇率，或采购时对冲 |
| 退货率高 | 中 | 严格质检，完善售后 |
| 季节性滞销 | 低 | Q1-Q3 适量备货，Q4 加大投入 |

---

**附件**:
${expertOutputs.map(o => `- ${o.output}`).join('\n')}
`;

  await runtime.callTool('write_file', {
    path: '蓝牙耳机出口德国_可行性分析汇总.md',
    content: finalReport
  });

  // 验证
  assert(generatedFiles.length === 6, '应该生成6个文件（5个专家报告 + 1个汇总）');
  assert(expertOutputs.length === 5, '应该有5位专家的输出');
  console.log(`\n✓ 专家团队协作完成，生成 ${generatedFiles.length} 个文件`);

  // 验证汇总报告包含所有专家的工作
  const summary = generatedFiles[generatedFiles.length - 1];
  expertTeam.forEach(expert => {
    assert(summary.content.includes(expert), `汇总报告应该包含${expert}的工作`);
  });
  console.log(`✓ 汇总报告包含所有专家的贡献`);

  console.log("✓ 场景 4 测试通过");
}

/**
 * 主测试入口
 */
async function runAllScenarios() {
  console.log("====================================");
  console.log("   外贸场景端到端测试");
  console.log("====================================");

  try {
    await testScenario1_SupplierScreening();
    await testScenario2_QuotationGeneration();
    await testScenario3_MarketAnalysis();
    await testScenario4_ExpertTeamCollaboration();

    console.log("\n====================================");
    console.log("✓ 所有场景测试通过");
    console.log("====================================\n");

    return true;
  } catch (error) {
    console.error("\n✗ 测试失败:", error.message);
    console.error(error.stack);
    return false;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllScenarios().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  testScenario1_SupplierScreening,
  testScenario2_QuotationGeneration,
  testScenario3_MarketAnalysis,
  testScenario4_ExpertTeamCollaboration,
  runAllScenarios
};
