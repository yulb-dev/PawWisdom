# PawWisdom

🐾 AI 驱动的宠物健康与生活社区

## 项目结构

```
PawWisdom/
├── back-end/                    # NestJS 后端服务
├── front-end/                   # React Native (Expo) 移动端应用
├── .cursor/rules/               # Cursor AI 开发规范
│   ├── backend-nestjs.mdc
│   ├── database-supabase-typeorm.mdc
│   ├── frontend-react-native.mdc
│   └── git-workflow.mdc
├── .husky/                      # Git Hooks
│   ├── pre-commit
│   └── commit-msg
├── pnpm-workspace.yaml          # pnpm Workspace 配置
├── package.json                 # 根目录依赖管理
├── commitlint.config.js         # Commit message 验证规则
├── dev-iteration-plan.md        # 开发迭代计划
├── GIT_HOOKS.md                 # Git Hooks 使用说明
├── PNPM_WORKSPACE_GUIDE.md      # pnpm Workspace 使用指南
└── prd.md                       # 产品需求文档
```

## 技术栈

### 后端

- **框架**: NestJS 11
- **语言**: TypeScript 5.7
- **数据库**: PostgreSQL (Supabase)
- **ORM**: TypeORM
- **代码规范**: ESLint + Prettier

### 前端

- **框架**: React Native 0.81 + Expo 54
- **路由**: Expo Router 6
- **语言**: TypeScript 5.9
- **代码规范**: ESLint (expo 配置)

### Monorepo 管理

- **包管理器**: pnpm 8+ (Workspace)
- **依赖共享**: 自动去重和符号链接
- **统一管理**: 一键安装所有子项目依赖

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+ （如果没有安装：`npm install -g pnpm`）

### 1. 克隆项目并安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd PawWisdom

# 使用 pnpm workspace 一键安装所有依赖（包括根目录、后端、前端）
pnpm install
```

就这么简单！pnpm workspace 会自动安装所有子项目的依赖。

### 2. 启动开发服务器

**方式 1：同时启动前后端（推荐）**

```bash
pnpm run dev
```

**方式 2：单独启动**

```bash
# 仅启动后端
pnpm run dev:backend

# 仅启动前端
pnpm run dev:frontend
```

所有命令都在根目录执行，无需切换到子项目目录！

## 开发规范

本项目已配置完整的开发规范和自动化检查：

### Git Hooks

- **pre-commit**: 自动运行 ESLint 检查和修复暂存的代码
- **commit-msg**: 验证提交信息是否符合 Conventional Commits 规范

详见 [GIT_HOOKS.md](./GIT_HOOKS.md)

### Commit Message 规范

格式：`<type>(<scope>): <subject>`

**Type**:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具
- `ci`: CI/CD

**Scope** (任意有意义的模块名，建议参考):

- `pet`, `user`, `auth`, `community`, `health`, `ai`, `api`, `ui`, `db`, `deps`, `config`
- 也可以使用自定义的 scope，如 `my-module`, `feature-name` 等

**示例**:

```bash
git commit -m "feat(pet): add emotion detection api"
git commit -m "fix(auth): resolve jwt token expiration"
git commit -m "docs(readme): update setup guide"
```

### Cursor AI 规范

项目已配置 Cursor Rules，AI 助手会自动遵循以下规范：

- **backend-nestjs.mdc**: NestJS 后端开发最佳实践
- **frontend-react-native.mdc**: React Native 前端开发最佳实践
- **git-workflow.mdc**: Git 分支管理和工作流规范

## 分支管理

### 主要分支

- `main`: 生产环境分支
- `develop`: 开发主分支

### 功能分支命名

- `feature/<description>`: 新功能开发
- `bugfix/<description>`: Bug 修复
- `hotfix/<description>`: 紧急修复
- `release/<version>`: 发布准备

### 工作流

```bash
# 创建功能分支
git checkout develop
git checkout -b feature/pet-profile

# 开发并提交
git add .
git commit -m "feat(pet): add pet profile creation"

# 推送并创建 PR
git push -u origin feature/pet-profile
```

## 常用命令

### 依赖管理

```bash
# 为后端添加依赖
pnpm --filter back-end add <package-name>

# 为前端添加依赖
pnpm --filter front-end add <package-name>

# 添加开发依赖
pnpm --filter back-end add -D <package-name>

# 在根目录添加依赖（通常是开发工具）
pnpm add -w <package-name>
```

### 代码检查

```bash
# 检查所有项目
pnpm run lint

# 仅检查后端
pnpm run lint:backend

# 仅检查前端
pnpm run lint:frontend
```

### 测试

```bash
# 后端测试
pnpm run test:backend

# 前端测试
pnpm run test:frontend
```

### 构建

```bash
# 构建所有项目
pnpm run build

# 仅构建后端
pnpm run build:backend

# 仅构建前端
pnpm run build:frontend
```

### 清理

```bash
# 清理所有 node_modules
pnpm run clean
```

## 项目文档

- [产品需求文档 (PRD)](./prd.md)
- [开发迭代计划](./dev-iteration-plan.md)
- [Git Hooks 使用说明](./GIT_HOOKS.md)
- [pnpm Workspace 使用指南](./PNPM_WORKSPACE_GUIDE.md)
- [Git 工作流规范](./.cursor/rules/git-workflow.mdc)
- [后端开发规范](./.cursor/rules/backend-nestjs.mdc)
- [前端开发规范](./.cursor/rules/frontend-react-native.mdc)
- [数据库开发规范](./.cursor/rules/database-supabase-typeorm.mdc)

## 环境变量

### 后端 (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=pawwisdom
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
```

### 前端 (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 部署

### 后端部署

```bash
# 构建后端
pnpm run build:backend

# 生产环境启动（需要先进入 back-end 目录）
cd back-end && pnpm start:prod
```

### 前端构建

```bash
# 开发预览
pnpm run dev:frontend

# Android 构建（需要在 front-end 目录）
cd front-end && pnpm android

# iOS 构建（需要在 front-end 目录）
cd front-end && pnpm ios

# Web 构建（需要在 front-end 目录）
cd front-end && pnpm web
```

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat(scope): add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 开发分支

本项目当前在 `feature/iteration-1-user-system` 分支进行迭代 1 的开发：

- **主分支**: `main` - 生产环境代码
- **开发分支**: `develop` - 开发主分支
- **当前迭代**: `feature/iteration-1-user-system` - 用户系统与宠物档案功能

## 技术亮点

✅ 采用 **pnpm Workspace** 管理 Monorepo，依赖共享、安装快速
✅ 完整的 **Git Hooks** 配置，自动代码检查和提交信息验证
✅ 遵循 **Conventional Commits** 规范，提交历史清晰可追溯
✅ 配置 **Cursor AI Rules**，AI 辅助开发遵循最佳实践
✅ 前后端统一的 **TypeScript** 开发体验
✅ 使用 **Supabase** 提供后端服务（数据库、认证、存储）

## 许可证

本项目采用 MIT 许可证

## 联系方式

- 项目负责人: Yuxx
- Email: yuxx6698@163.com
- 项目地址: [PawWisdom](https://github.com/yulb-dev/PawWisdom)
