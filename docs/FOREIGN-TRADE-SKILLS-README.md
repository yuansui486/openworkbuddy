# 外贸技能快速参考 / Foreign Trade Skills Quick Reference

5 个外贸核心技能，帮助你快速完成供应商筛选、报价、市场分析、合规检查和运费计算。

## 🚀 快速开始

### 1️⃣ 供应商筛选 (supplier-screening)

**一句话使用**：
```
请帮我筛选生产 USB 充电线的供应商，要求 MOQ ≤ 2000，必须有 ISO9001 和 CE 认证
```

**输出**：Top 5 供应商对比表 + 推荐方案 + 风险提示

---

### 2️⃣ 报价单生成 (quotation-generator)

**一句话使用**：
```
生成报价单：5000 件 USB 充电线，单位成本 $1.50，FOB 深圳到美国洛杉矶
```

**输出**：中英双语专业报价单 + 费用明细 + 价格梯度

---

### 3️⃣ 市场分析 (market-analysis)

**一句话使用**：
```
分析美国智能插座市场，包括市场规模、竞品、定价策略和进入建议
```

**输出**：完整市场分析报告 + SWOT + 进入策略 + 风险评估

---

### 4️⃣ 合规检查 (compliance-check)

**一句话使用**：
```
检查 USB 充电线出口到美国的合规要求，HS 编码 8544.42.9000
```

**输出**：合规清单 + 认证要求 + 风险分级 + 下一步行动

---

### 5️⃣ 运费计算 (freight-calculator)

**一句话使用**：
```
计算运费：1000 kg, 6 立方米，从深圳到洛杉矶，对比海运和空运
```

**输出**：三种方案对比 + 费用明细 + 时效分析 + 推荐方案

---

## 📊 技能对比

| 技能 | 耗时 | 复杂度 | 依赖插件 |
|---|---|---|---|
| supplier-screening | 2-5 分钟 | ⭐⭐ | alibaba-intl |
| quotation-generator | 1-3 分钟 | ⭐ | exchange-rate |
| market-analysis | 5-15 分钟 | ⭐⭐⭐⭐ | alibaba-intl, exchange-rate |
| compliance-check | 3-8 分钟 | ⭐⭐⭐ | 无 |
| freight-calculator | 2-5 分钟 | ⭐⭐ | 无 |

---

## 🔄 组合使用场景

### 场景 1：开拓新市场（完整流程）
```
1. market-analysis → 评估市场
2. supplier-screening → 筛选供应商
3. compliance-check → 确认合规
4. quotation-generator → 生成报价
5. freight-calculator → 计算运费
```

### 场景 2：快速响应询盘
```
1. quotation-generator → 立即报价
2. freight-calculator → 附加运费参考
3. compliance-check → 提示认证要求
```

### 场景 3：供应商审核
```
1. supplier-screening → 筛选候选
2. compliance-check → 验证认证
3. quotation-generator → 评估成本
```

---

## 📁 文件位置

```
openworkbuddy/
├── skills/
│   ├── supplier-screening/skill.md      (5.00 KB)
│   ├── quotation-generator/skill.md     (6.42 KB)
│   ├── market-analysis/skill.md         (9.60 KB)
│   ├── compliance-check/skill.md        (10.65 KB)
│   └── freight-calculator/skill.md      (12.61 KB)
├── docs/
│   └── FOREIGN-TRADE-SKILLS.md          (11.07 KB - 完整文档)
└── test/
    └── verify-foreign-trade-skills.js   (验证脚本)
```

---

## ✅ 验证安装

```bash
cd openworkbuddy
node test/verify-foreign-trade-skills.js
```

---

## 📖 完整文档

详细使用说明、参数说明、输出格式、质量标准等，请阅读：

**[docs/FOREIGN-TRADE-SKILLS.md](docs/FOREIGN-TRADE-SKILLS.md)**

---

## 🔧 插件配置

### alibaba-intl 插件
- 默认使用 mock 数据模式
- 真实 API 需配置 `apiKey` 和 `apiSecret`

### exchange-rate 插件
- 使用免费 API (exchangerate-api.com)
- 自动缓存 1 小时
- 无需配置

---

## ⚠️ 注意事项

1. **数据时效性**：汇率、运费、市场数据有时效性，建议定期更新
2. **合规免责**：合规信息仅供参考，具体请咨询专业机构
3. **价格参考**：运费价格为市场参考价，实际需向货代询价

---

## 🎯 质量标准

所有技能遵循统一标准：
- ✅ 数据准确，有来源
- ✅ 推荐可执行，有依据
- ✅ 报告完整，不依赖补充
- ✅ 格式规范，易读易用

---

## 📮 反馈与支持

- 项目仓库：https://github.com/CatCatUncle/openworkbuddy
- 问题反馈：提交 Issue
- 商业授权：contact@aijentra.com

---

**开发日期**：2026-11-23  
**版本**：v1.0.0  
**状态**：✅ 已验证通过
