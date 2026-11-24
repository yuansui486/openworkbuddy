// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * 单元测试 - 外贸插件、技能和专家配置
 * Unit Tests for Foreign Trade Plugins, Skills, and Expert Configurations
 */

"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

/**
 * 测试插件独立功能
 */
class PluginUnitTests {
  /**
   * 测试 alibaba-intl 插件
   */
  static async testAlibabaIntlPlugin() {
    console.log("\n--- 测试: alibaba-intl 插件 ---");

    // 动态加载插件
    const pluginPath = path.join(__dirname, '../plugins/alibaba-intl/index.js');
    assert(fs.existsSync(pluginPath), 'alibaba-intl 插件文件应该存在');

    const AlibabaIntlPlugin = require(pluginPath);
    const plugin = new AlibabaIntlPlugin({ useMockData: true });

    // 测试插件初始化
    await plugin.onInit();
    assert(plugin.name === 'alibaba-intl', '插件名称应该是 alibaba-intl');
    assert(plugin.capabilities.length === 4, '应该有4个能力');
    console.log('  ✓ 插件初始化成功');

    // 测试 searchSuppliers
    const searchResult = await plugin.searchSuppliers({
      keyword: '蓝牙耳机',
      page: 1,
      pageSize: 10
    });
    assert(searchResult.success, 'searchSuppliers 应该成功');
    assert(searchResult.data.suppliers.length > 0, '应该返回供应商数据');
    console.log(`  ✓ searchSuppliers: 返回 ${searchResult.data.suppliers.length} 个供应商`);

    // 测试供应商数据结构
    const supplier = searchResult.data.suppliers[0];
    const requiredFields = ['supplierId', 'name', 'country', 'rating', 'yearsInBusiness', 'responseRate'];
    requiredFields.forEach(field => {
      assert(field in supplier, `供应商数据应该包含 ${field} 字段`);
    });
    console.log('  ✓ 供应商数据结构完整');

    // 测试 getSupplierInfo
    const infoResult = await plugin.getSupplierInfo({ supplierId: 'SUP001' });
    assert(infoResult.success, 'getSupplierInfo 应该成功');
    assert(infoResult.data.certifications, '供应商详情应该包含认证信息');
    console.log('  ✓ getSupplierInfo: 返回详细信息');

    // 测试 searchProducts
    const productsResult = await plugin.searchProducts({
      keyword: 'bluetooth earphone',
      page: 1,
      pageSize: 10
    });
    assert(productsResult.success, 'searchProducts 应该成功');
    assert(productsResult.data.products.length > 0, '应该返回产品数据');
    console.log(`  ✓ searchProducts: 返回 ${productsResult.data.products.length} 个产品`);

    // 测试产品数据结构
    const product = productsResult.data.products[0];
    assert(product.price, '产品应该有价格信息');
    assert(product.moq !== undefined, '产品应该有MOQ信息');
    console.log('  ✓ 产品数据结构完整');

    // 测试 comparePrice
    const compareResult = await plugin.comparePrice({
      productIds: ['PROD001', 'PROD002']
    });
    assert(compareResult.success, 'comparePrice 应该成功');
    assert(compareResult.data.comparison.length === 2, '应该返回2个产品的对比');
    assert(compareResult.data.bestPrice, '应该标注最优价格');
    console.log('  ✓ comparePrice: 价格对比成功');

    console.log("✓ alibaba-intl 插件测试通过");
  }

