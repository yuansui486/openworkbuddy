# 🚀 OpenWorkBuddy 本地启动指南

**版本**: v1.1.0  
**更新时间**: 2026-11-24

---

## ⚡ 快速启动（3 步）

### 步骤 1: 安装依赖

```bash
cd E:\MyProject\openworkbuddy
npm install
```

### 步骤 2: 启动应用

```bash
npm start
```

或启动桌面应用：
```bash
npm run app
```

### 步骤 3: 开始使用

应用启动后，在聊天界面输入：

```
帮我在阿里巴巴筛选做蓝牙耳机的供应商，起订量 1000 个以内
```

---

## 📋 详细启动步骤

### 1. 环境检查

**检查 Node.js 版本**（需要 >= 22）：
```bash
node --version
```

如果版本不对，请安装 Node.js 22+：
https://nodejs.org/

### 2. 安装项目依赖

```bash
# 进入项目目录
cd E:\MyProject\openworkbuddy

# 安装依赖（首次运行需要）
npm install

# 如果遇到错误，尝试：
npm install --legacy-peer-deps
```

**预计时间**: 2-5 分钟

### 3. 启动应用

#### 方式 A: 命令行模式（推荐测试）

```bash
npm start
```

启动后会看到：
```
OpenWorkBuddy v1.1.0
服务器运行在 http://localhost:3000
```

#### 方式 B: 桌面应用模式

```bash
npm run app
```

会启动 Electron 桌面应用。

---

## 🧪 测试外贸功能

### 测试插件系统

**1. 测试所有插件**
```bash
cd E:\MyProject\openworkbuddy\plugins
node test-foreign-trade.js
```

**预期输出**：
```
✅ 所有测试通过！/ All Tests Passed!

插件测试结果:
  ✓ googleTrends - 市场趋势分析
  ✓ hsCode - 海关编码查询
  ✓ shippingCalculator - 物流计算
```

**2. 测试单个插件**

测试阿里巴巴插件：
```bash
cd E:\MyProject\openworkbuddy\plugins\alibaba-intl
node test.js
```

测试汇率插件：
```bash
cd E:\MyProject\openworkbuddy\plugins\exchange-rate
node test.js
```

### 测试外贸技能

```bash
cd E:\MyProject\openworkbuddy
node test/verify-foreign-trade-skills.js
```

**预期输出**：
```
✅ 通过: 5/5
1. ✅ 供应商筛选 (supplier-screening)
2. ✅ 报价单生成 (quotation-generator)
3. ✅ 市场分析 (market-analysis)
4. ✅ 合规检查 (compliance-check)
5. ✅ 运费计算 (freight-calculator)
```

---

## 🔐 配置阿里巴巴 OAuth 授权（可选）

### 为什么需要授权？

- **不授权**: 使用 Mock 模拟数据（适合测试）
- **授权后**: 获取真实的阿里巴巴国际站数据

### 授权步骤

**1. 进入插件目录**
```bash
cd E:\MyProject\openworkbuddy\plugins\alibaba-intl
```

**2. 启动授权**
```bash
node auth-cli.js
```

**3. 按照提示操作**
```
步骤 1/6: 生成授权 URL...
步骤 2/6: 启动本地回调服务器...
步骤 3/6: 打开浏览器授权页面...
步骤 4/6: 等待授权回调...
步骤 5/6: 获取 access token...
步骤 6/6: 保存 token...

✅ 授权成功！
```

**4. 查看授权状态**
```bash
node auth-cli.js status
```

**预期输出**：
```
授权状态: 已授权 ✓
用户ID: your_user_id
Token 过期时间: 2026-12-24
```

**详细指南**: 查看 `plugins/alibaba-intl/OAUTH-GUIDE.md`

---

## 💬 使用示例

### 场景 1: 找供应商

在聊天界面输入：
```
请帮我在阿里巴巴国际站筛选做蓝牙耳机的供应商，
起订量 1000 个以内，需要 CE 认证
```

