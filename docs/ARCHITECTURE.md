# OpenWorkBuddy + Accio Work 整合架构设计

## 1. 项目概述

### 1.1 现有系统分析

**OpenWorkBuddy (后端)**
- 技术栈：Node.js (v22+) + Express + Electron
- 核心能力：AI 办公工作台、专家团多智能体、MCP 连接器、技能系统、SSE 流式通信
- 主入口：`server.js` (Express 服务器) + `electron-main.js` (桌面壳)
- 端口：默认动态端口（通过 `resolvePort()` 分配）

**Accio Work (前端克隆)**
- 技术栈：React 18 + Electron + TypeScript + Zustand + Ant Design
- 核心能力：LLM 对话界面、MCP 网关代理、技能执行、专家管理
- 主入口：`electron/main.ts` (Electron) + `src/main.tsx` (React)
- 网关端口：4097 (MCP 代理网关)

### 1.2 整合目标

创建一个外贸 AI 工具，将 OpenWorkBuddy 的强大后端能力与 Accio Work 风格的现代前端结合：
- **后端**：OpenWorkBuddy 提供 AI 核心引擎、专家系统、技能执行、MCP 连接器
- **前端**：Accio Work 提供 React + Electron 界面、实时聊天体验、任务管理

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Accio Work Frontend (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Chat UI     │  │  Expert Mgmt │  │  Skill Panel │          │
│  │  (Zustand)   │  │  (Zustand)   │  │  (Zustand)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                   ┌────────▼──────────┐                          │
│                   │  Service Layer    │                          │
│                   │  - llm.ts         │                          │
│                   │  - workctl.ts     │                          │
│                   │  - skill-executor │                          │
│                   └────────┬──────────┘                          │
└────────────────────────────┼───────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         HTTP API        IPC Bridge    WebSocket
              │              │              │
              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Electron Main Process (Bridge Layer)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  API Proxy   │  │  IPC Handler │  │  WS Relay    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           OpenWorkBuddy Backend (Express Server)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───��──────────┐          │
│  │  REST API    │  │  SSE Stream  │  │  Agent Core  │          │
│  │  Routes      │  │  /api/chat   │  │  Runtime     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│    ┌────┴─────┬───────────┴────┬─────────────┴─────┐            │
│    ▼          ▼                ▼                     ▼            │
│  ┌─────┐  ┌────────┐      ┌────────┐          ┌────────┐        │
│  │ MCP │  │ Skills │      │Experts │          │ Tools  │        │
│  │ Mgr │  │ System │      │ Library│          │ System │        │
│  └─────┘  └────────┘      └────────┘          └────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## 3. 通信架构设计

### 3.1 HTTP REST API（主要通信方式）

#### 核心端点设计

```typescript
// ============ 会话管理 ============
GET    /api/session              # 获取会话列表
GET    /api/session/:id          # 获取会话详情（包含消息历史）
POST   /api/session              # 创建新会话
DELETE /api/session/:id          # 删除会话

// ============ 对话流式 (SSE) ============
POST   /api/chat                 # 发起对话（SSE 流式响应）
  Request: {
    session: string              # 会话 ID
    input: string                # 用户输入
    expert?: string              # 指定专家名称
    skills?: string[]            # 启用的技能列表
    attachments?: Array<{        # 附件
      type: 'file' | 'image'
      path: string
      name: string
    }>
  }
  Response: SSE Stream
    event: text                  # 文本增量
    event: tool_start            # 工具调用开始
    event: tool_result           # 工具调用结果
    event: done                  # 完成
    event: error                 # 错误

GET    /api/chat/stream/:id     # 重连流式响应
GET    /api/chat/running         # 获取运行中的会话列表

// ============ 专家系统 ============
GET    /api/experts              # 获取所有专家列表
GET    /api/experts/:name        # 获取专家详情
POST   /api/experts              # 创建自定义专家
PUT    /api/experts/:name        # 更新专家配置
DELETE /api/experts/:name        # 删除专家

GET    /api/expert-teams         # 获取专家团列表
POST   /api/expert-teams         # 创建专家团
PUT    /api/expert-teams/:name   # 更新专家团
DELETE /api/expert-teams/:name   # 删除专家团

// ============ 技能系统 ============
GET    /api/skills               # 获取所有技能
GET    /api/skills/:name         # 获取技能详情
POST   /api/skills               # 安装新技能
PUT    /api/skills/:name         # 更新技能配置
DELETE /api/skills/:name         # 卸载技能
POST   /api/skills/:name/test    # 测试技能执行

// ============ MCP 连接器 ============
GET    /api/mcp                  # 获取所有 MCP 连接器
POST   /api/mcp                  # 添加 MCP 连接器
PUT    /api/mcp/:id              # 更新连接器配置
DELETE /api/mcp/:id              # 删除连接器

GET    /api/mcp/:id/tools        # 获取连接器提供的工具列表
POST   /api/mcp/:id/tools/:tool  # 调用 MCP 工具

// ============ 插件管理 ============
GET    /api/plugins              # 获取插件列表
POST   /api/plugins              # 安装插件
DELETE /api/plugins/:name        # 卸载插件
GET    /api/plugins/:name/config # 获取插件配置界面

// ============ 文件管理 ============
GET    /api/files                # 列出工作目录文件
POST   /api/files/upload         # 上传文件
GET    /api/files/download/*     # 下载文件
GET    /api/files/preview/*      # 预览文件（Office/PDF/图片）

// ============ 任务调度 ============
GET    /api/schedules            # 获取定时任务列表
POST   /api/schedules            # 创建定时任务
DELETE /api/schedules/:id        # 删除定时任务
POST   /api/schedules/:id/run    # 手动触发任务

// ============ 系统设置 ============
GET    /api/settings             # 获取系统设置
POST   /api/settings             # 更新系统设置
GET    /api/models               # 获取可用模型列表
POST   /api/models/test          # 测试模型连接

// ============ 统计与监控 ============
GET    /api/stats                # 获取使用统计
GET    /api/cache                # 获取缓存状态
POST   /api/cache/clear          # 清除缓存
```

### 3.2 Electron IPC 通信（进程间桥接）

```typescript
// ========== 主进程 → 渲染进程 (Main → Renderer) ==========

// preload.ts 暴露的 API
interface ElectronAPI {
  // 后端服务管理
  getServerPort(): Promise<number>
  startServer(): Promise<void>
  stopServer(): Promise<void>
  restartServer(): Promise<void>
  
  // OpenWorkBuddy 配置
  getWorkspaceDir(): Promise<string>
  setWorkspaceDir(path: string): Promise<void>
  
  // Accio Token 桥接（如需兼容现有 Accio Desktop）
  getAccioToken(): Promise<string | null>
  setAccioToken(token: string): Promise<void>
  
  // 文件系统操作
  selectDirectory(): Promise<string | null>
  selectFile(filters?: FileFilter[]): Promise<string | null>
  openExternal(url: string): Promise<void>
  showInFolder(path: string): Promise<void>
  
  // 窗口控制
  minimizeWindow(): void
  maximizeWindow(): void
  closeWindow(): void
  
  // 通知
  showNotification(options: NotificationOptions): void
  
  // 自动更新
  checkForUpdates(): Promise<UpdateInfo>
  downloadUpdate(): Promise<void>
  installUpdate(): void
}

// ========== 渲染进程 → 主进程 (Renderer → Main) ==========

// IPC 频道定义
ipcMain.handle('server:get-port', async () => {
  return await getServerPort()
})

ipcMain.handle('server:start', async () => {
  return await startServer()
})

ipcMain.handle('workspace:get', async () => {
  return getWorkspaceDir()
})

ipcMain.handle('workspace:set', async (_event, path: string) => {
  return setWorkspaceDir(path)
})
```

### 3.3 WebSocket 实时通信（可选增强）

```typescript
// 实时状态同步（可选，用于多窗口/多设备同步）

// ws://localhost:{port}/ws/sync
interface WSMessage {
  type: 'session_update' | 'expert_added' | 'skill_installed' | 'file_changed'
  payload: unknown
  timestamp: number
}

// 客户端订阅
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['sessions', 'experts', 'skills']
}))

// 服务端推送
ws.send(JSON.stringify({
  type: 'session_update',
  payload: { sessionId: 'xxx', messages: [...] },
  timestamp: Date.now()
}))
```

## 4. 数据模型定义

### 4.1 核心实体模型

```typescript
// ============ 会话 (Session) ============
interface Session {
  id: string                    // UUID
  title: string                 // 会话标题（自动生成或用户指定）
  createdAt: number             // 创建时间戳
  updatedAt: number             // 最后更新时间
  expert?: string               // 绑定的专家名称
  skills: string[]              // 启用的技能列表
  workspace: string             // 工作目录路径
  metadata: {
    model?: string              // 使用的模型
    temperature?: number        // 温度参数
    tags?: string[]             // 标签
  }
}

// ============ 消息 (Message) ============
interface Message {
  id: string                    // UUID
  sessionId: string             // 所属会话
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string               // 文本内容
  createdAt: number             // 时间戳
  
  // 工具调用（仅 assistant 消息）
  toolCalls?: ToolCall[]
  
  // 附件（仅 user 消息）
  attachments?: Attachment[]
  
  // 状态
  status: 'pending' | 'streaming' | 'done' | 'error'
  
  // 元数据
  metadata?: {
    tokens?: { input: number; output: number }
    duration?: number           // 生成耗时（毫秒）
    model?: string              // 使用的模型
  }
}

// ============ 工具调用 (ToolCall) ============
interface ToolCall {
  id: string                    // 调用 ID
  name: string                  // 工具名称
  arguments: Record<string, unknown>  // 参数
  result?: {
    success: boolean
    data?: unknown
    error?: string
  }
  status: 'pending' | 'running' | 'done' | 'error'
  startTime?: number
  endTime?: number
}

// ============ 专家 (Expert) ============
interface Expert {
  name: string                  // 唯一标识（英文）
  displayName: string           // 显示名称
  description: string           // 简介（90 字以内）
  avatar: string                // 头像 URL 或 emoji
  category: string              // 分类
  system: string                // 系统提示词
  skills: string[]              // 绑定的技能
  builtin: boolean              // 是否内置
  hidden?: boolean              // 是否隐藏
  metadata?: {
    tags?: string[]
    temperature?: number
    maxTokens?: number
  }
}

// ============ 专家团 (ExpertTeam) ============
interface ExpertTeam {
  name: string                  // 唯一标识
  displayName: string           // 显示名称
  description: string           // 简介
  members: string[]             // 成员专家名称列表（至少 2 人）
  coordinator?: string          // 协调者（可选）
  workflow?: 'sequential' | 'parallel' | 'vote'  // 工作流模式
}

// ============ 技能 (Skill) ============
interface Skill {
  id: string                    // 唯一标识（kebab-case）
  name: string                  // 显示名称
  description: string           // 描述
  version: string               // 版本号
  
  // 触发配置
  triggers: string[]            // 触发关键词
  autoExecute: boolean          // 是否自动执行
  requireConfirm: boolean       // 是否需要确认
  
  // 执行配置
  handler: string               // 处理器类型（builtin / mcp / script）
  config: {
    mcpServer?: string          // MCP 服务器 ID
    mcpTool?: string            // MCP 工具名
    script?: string             // 脚本路径
    params?: Record<string, unknown>  // 默认参数
  }
  
  // 权限
  permissions: string[]         // 所需权限列表
  
  // 状态
  enabled: boolean              // 是否启用
  installed: boolean            // 是否已安装
  
  metadata?: {
    author?: string
    tags?: string[]
    category?: string
  }
}

// ============ MCP 连接器 (MCPConnector) ============
interface MCPConnector {
  id: string                    // UUID
  name: string                  // 连接器名称
  type: 'stdio' | 'sse' | 'websocket'
  
  // 连接配置
  config: {
    command?: string            // stdio: 启动命令
    args?: string[]             // stdio: 参数
    env?: Record<string, string>  // 环境变量
    url?: string                // sse/ws: 服务器 URL
    auth?: {                    // 认证
      type: 'bearer' | 'basic' | 'api-key'
      token?: string
      username?: string
      password?: string
    }
  }
  
  // 工具清单
  tools: MCPTool[]
  
  // 状态
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  enabled: boolean
  
  // 权限策略
  permissions: {
    allowed: string[]           // 允许的工具列表
    denied: string[]            // 拒绝的工具列表
    requireApproval: boolean    // 是否需要审批
  }
  
  metadata?: {
    description?: string
    icon?: string
    tags?: string[]
  }
}

// ============ MCP 工具定义 ============
interface MCPTool {
  name: string                  // 工具名称
  description?: string          // 描述
  inputSchema: {                // JSON Schema
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
}

// ============ 附件 (Attachment) ============
interface Attachment {
  id: string
  type: 'file' | 'image' | 'document'
  name: string                  // 文件名
  path: string                  // 本地路径
  size: number                  // 文件大小（字节）
  mimeType?: string             // MIME 类型
  url?: string                  // 访问 URL
}
```

### 4.2 状态管理（Zustand Store）

```typescript
// ============ Chat Store ============
interface ChatStore {
  conversations: Conversation[]
  activeConvId: string
  isLoading: boolean
  
  // Actions
  newConversation(options?: { title?: string; expertId?: string }): Conversation
  addMessage(convId: string, msg: Omit<Message, 'id' | 'createdAt'>): Message
  updateMessage(convId: string, msgId: string, patch: Partial<Message>): void
  deleteConversation(convId: string): void
}

// ============ Expert Store ============
interface ExpertStore {
  experts: Expert[]
  teams: ExpertTeam[]
  selectedExpert: string | null
  
  // Actions
  loadExperts(): Promise<void>
  createExpert(expert: Omit<Expert, 'builtin'>): Promise<void>
  updateExpert(name: string, patch: Partial<Expert>): Promise<void>
  deleteExpert(name: string): Promise<void>
}

// ============ Skill Store ============
interface SkillStore {
  skills: Skill[]
  installedSkills: Set<string>
  
  // Actions
  loadSkills(): Promise<void>
  installSkill(skillId: string): Promise<void>
  uninstallSkill(skillId: string): Promise<void>
  toggleSkill(skillId: string, enabled: boolean): Promise<void>
}

// ============ MCP Store ============
interface MCPStore {
  connectors: MCPConnector[]
  
  // Actions
  loadConnectors(): Promise<void>
  addConnector(config: Omit<MCPConnector, 'id' | 'tools' | 'status'>): Promise<void>
  removeConnector(id: string): Promise<void>
  refreshTools(id: string): Promise<void>
}

// ============ Settings Store ============
interface SettingsStore {
  llmConfig: {
    baseURL: string
    apiKey: string
    model: string
    temperature: number
    maxTokens: number
  }
  workspaceDir: string
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'auto'
  
  // Actions
  loadSettings(): Promise<void>
  updateSettings(patch: Partial<SettingsStore>): Promise<void>
}
```

## 5. 技术选型与建议

### 5.1 通信层选型

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 对话流式响应 | HTTP SSE | OpenWorkBuddy 原生支持，简单可靠 |
| 文件上传/下载 | HTTP REST | 标准方案，支持大文件、断点续传 |
| 实时状态同步 | WebSocket（可选） | 仅在多窗口/协作场景需要 |
| 进程间通信 | Electron IPC | Electron 标准方案 |
| MCP 工具调用 | HTTP POST | 复用 OpenWorkBuddy 现有架构 |

### 5.2 状态管理选型

**推荐：Zustand + React Query**
- **Zustand**：轻量级状态管理，已在 Accio Work 中使用
- **React Query**：管理服务端状态（缓存、自动重试、乐观更新）

```typescript
// 示例：使用 React Query 管理会话列表
function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5204/api/session')
      return res.json()
    },
    staleTime: 1000 * 60 * 5  // 5 分钟
  })
}

// 示例：使用 mutation 发送消息
function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ sessionId, input }: { sessionId: string; input: string }) => {
      const res = await fetch('http://localhost:5204/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionId, input })
      })
      return res.body  // SSE stream
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })
}
```

### 5.3 认证与安全

**开发阶段**
- 本地单机应用，无需复杂认证
- 仅校验请求来源（Electron → Express）

**生产阶段（如需部署）**
```typescript
// 1. JWT Token 认证
interface AuthToken {
  userId: string
  deviceId: string
  exp: number
}

// 2. API Key 认证（OpenWorkBuddy 已支持）
headers: {
  'Authorization': `Bearer ${apiKey}`
}

// 3. 本地进程校验
// Electron 主进程启动时生成一个随机 token，
// 只有本进程启动的前端才知道这个 token
const processToken = crypto.randomBytes(32).toString('hex')
```

### 5.4 错误处理策略

```typescript
// ============ 统一错误格式 ============
interface APIError {
  code: string                  // 错误码（如 'EXPERT_NOT_FOUND'）
  message: string               // 用户可读消息
  details?: unknown             // 详细信息
  timestamp: number
}

// ============ 前端错误处理 ============
// 1. API 调用包装
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options)
    
    if (!res.ok) {
      const error: APIError = await res.json()
      throw new Error(error.message)
    }
    
    return await res.json()
  } catch (err) {
    // 网络错误、超时等
    if (err instanceof TypeError) {
      throw new Error('网络连接失败，请检查后端服务是否启动')
    }
    throw err
  }
}

// 2. React 错误边界
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error:', error, errorInfo)
    // 上报到日志系统
  }
}

// 3. SSE 重连策略
function createSSEConnection(url: string) {
  let retryCount = 0
  const maxRetries = 5
  
  function connect() {
    const eventSource = new EventSource(url)
    
    eventSource.onerror = () => {
      eventSource.close()
      
      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(connect, Math.min(1000 * Math.pow(2, retryCount), 30000))
      }
    }
    
    return eventSource
  }
  
  return connect()
}
```

## 6. 部署与开发流程

### 6.1 开发环境启动

```bash
# 1. 启动 OpenWorkBuddy 后端
cd E:\MyProject\openworkbuddy
npm install
npm start                        # Express 服务器，默认端口 5204

# 2. 启动前端（开发模式）
cd E:\MyProject\alibaba
npm install
npm run dev                      # Vite dev server: http://localhost:1420

# 3. 启动 Electron 壳（开发模式）
npm run electron:dev             # Electron + Vite 热更新
```

### 6.2 配置文件

**OpenWorkBuddy 配置** (`E:\MyProject\openworkbuddy\config.json`)
```json
{
  "port": 5204,
  "host": "localhost",
  "cors": {
    "origins": ["http://localhost:1420", "app://"]
  },
  "workspace": "C:\\Users\\{USER}\\OpenWorkBuddy",
  "llm": {
    "provider": "anthropic",
    "apiKey": "sk-xxx",
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

**前端环境变量** (`E:\MyProject\alibaba\.env.development`)
```env
VITE_API_BASE_URL=http://localhost:5204
VITE_WS_URL=ws://localhost:5204
VITE_GATEWAY_PORT=5204
```

### 6.3 构建打包

```bash
# 1. 构建前端
cd E:\MyProject\alibaba
npm run build                    # 输出到 dist/

# 2. 打包 Electron（包含后端）
npm run electron:build           # 输出到 release/

# 目录结构
release/
├── win-unpacked/
│   ├── resources/
│   │   ├── app.asar            # 前端 React 应用
│   │   └── backend/            # OpenWorkBuddy 后端代码
│   │       ├── server.js
│   │       ├── src/
│   │       └── node_modules/
│   └── 国际站生意助手.exe
└── 国际站生意助手 Setup.exe
```

### 6.4 Electron 主进程集成

```typescript
// electron/main.ts
import { app, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'

let backendProcess: ChildProcess | null = null
let serverPort = 5204

async function startBackend() {
  const isDev = !app.isPackaged
  
  if (isDev) {
    // 开发环境：假设后端已手动启动
    serverPort = 5204
  } else {
    // 生产环境：从 resources/backend 启动
    const backendPath = path.join(process.resourcesPath, 'backend', 'server.js')
    
    backendProcess = spawn('node', [backendPath], {
      env: {
        ...process.env,
        PORT: '0',  // 动态端口
        NODE_ENV: 'production'
      }
    })
    
    // 读取实际端口（从 stdout 解析）
    backendProcess.stdout?.on('data', (data) => {
      const match = data.toString().match(/Server listening on (\d+)/)
      if (match) {
        serverPort = parseInt(match[1])
        console.log(`Backend started on port ${serverPort}`)
      }
    })
    
    // 等待后端就绪
    await waitForServer(serverPort)
  }
}

async function waitForServer(port: number, timeout = 30000): Promise<void> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const res = await fetch(`http://localhost:${port}/api/settings`)
      if (res.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  throw new Error('Backend failed to start')
}

app.on('ready', async () => {
  await startBackend()
  createWindow()
})

app.on('quit', () => {
  backendProcess?.kill()
})
```

## 7. 迁移路径建议

### 7.1 分阶段迁移

**Phase 1: 基础架构对接**（1-2 周）
- [ ] 配置 Electron IPC 桥接
- [ ] 实现 HTTP 客户端层（`services/api.ts`）
- [ ] 对接 `/api/chat` SSE 流式响应
- [ ] 实现基础会话列表和消息展示

**Phase 2: 专家系统集成**（1 周）
- [ ] 对接 `/api/experts` 和 `/api/expert-teams`
- [ ] 实现专家选择和管理界面
- [ ] 支持指定专家发起对话

**Phase 3: 技能系统集成**（1-2 周）
- [ ] 对接 `/api/skills` 和 `/api/mcp`
- [ ] 实现技能市场和安装界面
- [ ] 支持技能触发和执行反馈

**Phase 4: 高级功能**（2 周）
- [ ] 文件上传和管理
- [ ] 定时任务调度
- [ ] 多窗口状态同步（WebSocket）
- [ ] 插件系统对接

**Phase 5: 打磨与优化**（1 周）
- [ ] 性能优化（虚拟滚动、懒加载）
- [ ] 错误处理和重试机制
- [ ] 用户体验优化
- [ ] 打包和部署测试

### 7.2 兼容性策略

**向后兼容 OpenWorkBuddy CLI**
- OpenWorkBuddy CLI 和 Electron 前端共用同一个 Express 后端
- API 接口保持不变，仅增加新端点

**可选 Accio Gateway 兼容层**
- 如果需要同时支持原 Accio Work MCP 网关，可在 Electron 主进程实现一个代理层
- 将 Accio 风格的 `/mcp/proxy` 请求转发到 OpenWorkBuddy 的 `/api/mcp/:id/tools/:tool`

## 8. 关键文件清单

### 8.1 需要创建的文件

```
E:\MyProject\alibaba\
├── electron/
│   ├── main.ts                 # Electron 主进程（集成 OpenWorkBuddy）
│   ├── preload.ts              # IPC 桥接层
│   └── backend-manager.ts      # 后端进程管理
├── src/
│   ├── services/
│   │   ├── api.ts              # HTTP 客户端封装
│   │   ├── sse.ts              # SSE 连接管理
│   │   └── ipc.ts              # IPC 调用封装
│   ├── stores/
│   │   ├── useChatStore.ts     # ✓ 已存在（需调整）
│   │   ├── useExpertsStore.ts  # ✓ 已存在（需对接 API）
│   │   ├── useSkillsStore.ts   # ✓ 已存在（需对接 API）
│   │   └── useMCPStore.ts      # 新增：MCP 连接器管理
│   └── utils/
│       ├── error-handler.ts    # 统一错误处理
│       └── retry.ts            # 重试逻辑
└── types/
    └── openworkbuddy.d.ts      # OpenWorkBuddy API 类型定义
```

### 8.2 需要修改的文件

```
E:\MyProject\alibaba\
├── src/services/llm.ts         # 修改为调用 /api/chat
├── src/services/mcp.ts         # 修改为调用 /api/mcp
├── src/services/workctl.ts     # 修改为调用 OpenWorkBuddy API
└── package.json                # 添加 Electron 构建配置
```

### 8.3 OpenWorkBuddy 侧无需修改

OpenWorkBuddy 的 Express API 已完整实现，前端直接调用即可，无需后端改动。

---

## 附录

### A. API 调用示例

```typescript
// ========== 创建会话 ==========
const createConversation = async (title?: string, expertName?: string) => {
  const res = await fetch('http://localhost:5204/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, expert: expertName })
  })
  return await res.json()  // { id: string, title: string, ... }
}

// ========== 发起对话（SSE 流式） ==========
const sendMessage = async (sessionId: string, input: string, onChunk: (text: string) => void) => {
  const eventSource = new EventSource(
    `http://localhost:5204/api/chat?session=${encodeURIComponent(sessionId)}&input=${encodeURIComponent(input)}`
  )
  
  eventSource.addEventListener('text', (e) => {
    const data = JSON.parse(e.data)
    onChunk(data.delta)
  })
  
  eventSource.addEventListener('done', () => {
    eventSource.close()
  })
  
  eventSource.addEventListener('error', (e) => {
    console.error('SSE error:', e)
    eventSource.close()
  })
}

// ========== 获取专家列表 ==========
const fetchExperts = async () => {
  const res = await fetch('http://localhost:5204/api/experts')
  return await res.json()  // Expert[]
}

// ========== 调用 MCP 工具 ==========
const callMCPTool = async (connectorId: string, toolName: string, args: Record<string, unknown>) => {
  const res = await fetch(`http://localhost:5204/api/mcp/${connectorId}/tools/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arguments: args })
  })
  return await res.json()
}
```

### B. 性能优化建议

1. **虚拟滚动**：消息列表超过 100 条时使用 `react-window`
2. **增量加载**：会话历史分页加载，每次 50 条
3. **缓存策略**：
   - 专家列表：5 分钟缓存
   - 技能列表：30 分钟缓存
   - 会话列表：1 分钟缓存
4. **代码分割**：按路由懒加载组件
5. **Worker 线程**：Markdown 渲染、代码高亮放到 Worker

### C. 测试策略

```typescript
// ========== 单元测试（Vitest） ==========
// services/api.test.ts
describe('API Client', () => {
  it('should fetch experts', async () => {
    const experts = await fetchExperts()
    expect(experts).toBeInstanceOf(Array)
  })
})

// ========== 集成测试（Playwright） ==========
// e2e/chat.spec.ts
test('should send message and receive response', async ({ page }) => {
  await page.goto('http://localhost:1420')
  await page.fill('[data-testid="chat-input"]', 'Hello')
  await page.click('[data-testid="send-button"]')
  await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible()
})

// ========== E2E 测试（Electron） ==========
// e2e/electron.spec.ts
test('should start backend and create window', async () => {
  const app = await electron.launch({ args: ['./'] })
  const window = await app.firstWindow()
  await expect(window.title()).resolves.toBe('Accio Work')
  await app.close()
})
```

---

**文档版本**：v1.0  
**最后更新**：2026-11-23  
**作者**：Architecture Agent  
**状态**：设计完成，待评审