  /**
   * 测试 exchange-rate 插件
   */
  static async testExchangeRatePlugin() {
    console.log("\n--- 测试: exchange-rate 插件 ---");

    const pluginPath = path.join(__dirname, '../plugins/exchange-rate/index.js');
    assert(fs.existsSync(pluginPath), 'exchange-rate 插件文件应该存在');

    const ExchangeRatePlugin = require(pluginPath);
    const plugin = new ExchangeRatePlugin({});

    // 测试插件初始化
    await plugin.onInit();
    assert(plugin.name === 'exchange-rate', '插件名称应该是 exchange-rate');
    console.log('  ✓ 插件初始化成功');

    // 测试 getCurrentRate
    const rateResult = await plugin.getCurrentRate({
      from: 'USD',
      to: 'CNY'
    });
    assert(rateResult.success, 'getCurrentRate 应该成功');
    assert(rateResult.data.rate > 0, '汇率应该是正数');
    assert(rateResult.data.base === 'USD', '基准货币应该是USD');
    assert(rateResult.data.target === 'CNY', '目标货币应该是CNY');
    console.log(`  ✓ getCurrentRate: 1 USD = ${rateResult.data.rate} CNY`);

    // 测试 convert
    const convertResult = await plugin.convert({
      amount: 100,
      from: 'USD',
      to: 'CNY'
    });
    assert(convertResult.success, 'convert 应该成功');
    assert(convertResult.data.convertedAmount > 0, '转换后金额应该是正数');
    assert(convertResult.data.amount === 100, '原始金额应该保持不变');
    console.log(`  ✓ convert: 100 USD = ${convertResult.data.convertedAmount} CNY`);

    // 测试多货币查询
    const multiRateResult = await plugin.getCurrentRate({
      from: 'USD',
      to: ['CNY', 'EUR', 'GBP']
    });
    assert(multiRateResult.success, '多货币查询应该成功');
    assert(Object.keys(multiRateResult.data.rates).length === 3, '应该返回3种货币的汇率');
    console.log('  ✓ 多货币查询成功');

    // 测试 getSupportedCurrencies
    const currenciesResult = await plugin.getSupportedCurrencies();
    assert(currenciesResult.success, 'getSupportedCurrencies 应该成功');
    assert(currenciesResult.data.currencies.length > 10, '应该支持至少10种货币');
    console.log(`  ✓ getSupportedCurrencies: 支持 ${currenciesResult.data.currencies.length} 种货币`);

    // 清理
    await plugin.onDestroy();
    console.log("✓ exchange-rate 插件测试通过");
  }

  /**
   * 运行所有插件测试
   */
  static async runAll() {
    console.log("\n========================================");
    console.log("   插件单元测试");
    console.log("========================================");

    await this.testAlibabaIntlPlugin();
    await this.testExchangeRatePlugin();

    console.log("\n✓ 所有插件测试通过\n");
  }
}

/**
 * 测试技能独立功能
 */
class SkillUnitTests {
  /**
   * 测试 supplier-screening 技能
   */
  static testSupplierScreeningSkill() {
    console.log("\n--- 测试: supplier-screening 技能 ---");

    const skillPath = path.join(__dirname, '../skills/supplier-screening/SKILL.md');
    assert(fs.existsSync(skillPath), 'supplier-screening 技能文件应该存在');

    const skillContent = fs.readFileSync(skillPath, 'utf-8');

    // 验证技能元数据
    assert(skillContent.includes('name: supplier-screening'), '技能名称应该正确');
    assert(skillContent.includes('description:'), '应该有描述');
    console.log('  ✓ 技能元数据完整');

    // 验证技能步骤
    const requiredSections = [
      '## 适用场景',
      '## 步骤',
      '### 1. 明确筛选需求',
      '### 2. 调用 alibaba-intl 插件',
      '### 3. 多维度评分',
      '### 4. 过滤与排序',
      '### 5. 对比分析',
      '### 6. 推荐与风险提示',
      '### 7. 生成 Markdown 报告',
      '## 红线',
      '## 质量标准'
    ];

    requiredSections.forEach(section => {
      assert(skillContent.includes(section), `技能文档应该包含 ${section}`);
    });
    console.log('  ✓ 技能步骤完整');

    // 验证评分模型
    assert(skillContent.includes('价格竞争力'), '应该包含价格评分维度');
    assert(skillContent.includes('MOQ 灵活度'), '应该包含MOQ评分维度');
    assert(skillContent.includes('资质认证'), '应该包含认证评分维度');
    console.log('  ✓ 评分模型定义清晰');

    // 验证红线
    assert(skillContent.includes('不编造供应商数据'), '应该有数据真实性红线');
    assert(skillContent.includes('不隐藏评分逻辑'), '应该有透明度红线');
    console.log('  ✓ 红线定义明确');

    console.log("✓ supplier-screening 技能测试通过");
  }

