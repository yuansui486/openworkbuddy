# 插件授权功能测试文档

## 实现概述

已成功在 OpenWorkBuddy 插件管理界面中集成授权按钮功能，专门用于 `alibaba-international` 插件。

## 修改的文件

### 1. `public/js/app-04.js`
- **位置**: 第 2349-2355 行（插件卡片渲染部分）
- **修改内容**: 在插件卡片中为 `alibaba-international` 添加授权按钮
- **新增功能**:
  - `checkPluginAuthStatus(pluginName)`: 检查插件授权状态
  - `updateAuthButton(pluginName, status)`: 更新授权按钮UI
  - `handlePluginAuth(pluginName)`: 处理授权流程（OAuth窗口）
  - `revokePluginAuth(pluginName)`: 撤销授权

### 2. `public/index.html`
- **位置**: 第 15 行
- **修改内容**: 添加 `plugin-auth.css` 样式表链接

### 3. `public/css/plugin-auth.css`
- **状态**: 已存在，无需修改
- **内容**: 包含完整的授权按钮样式（未授权、已授权、授权中、错误等状态）

## 功能特性

### 授权按钮UI
- **未授权状态**: 🔒 授权未连接（红色边框）
- **已授权状态**: ✓ 已授权（绿色背景）
- **授权中状态**: ⏳ 授权中...（黄色背景，带旋转动画）
- **错误状态**: 授权失败提示

### 授权流程
1. 用户点击"授权未连接"按钮
2. 调用后端 `/api/plugins/{pluginName}/auth/start` 获取授权URL和state
3. 打开OAuth授权窗口（600x700居中）
4. 每5秒轮询授权状态（最多5分钟/60次）
5. 授权成功后：
   - 关闭OAuth窗口
   - 更新按钮为"已授权"状态
   - 显示成功提示

### 撤销授权
1. 点击"已授权"按钮
2. 弹出确认对话框
3. 用户确认后调用 `/api/plugins/{pluginName}/auth/revoke`
4. 撤销成功后更新按钮为"授权未连接"状态

## 需要的后端API

为了完整实现授权功能，后端需要提供以下API端点：

### 1. 检查授权状态
```
GET /api/plugins/{pluginName}/auth/status
```
**响应示例**:
```json
{
  "authorized": false
}
```
或
```json
{
  "authorized": true,
  "details": {
    "authorizedAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### 2. 启动授权流程
```
POST /api/plugins/{pluginName}/auth/start
```
**响应示例**:
```json
{
  "authUrl": "https://oauth.example.com/authorize?client_id=xxx&state=yyy",
  "state": "random_state_string_12345"
}
```

### 3. 检查授权完成状态
```
GET /api/plugins/{pluginName}/auth/check?state={state}
```
**响应示例**:
```json
{
  "authorized": true
}
```
或
```json
{
  "authorized": false,
  "pending": true
}
```

### 4. 撤销授权
```
POST /api/plugins/{pluginName}/auth/revoke
```
**响应示例**:
```json
{
  "success": true
}
```

## 测试清单

### 前端集成测试
- [x] 插件卡片正确渲染授权按钮
- [x] CSS样式正确加载
- [x] 授权按钮仅显示在 `alibaba-international` 插件上
- [ ] 页面加载时自动检查授权状态
- [ ] 点击按钮弹出授权窗口
- [ ] 授权窗口正确居中显示（600x700）
- [ ] 轮询机制正常工作（每5秒一次）
- [ ] 授权成功后按钮状态更新
- [ ] 授权失败/超时后按钮恢复可点击
- [ ] 撤销授权功能正常
- [ ] 页面刷新后授权状态保持

### UI/UX测试
- [ ] 按钮hover效果正常
- [ ] 按钮禁用状态正确显示
- [ ] 加载动画流畅
- [ ] Toast提示信息清晰
- [ ] 确认对话框样式正常
- [ ] 移动端适配（响应式设计）
- [ ] 暗色主题支持

### 错误处理测试
- [ ] 后端API不存在时优雅降级
- [ ] 授权URL无效时的错误提示
- [ ] 浏览器阻止弹窗时的提示
- [ ] 网络错误时的重试机制
- [ ] OAuth窗口被用户关闭时的处理
- [ ] 授权超时（5分钟）后的处理

## 使用示例

### 授权流程示例
```javascript
// 1. 用户打开插件管理页面
// 2. 看到 alibaba-international 插件卡片上的"授权未连接"按钮
// 3. 点击按钮
// 4. 弹出阿里云国际站OAuth授权页面
// 5. 用户在授权页面登录并同意授权
// 6. 授权完成后窗口自动关闭
// 7. 按钮变为"已授权"状态
```

### 撤销授权示例
```javascript
// 1. 点击"已授权"按钮
// 2. 弹出确认对话框："确定要撤销「alibaba-international」的授权吗？"
// 3. 点击"撤销授权"
// 4. 授权被撤销，按钮变回"授权未连接"状态
```

## 代码关键点

### 授权按钮条件渲染
```javascript
${p.name === 'alibaba-international' ? `<div class="plugin-auth-status" data-plugin="${esc(p.name)}" style="margin:8px 0">
  <button class="auth-btn unauthorized" data-plugin="${esc(p.name)}">
    <span class="icon">🔒</span>
    <span>授权未连接</span>
  </button>
</div>` : ''}
```

### OAuth窗口配置
```javascript
const width = 600;
const height = 700;
const left = (screen.width - width) / 2;
const top = (screen.height - height) / 2;

