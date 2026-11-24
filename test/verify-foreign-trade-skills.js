#!/usr/bin/env node

/**
 * 外贸技能验证脚本
 * Foreign Trade Skills Verification Script
 *
 * 验证 5 个外贸技能是否正确创建
 */

const fs = require('fs');
const path = require('path');

// 技能列表
const skills = [
  {
    name: 'supplier-screening',
    description: '供应商筛选',
    file: 'skills/supplier-screening/skill.md'
  },
  {
    name: 'quotation-generator',
    description: '报价单生成',
    file: 'skills/quotation-generator/skill.md'
  },
  {
    name: 'market-analysis',
    description: '市场分析',
    file: 'skills/market-analysis/skill.md'
  },
  {
    name: 'compliance-check',
    description: '合规检查',
    file: 'skills/compliance-check/skill.md'
  },
  {
    name: 'freight-calculator',
    description: '运费计算',
    file: 'skills/freight-calculator/skill.md'
  }
];

console.log('='.repeat(60));
console.log('外贸技能验证 / Foreign Trade Skills Verification');
console.log('='.repeat(60));
console.log('');

let allPassed = true;
let results = [];

// 检查每个技能
skills.forEach((skill, index) => {
  const filePath = path.join(__dirname, '..', skill.file);
  const exists = fs.existsSync(filePath);

  let status = '✅';
  let details = '';

  if (exists) {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检查基本结构
    const hasTitle = content.includes(`name: ${skill.name}`);
    const hasDescription = content.includes('description:');
    const hasContent = content.length > 500;

    if (!hasTitle || !hasDescription || !hasContent) {
      status = '⚠️';
      details = ' (结构不完整)';
      allPassed = false;
    }

    // 获取文件大小
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    results.push({
      name: skill.name,
      description: skill.description,
      status: status,
      size: sizeKB,
      details: details
    });

    console.log(`${index + 1}. ${status} ${skill.description} (${skill.name})`);
    console.log(`   文件: ${skill.file}`);
    console.log(`   大小: ${sizeKB} KB${details}`);
  } else {
    status = '❌';
    details = ' (文件不存在)';
    allPassed = false;

    results.push({
      name: skill.name,
      description: skill.description,
      status: status,
      size: 0,
      details: details
    });

    console.log(`${index + 1}. ${status} ${skill.description} (${skill.name})`);
    console.log(`   文件: ${skill.file}`);
    console.log(`   错误: 文件不存在`);
  }
  console.log('');
});

console.log('='.repeat(60));

// 检查文档
const docPath = path.join(__dirname, '..', 'docs', 'FOREIGN-TRADE-SKILLS.md');
const docExists = fs.existsSync(docPath);

console.log('📄 技能文档:');
if (docExists) {
  const stats = fs.statSync(docPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`   ✅ docs/FOREIGN-TRADE-SKILLS.md (${sizeKB} KB)`);
} else {
  console.log(`   ❌ docs/FOREIGN-TRADE-SKILLS.md (不存在)`);
  allPassed = false;
}

console.log('');
console.log('='.repeat(60));

// 总结
console.log('验证结果 / Verification Result:');
console.log('');

const passedCount = results.filter(r => r.status === '✅').length;
const totalCount = results.length;

console.log(`通过: ${passedCount}/${totalCount}`);
console.log(`文档: ${docExists ? '✅' : '❌'}`);

if (allPassed && docExists) {
  console.log('');
  console.log('🎉 所有技能验证通过！All skills verified successfully!');
  console.log('');
  console.log('下一步 / Next Steps:');
  console.log('1. 阅读文档: docs/FOREIGN-TRADE-SKILLS.md');
  console.log('2. 在 OpenWorkBuddy 中使用这些技能');
  console.log('3. 根据实际需求调整技能参数');
  process.exit(0);
} else {
  console.log('');
  console.log('⚠️ 验证未通过，请检查上述错误。');
  console.log('   Verification failed, please check errors above.');
  process.exit(1);
}
