# pnpm Workspace 迁移指南

## 🎯 已完成的配置

✅ 创建 `pnpm-workspace.yaml` 配置文件
✅ 更新根目录 `package.json` 脚本使用 pnpm workspace 命令
✅ 更新 `.gitignore` 添加 `pnpm-lock.yaml`
✅ 更新 `lint-staged` 配置使用 pnpm
✅ 删除旧的 `package-lock.json` 文件

## 📦 Workspace 结构

```
PawWisdom/
├── pnpm-workspace.yaml      # Workspace 配置
├── package.json              # 根项目配置
├── back-end/                 # 后端子项目
│   └── package.json
└── front-end/                # 前端子项目
    └── package.json
```

## 🚀 迁移步骤

### 1. 确保安装了 pnpm

```bash
# 检查 pnpm 版本
pnpm --version

# 如果没安装，使用 npm 全局安装
npm install -g pnpm

# 或使用官方推荐的方式
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 2. 清理旧的依赖

```bash
# 删除所有 node_modules（可选但推荐）
rm -rf node_modules back-end/node_modules front-end/node_modules

# 删除旧的 lock 文件（已完成）
# package-lock.json 和 front-end/package-lock.json 已被删除
```

### 3. 安装所有依赖

```bash
# 在项目根目录执行（会自动安装所有子项目依赖）
pnpm install
```

## 📝 常用命令

### 安装依赖

```bash
# 安装所有项目依赖
pnpm install

# 为特定子项目安装依赖
pnpm --filter back-end add <package-name>
pnpm --filter front-end add <package-name>

# 安装开发依赖
pnpm --filter back-end add -D <package-name>

# 在根目录安装依赖（通常是开发工具）
pnpm add -w <package-name>
```

### 开发和构建

```bash
# 启动后端开发服务器
pnpm run dev:backend

# 启动前端开发服务器
pnpm run dev:frontend

# 同时启动前后端（推荐）
pnpm run dev

# 构建项目
pnpm run build              # 构建所有项目
pnpm run build:backend      # 仅构建后端
pnpm run build:frontend     # 仅构建前端
```

### 代码检查和测试

```bash
# 运行 linter
pnpm run lint               # 检查所有项目
pnpm run lint:backend       # 仅检查后端
pnpm run lint:frontend      # 仅检查前端

# 运行测试
pnpm run test:backend       # 运行后端测试
pnpm run test:frontend      # 运行前端测试
```

### 执行任意命令

```bash
# 在特定子项目中执行命令
pnpm --filter back-end <command>
pnpm --filter front-end <command>

# 在所有子项目中执行命令（并行）
pnpm -r <command>

# 示例：在所有项目中清理构建产物
pnpm -r exec rm -rf dist
```

## 🔧 pnpm Workspace 特性

### 1. 依赖共享

pnpm 使用符号链接和硬链接，所有项目共享相同的依赖，节省磁盘空间。

```bash
# 查看依赖树
pnpm list

# 查看特定项目的依赖树
pnpm --filter back-end list
```

### 2. 跨项目引用

子项目可以相互引用（如果需要共享代码）：

```json
// back-end/package.json 可以引用 shared 包
{
  "dependencies": {
    "@pawwisdom/shared": "workspace:*"
  }
}
```

### 3. 并行执行

```bash
# 在所有子项目中并行执行命令
pnpm -r --parallel run build

# 递归执行（按依赖顺序）
pnpm -r run build
```

## 🎨 与之前的区别

### 之前（混用 npm 和 pnpm）

```bash
npm install                           # 安装根目录依赖
cd back-end && pnpm install          # 手动安装后端依赖
cd ../front-end && npm install       # 手动安装前端依赖
```

### 现在（统一使用 pnpm workspace）

```bash
pnpm install                         # 一次性安装所有依赖
```

### 开发命令对比

| 操作         | 之前                              | 现在                              |
| ------------ | --------------------------------- | --------------------------------- |
| 启动后端     | `cd back-end && pnpm start:dev`   | `pnpm run dev:backend`            |
| 启动前端     | `cd front-end && npm start`       | `pnpm run dev:frontend`           |
| 后端添加依赖 | `cd back-end && pnpm add xxx`     | `pnpm --filter back-end add xxx`  |
| 前端添加依赖 | `cd front-end && npm install xxx` | `pnpm --filter front-end add xxx` |

## ⚠️ 注意事项

### 1. Git Hooks

Git hooks（husky）依然正常工作，`pnpm install` 会自动执行 `prepare` 脚本。

### 2. CI/CD

如果有 CI/CD 配置，需要更新安装命令：

```yaml
# GitHub Actions 示例
- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Install dependencies
  run: pnpm install
```

### 3. 编辑器设置

如果使用 VSCode，确保安装了 pnpm 相关插件以获得更好的支持。

## 📚 更多资源

- [pnpm 官方文档](https://pnpm.io/zh/)
- [pnpm Workspace 文档](https://pnpm.io/zh/workspaces)
- [从 npm/yarn 迁移到 pnpm](https://pnpm.io/zh/installation#兼容性)

## 🐛 故障排除

### 问题：pnpm 命令未找到

```bash
# 全局安装 pnpm
npm install -g pnpm
```

### 问题：依赖安装失败

```bash
# 清理缓存并重新安装
pnpm store prune
rm -rf node_modules back-end/node_modules front-end/node_modules
pnpm install
```

### 问题：某个包安装错误

```bash
# 使用 --force 强制重新安装
pnpm install --force

# 或指定特定的包管理器版本
pnpm install --shamefully-hoist
```

---

**现在可以执行 `pnpm install` 开始使用 pnpm Workspace 了！** 🎉