const authWindow = window.open(
  authUrl,
  'oauth-auth',
  `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
);
```

### 轮询机制
```javascript
const checkInterval = setInterval(async () => {
  attempts++;
  
  if (authWindow.closed) {
    clearInterval(checkInterval);
    // 处理用户关闭窗口
    return;
  }
  
  // 检查授权状态
  const checkResponse = await fetch(`/api/plugins/${pluginName}/auth/check?state=${state}`);
  
  if (attempts >= maxAttempts) {
    // 超时处理
    clearInterval(checkInterval);
  }
}, 5000); // 每5秒检查一次
```

## 注意事项

1. **安全性**: OAuth state参数需要在后端生成并验证，防止CSRF攻击
2. **浏览器兼容性**: 确保目标浏览器支持`window.open`弹窗
3. **超时处理**: 5分钟（60次×5秒）后自动超时，可根据实际需求调整
4. **错误提示**: 所有错误都通过`toast`函数显示，确保用户体验友好
5. **状态持久化**: 授权状态存储在后端，前端每次加载页面都重新检查

## 下一步工作

1. **后端API实现**: 实现上述4个API端点
2. **OAuth配置**: 配置阿里云国际站OAuth应用（Client ID、Secret、回调URL等）
3. **Token存储**: 实现安全的Token存储机制
4. **Token刷新**: 实现Token过期自动刷新
5. **集成测试**: 端到端测试完整授权流程
6. **文档完善**: 更新用户手册和开发文档

## 验证方法

### 快速验证
1. 启动 OpenWorkBuddy 服务
2. 访问插件管理页面
3. 找到 `alibaba-international` 插件
4. 确认授权按钮正确显示
5. 检查浏览器控制台是否有错误

### 完整测试
需要后端API支持后进行完整的授权流程测试。

## 文件路径索引

- 主JavaScript文件: `E:\MyProject\openworkbuddy\public\js\app-04.js`
- 主HTML文件: `E:\MyProject\openworkbuddy\public\index.html`
- 授权CSS样式: `E:\MyProject\openworkbuddy\public\css\plugin-auth.css`
- 插件管理HTML: `E:\MyProject\openworkbuddy\public\plugin-manager.html`
- 测试文档: `E:\MyProject\openworkbuddy\PLUGIN_AUTH_TEST.md`