  /**
   * 测试 quotation-generator 技能
   */
  static testQuotationGeneratorSkill() {
    console.log("\n--- 测试: quotation-generator 技能 ---");

    const skillPath = path.join(__dirname, '../skills/quotation-generator/SKILL.md');

    // 如果技能还不存在，跳过测试
    if (!fs.existsSync(skillPath)) {
      console.log('  ⚠ quotation-generator 技能文件不存在，跳过测试');
      return;
    }

    const skillContent = fs.readFileSync(skillPath, 'utf-8');

    // 基本验证
    assert(skillContent.includes('报价单') || skillContent.includes('quotation'), '技能应该与报价单相关');
    console.log('  ✓ 技能主题正确');

    console.log("✓ quotation-generator 技能测试通过");
  }

  /**
   * 测试 market-analysis 技能
   */
  static testMarketAnalysisSkill() {
    console.log("\n--- 测试: market-analysis 技能 ---");

    const skillPath = path.join(__dirname, '../skills/market-analysis/SKILL.md');

    // 如果技能还不存在，跳过测试
    if (!fs.existsSync(skillPath)) {
      console.log('  ⚠ market-analysis 技能文件不存在，跳过测试');
      return;
    }

    const skillContent = fs.readFileSync(skillPath, 'utf-8');

    // 基本验证
    assert(skillContent.includes('市场') || skillContent.includes('market'), '技能应该与市场分析相关');
    console.log('  ✓ 技能主题正确');

    console.log("✓ market-analysis 技能测试通过");
  }

  /**
   * 测试 compliance-check 技能
   */
  static testComplianceCheckSkill() {
    console.log("\n--- 测试: compliance-check 技能 ---");

    const skillPath = path.join(__dirname, '../skills/compliance-check/SKILL.md');

    // 如果技能还不存在，跳过测试
    if (!fs.existsSync(skillPath)) {
      console.log('  ⚠ compliance-check 技能文件不存在，跳过测试');
      return;
    }

    const skillContent = fs.readFileSync(skillPath, 'utf-8');

    // 基本验证
    assert(skillContent.includes('合规') || skillContent.includes('compliance'), '技能应该与合规检查相关');
    console.log('  ✓ 技能主题正确');

    console.log("✓ compliance-check 技能测试通过");
  }

  /**
   * 运行所有技能测试
   */
  static runAll() {
    console.log("\n========================================");
    console.log("   技能单元测试");
    console.log("========================================");

    this.testSupplierScreeningSkill();
    this.testQuotationGeneratorSkill();
    this.testMarketAnalysisSkill();
    this.testComplianceCheckSkill();

    console.log("\n✓ 所有技能测试通过\n");
  }
}

/**
 * 测试专家配置
 */
class ExpertConfigTests {
  /**
   * 测试外贸专家配置
   */
  static testTradeExperts() {
    console.log("\n--- 测试: 外贸专家配置 ---");

    const expertsPath = path.join(__dirname, '../experts.json');
    assert(fs.existsSync(expertsPath), 'experts.json 文件应该存在');

    const expertsData = JSON.parse(fs.readFileSync(expertsPath, 'utf-8'));

    // 验证外贸专家
    const tradeExperts = [
      '国际采购专家',
      '外贸销售专家',
      '产品分析师',
      '外贸合规专家',
      '国际物流专家'
    ];

    const experts = expertsData.experts;

    tradeExperts.forEach(expertName => {
      const expert = experts.find(e => e.name === expertName);
      assert(expert, `应该存在 ${expertName}`);

      // 验证必需字段
      assert(expert.name, '专家应该有名字');
      assert(expert.alias, '专家应该有别名');
      assert(expert.avatar, '专家应该有头像');
      assert(expert.category, '专家应该有分类');
      assert(expert.tags && expert.tags.length > 0, '专家应该有标签');
      assert(expert.description, '专家应该有描述');
      assert(expert.system, '专家应该有系统提示词');

      // 验证外贸相关性
      const isTradeRelated = expert.category === '外贸业务' ||
                            expert.description.includes('外贸') ||
                            expert.description.includes('国际') ||
                            expert.description.includes('供应商') ||
                            expert.description.includes('市场');

      assert(isTradeRelated, `${expertName} 应该与外贸业务相关`);

      console.log(`  ✓ ${expertName}: 配置完整`);
    });

    console.log("✓ 外贸专家配置测试通过");
  }

