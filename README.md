# PawWisdom

AI驱动的宠物健康与生活社区

## 项目结构

```
PawWisdom/
├── back-end/          # NestJS 后端服务
├── front-end/         # React Native (Expo) 移动端应用
├── .cursor/rules/     # Cursor AI 开发规范
│   ├── backend-nestjs.mdc
│   ├── frontend-react-native.mdc
│   └── git-workflow.mdc
├── .husky/            # Git Hooks
│   ├── pre-commit
│   └── commit-msg
├── package.json       # 根目录依赖管理
├── commitlint.config.js
├── GIT_HOOKS.md      # Git Hooks 使用说明
└── prd.md            # 产品需求文档
```

## 技术栈

### 后端
- **框架**: NestJS 11
- **语言**: TypeScript 5.7
- **包管理**: pnpm
- **数据库**: PostgreSQL (Supabase)
- **代码规范**: ESLint + Prettier

### 前端
- **框架**: React Native 0.81 + Expo 54
- **路由**: Expo Router 6
- **语言**: TypeScript 5.9
- **包管理**: npm
- **代码规范**: ESLint (expo配置)

## 快速开始

### 1. 克隆项目并安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd PawWisdom

# 安装根目录依赖（Git Hooks）
npm install

# 安装后端依赖
cd back-end
pnpm install

# 安装前端依赖
cd ../front-end
npm install
```

### 2. 启动开发服务器

**后端**:
```bash
cd back-end
pnpm start:dev
```

**前端**:
```bash
cd front-end
npm start
```

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

**Scope**:
- `pet`, `user`, `auth`, `community`, `health`, `ai`, `api`, `ui`, `db`, `deps`, `config`

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

## 代码检查

### 后端
```bash
cd back-end
pnpm lint          # 运行 ESLint
pnpm format        # 运行 Prettier
pnpm test          # 运行测试
```

### 前端
```bash
cd front-end
npm run lint       # 运行 ESLint
```

## 项目文档

- [产品需求文档 (PRD)](./prd.md)
- [开发迭代计划](./dev-iteration-plan.md)
- [Git Hooks 使用说明](./GIT_HOOKS.md)

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

## 测试

### 后端测试
```bash
cd back-end
pnpm test          # 单元测试
pnpm test:e2e      # E2E 测试
pnpm test:cov      # 测试覆盖率
```

## 构建

### 后端
```bash
cd back-end
pnpm build
pnpm start:prod
```

### 前端
```bash
cd front-end
npm run android    # Android 构建
npm run ios        # iOS 构建
npm run web        # Web 构建
```

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat(scope): add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证

## 联系方式

- 项目负责人: [Your Name]
- Email: [your.email@example.com]
- 项目地址: [GitHub Repository URL]