**系统会**：
- 自动委派"国际采购专家"
- 调用 alibaba-intl 插件搜索
- 执行 supplier-screening 技能
- 生成供应商对比报告

### 场景 2: 生成报价单

```
生成一份蓝牙耳机的报价单，
数量 5000 个，FOB 深圳，目的地洛杉矶
```

**系统会**：
- 委派"外贸销售专家"
- 执行 quotation-generator 技能
- 调用 exchange-rate 插件转换货币
- 输出专业报价单

### 场景 3: 市场分析

```
分析蓝牙耳机在欧洲市场的趋势和机会
```

**系统会**：
- 委派"产品分析师"
- 调用 google-trends 插件
- 执行 market-analysis 技能
- 输出市场分析报告

### 场景 4: 合规检查

```
检查 USB 充电线出口到美国需要什么认证
```

**系统会**：
- 委派"外贸合规专家"
- 调用 hs-code 插件查询
- 执行 compliance-check 技能
- 生成合规清单

### 场景 5: 计算运费

```
计算 1000kg 货物，6 立方米，从深圳到洛杉矶的运费
对比海运和空运
```

**系统会**：
- 委派"国际物流专家"
- 调用 shipping-calculator 插件
- 执行 freight-calculator 技能
- 输出方案对比

---

## 🐛 常见问题

### Q1: npm install 失败

**A**: 尝试以下方法：
```bash
# 方法 1: 清理缓存
npm cache clean --force
npm install

# 方法 2: 使用淘宝镜像
npm install --registry=https://registry.npmmirror.com

# 方法 3: 忽略版本冲突
npm install --legacy-peer-deps
```

### Q2: 端口被占用

**A**: 更改端口或关闭占用进程：
```bash
# 查看占用 3000 端口的进程
netstat -ano | findstr :3000

# 关闭进程（替换 PID）
taskkill /PID <进程ID> /F

# 或更改端口（修改 server.js）
```

### Q3: 插件测试失败

**A**: 确认在正确目录：
```bash
# 应该在这个目录
cd E:\MyProject\openworkbuddy\plugins

# 然后运行
node test-foreign-trade.js
```

### Q4: OAuth 授权失败

**A**: 检查以下内容：
1. 确保端口 3000 未被占用
2. 确保浏览器能正常打开
3. 确保网络连接正常
4. 查看详细日志：`plugins/alibaba-intl/logs/`

### Q5: 专家不工作

**A**: 检查专家配置：
```bash
# 查看专家列表
node -e "const j=require('fs').readFileSync('experts.json','utf8');console.log(JSON.parse(j).experts.map(e=>e.name).join('\n'))"

# 应该看到包括：
# - 国际采购专家
# - 外贸销售专家
# - 产品分析师
# - 外贸合规专家
# - 国际物流专家
```

---

## 📁 项目结构

```
E:\MyProject\openworkbuddy\
├── server.js              # 主服务器
├── experts.json           # 专家配置（含5个外贸专家）
├── package.json           # 依赖配置
│
├── plugins/               # 插件系统
│   ├── alibaba-intl/     # 阿里巴巴国际站（v2.0 OAuth）
│   ├── exchange-rate/    # 实时汇率
│   ├── google-trends/    # 市场趋势（新增）
│   ├── hs-code/          # 海关编码（新增）
│   ├── shipping-calculator/ # 物流计算（新增）
│   └── test-foreign-trade.js # 综合测试
│
├── skills/                # 技能库
│   ├── supplier-screening/    # 供应商筛选
│   ├── quotation-generator/   # 报价单生成
│   ├── market-analysis/       # 市场分析
│   ├── compliance-check/      # 合规检查
│   └── freight-calculator/    # 运费计算
│
├── test/                  # 测试脚本
│   ├── e2e-trade-scenarios.js
│   ├── unit-tests.js
│   └── verify-foreign-trade-skills.js
│
└── docs/                  # 完整文档
    ├── QUICKSTART-TRADE.md
    ├── EXPERTS.md
    ├── TEAMS.md
    └── FOREIGN-TRADE-SKILLS.md
```