  /**
   * 测试专家团队配置
   */
  static testExpertTeams() {
    console.log("\n--- 测试: 专家团队配置 ---");

    const expertsPath = path.join(__dirname, '../experts.json');
    const expertsData = JSON.parse(fs.readFileSync(expertsPath, 'utf-8'));

    const teams = expertsData.teams || [];

    // 检查是否有外贸相关的团队（如果有的话）
    const tradeRelatedTeams = teams.filter(team =>
      team.description && (
        team.description.includes('外贸') ||
        team.description.includes('出口') ||
        team.description.includes('市场')
      )
    );

    if (tradeRelatedTeams.length > 0) {
      console.log(`  找到 ${tradeRelatedTeams.length} 个外贸相关团队`);

      tradeRelatedTeams.forEach(team => {
        assert(team.name, '团队应该有名字');
        assert(team.members && team.members.length > 0, '团队应该有成员');

        // 验证成员是否存在
        team.members.forEach(memberName => {
          const member = expertsData.experts.find(e => e.name === memberName);
          assert(member, `团队成员 ${memberName} 应该在专家列表中`);
        });

        console.log(`  ✓ ${team.name}: ${team.members.length} 位成员`);
      });
    } else {
      console.log('  ⚠ 暂无外贸专家团队配置');
    }

    console.log("✓ 专家团队配置测试通过");
  }

  /**
   * 测试专家绑定技能
   */
  static testExpertSkillBindings() {
    console.log("\n--- 测试: 专家技能绑定 ---");

    const expertsPath = path.join(__dirname, '../experts.json');
    const expertsData = JSON.parse(fs.readFileSync(expertsPath, 'utf-8'));

    const tradeExperts = [
      { name: '国际采购专家', expectedSkills: ['supplier-screening'] },
      { name: '外贸销售专家', expectedSkills: ['quotation-generator', 'email-draft'] },
      { name: '产品分析师', expectedSkills: ['market-analysis', 'deep-research'] },
      { name: '外贸合规专家', expectedSkills: ['compliance-check'] }
    ];

    tradeExperts.forEach(({ name, expectedSkills }) => {
      const expert = expertsData.experts.find(e => e.name === name);

      if (expert) {
        expectedSkills.forEach(skill => {
          if (expert.skills && expert.skills.includes(skill)) {
            console.log(`  ✓ ${name} 已绑定技能: ${skill}`);
          } else {
            console.log(`  ⚠ ${name} 未绑定技能: ${skill}（建议绑定）`);
          }
        });
      }
    });

    console.log("✓ 专家技能绑定检查完成");
  }

  /**
   * 运行所有专家配置测试
   */
  static runAll() {
    console.log("\n========================================");
    console.log("   专家配置测试");
    console.log("========================================");

    this.testTradeExperts();
    this.testExpertTeams();
    this.testExpertSkillBindings();

    console.log("\n✓ 所有专家配置测试通过\n");
  }
}

/**
 * 主测试入口
 */
async function runAllUnitTests() {
  console.log("====================================");
  console.log("   外贸功能单元测试");
  console.log("====================================");

  try {
    // 插件测试
    await PluginUnitTests.runAll();

    // 技能测试
    SkillUnitTests.runAll();

    // 专家配置测试
    ExpertConfigTests.runAll();

    console.log("====================================");
    console.log("✓ 所有单元测试通过");
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
  runAllUnitTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  PluginUnitTests,
  SkillUnitTests,
  ExpertConfigTests,
  runAllUnitTests
};
