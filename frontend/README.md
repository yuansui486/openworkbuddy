# OpenWorkBuddy Frontend

## 项目说明

本前端界面从 Accio Work 项目迁移而来，使用 React + Vite + Ant Design 构建。

## 迁移内容

### 目录结构

```
frontend/
├── src/
│   ├── components/     # UI 组件
│   │   ├── chat/      # 聊天相关组件
│   │   └── common/    # 通用组件
│   ├── views/         # 页面视图
│   │   └── settings/  # 设置页面
│   ├── layouts/       # 布局组件
│   ├── stores/        # Zustand 状态管理
│   ├── styles/        # 全局样式
│   ├── router/        # 路由配置
│   ├── services/      # API 服务层
│   │   └── api.ts    # API 接口（已调整为占位）
│   ├── config/        # 配置文件
│   ├── utils/         # 工具函数
│   ├── skills/        # 技能处理器
│   ├── assets/        # 静态资源
│   ├── router.tsx     # 路由主文件
│   └── main.tsx       # 应用入口
├── public/            # 公共资源
├── index.html         # HTML 模板
├── package.json       # 项目配置（已调整）
├── vite.config.ts     # Vite 配置（已调整）
├── tsconfig.json      # TypeScript 配置
└── tsconfig.node.json # Node TypeScript 配置
```

### 技术栈

- **框架**: React 18.3.1
- **构建工具**: Vite 5.4.0
- **UI 库**: Ant Design 5.21.0
- **路由**: React Router 6.26.0
- **状态管理**: Zustand 4.5.0
- **HTTP 客户端**: Axios 1.7.0
- **Markdown**: Marked 14.0.0
- **代码高亮**: Highlight.js 11.10.0
- **语言**: TypeScript 5.5.0

## 配置调整

### 1. package.json
- 项目名称改为 `openworkbuddy-frontend`
- 描述改为 `OpenWorkBuddy - 前端界面`
- 移除了 Electron 相关依赖和脚本（concurrently, electron, electron-builder）
- 保留核心依赖项

### 2. vite.config.ts
- 开发服务器端口改为 5173（Vite 默认端口）
- 添加 API 代理配置，代理 `/api` 到 `http://localhost:3000`
- 保留其他原有配置（路径别名、代码分割等）

### 3. index.html
- 标题改为 `OpenWorkBuddy`

### 4. API 服务层
- 创建 `src/services/api.ts` 作为前后端通信接口占位文件
- 包含 axios 实例配置和拦截器模板
- 需要根据 OpenWorkBuddy 后端 API 规范进行具体实现

## 安装与运行

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览构建

```bash
npm run preview
```

## 后续工作

### 必须完成的集成任务

1. **API 对接**
   - 查看 OpenWorkBuddy 后端 API 文档
   - 在 `src/services/api.ts` 中实现具体的 API 方法
   - 更新拦截器中的认证逻辑

2. **环境配置**
   - 创建 `.env` 文件配置后端 API 地址
   - 根据不同环境（开发/生产）调整配置

3. **路由调整**
   - 检查 `src/router.tsx`，根据 OpenWorkBuddy 功能需求调整路由
   - 确保页面路径与后端路由规范一致

4. **状态管理**
   - 检查 `src/stores/` 中的状态管理逻辑
   - 根据 OpenWorkBuddy 数据流调整 store

5. **组件适配**
   - 检查各组件是否需要根据 OpenWorkBuddy 功能进行调整
   - 移除或替换与原 Accio Work 业务强相关的组件

6. **样式调整**
   - 根据 OpenWorkBuddy 品牌和设计规范调整主题色
   - 检查 `src/styles/` 中的全局样式

## 注意事项

- 本次迁移仅做文件复制和基本配置调整，未修改业务逻辑
- 所有原有的业务代码保持不变，需要根据 OpenWorkBuddy 实际需求进行适配
- API 接口文件为占位实现，需要完整对接后端
- 建议先运行开发服务器，检查是否有缺失的依赖或配置问题

## 目录对应关系

| 源项目路径 (alibaba) | 目标路径 (openworkbuddy) |
|---------------------|--------------------------|
| `src/components/` | `frontend/src/components/` |
| `src/views/` | `frontend/src/views/` |
| `src/stores/` | `frontend/src/stores/` |
| `src/layouts/` | `frontend/src/layouts/` |
| `src/styles/` | `frontend/src/styles/` |
| `src/router/` | `frontend/src/router/` |
| `src/services/` | `frontend/src/services/` |
| `src/config/` | `frontend/src/config/` |
| `src/utils/` | `frontend/src/utils/` |
| `src/skills/` | `frontend/src/skills/` |
| `src/assets/` | `frontend/src/assets/` |
| `public/` | `frontend/public/` |
| `index.html` | `frontend/index.html` |
| `package.json` | `frontend/package.json` ✓ 已调整 |
| `vite.config.ts` | `frontend/vite.config.ts` ✓ 已调整 |
| `tsconfig.json` | `frontend/tsconfig.json` |
| `tsconfig.node.json` | `frontend/tsconfig.node.json` |

---

迁移完成日期: 2026-11-23