---

## 🎯 验证清单

启动完成后，逐项验证：

### 基础功能
- [ ] 应用成功启动
- [ ] 可以访问 http://localhost:3000
- [ ] 聊天界面正常显示

### 插件系统
- [ ] 插件测试全部通过
- [ ] alibaba-intl 可用（Mock 模式）
- [ ] exchange-rate 可用
- [ ] google-trends 可用
- [ ] hs-code 可用
- [ ] shipping-calculator 可用

### 外贸专家
- [ ] 国际采购专家可用
- [ ] 外贸销售专家可用
- [ ] 产品分析师可用
- [ ] 外贸合规专家可用
- [ ] 国际物流专家可用

### 外贸技能
- [ ] supplier-screening 验证通过
- [ ] quotation-generator 验证通过
- [ ] market-analysis 验证通过
- [ ] compliance-check 验证通过
- [ ] freight-calculator 验证通过

### OAuth 授权（可选）
- [ ] 授权流程正常
- [ ] Token 保存成功
- [ ] 可以获取真实数据

---

## 📚 下一步

### 熟悉功能
1. 阅读 `TRADE-README.md` - 外贸版 README
2. 阅读 `docs/QUICKSTART-TRADE.md` - 快速开始指南
3. 阅读 `docs/EXPERTS.md` - 专家说明

### 配置授权
1. 按照上述步骤配置 OAuth
2. 阅读 `plugins/alibaba-intl/OAUTH-GUIDE.md`
3. 获取真实阿里巴巴数据

### 深度使用
1. 尝试 5 个典型场景
2. 体验专家团队协作
3. 探索更多功能

---

## 💡 提示

### 开发模式
```bash
# 开启调试日志
DEBUG=* npm start

# 或设置环境变量
set DEBUG=openworkbuddy:*
npm start
```

### 查看日志
```bash
# 查看服务器日志
tail -f logs/server.log

# 查看插件日志
tail -f plugins/alibaba-intl/logs/oauth.log
```

### 重置配置
```bash
# 删除 OAuth token（重新授权）
del plugins\alibaba-intl\.auth-token

# 重置插件配置
del plugins\registry.json
# 然后重新运行测试
```

---

## 🆘 获取帮助

### 文档资源
- **完整交付报告**: `V1.1-DELIVERY.md`
- **OAuth 指南**: `plugins/alibaba-intl/OAUTH-GUIDE.md`
- **插件文档**: `plugins/README.md`
- **外贸技能**: `docs/FOREIGN-TRADE-SKILLS.md`

### 测试脚本
- **插件测试**: `plugins/test-foreign-trade.js`
- **技能验证**: `test/verify-foreign-trade-skills.js`
- **端到端测试**: `test/e2e-trade-scenarios.js`

---

## ✅ 启动成功标志

当您看到以下输出时，说明启动成功：

```
============================================
  OpenWorkBuddy v1.1.0
  外贸专业 AI 工作台
============================================

✓ 加载专家: 5 个外贸专家
✓ 加载技能: 5 个外贸技能
✓ 加载插件: 5 个（alibaba-intl, exchange-rate, google-trends, hs-code, shipping-calculator）
✓ 服务器启动: http://localhost:3000

准备就绪！输入您的外贸需求...
```

---

## 🎉 开始使用

现在您可以开始使用 OpenWorkBuddy 外贸版了！

**建议第一次使用**：
```
你好，请介绍一下你的外贸能力
```

**祝您使用愉快！** 🚀

---

**最后更新**: 2026-11-24  
**版本**: v1.1.0  
**状态**: ✅ 生产就绪
