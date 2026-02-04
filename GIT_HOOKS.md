# Git Hooks 使用说明

本项目已配置 Git Hooks 来自动化代码检查和提交信息验证。

## 安装

克隆项目后，在根目录运行：

```bash
npm install
```

这会自动安装并配置 Git hooks。

## Pre-commit Hook

**触发时机**：每次执行 `git commit` 之前

**功能**：
- 自动对暂存的文件运行 ESLint
- 自动修复可修复的代码风格问题
- 如果有无法自动修复的错误，提交将被阻止

**检查范围**：
- 后端：`back-end/**/*.ts` 文件
- 前端：`front-end/**/*.{ts,tsx}` 文件

**示例**：
```bash
git add .
git commit -m "feat(pet): add pet model"
# 🔍 Running pre-commit checks...
# ✅ Pre-commit checks passed!
```

## Commit-msg Hook

**触发时机**：提交信息输入后，提交创建之前

**功能**：验证提交信息格式是否符合 Conventional Commits 规范

**规范格式**：
```
<type>(<scope>): <subject>
```

### Type（必填）

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(pet): add emotion detection` |
| `fix` | Bug 修复 | `fix(api): resolve null pointer error` |
| `docs` | 文档更新 | `docs(readme): update setup guide` |
| `style` | 代码格式 | `style(ui): fix indentation` |
| `refactor` | 重构 | `refactor(auth): simplify token logic` |
| `perf` | 性能优化 | `perf(image): add lazy loading` |
| `test` | 测试 | `test(user): add unit tests` |
| `chore` | 构建/工具 | `chore(deps): upgrade nestjs` |
| `ci` | CI/CD | `ci(github): add workflow` |
| `revert` | 回滚 | `revert: revert previous commit` |

### Scope（必填）

可以使用任意有意义的模块名称，建议参考：

| Scope | 说明 |
|-------|------|
| `pet` | 宠物相关功能 |
| `user` | 用户相关功能 |
| `auth` | 认证授权 |
| `community` | 社区功能 |
| `health` | 健康管理 |
| `ai` | AI 识别功能 |
| `api` | API 接口 |
| `ui` | UI 组件 |
| `db` | 数据库 |
| `deps` | 依赖更新 |
| `config` | 配置文件 |
| 自定义 | 如 `my-module`, `feature-name` 等 |

**注意**：scope 必须小写，可以使用连字符（如 `my-module`）

### Subject（必填）

- 必须小写开头
- 不能以句号结尾
- 简洁描述变更内容（建议不超过 50 字符）

### 示例

✅ **正确的提交信息**：
```bash
git commit -m "feat(pet): add pet profile creation"
git commit -m "fix(auth): resolve jwt token expiration"
git commit -m "docs(api): update swagger documentation"
git commit -m "chore(deps): upgrade react-native to 0.81.5"
```

❌ **错误的提交信息**：
```bash
git commit -m "add new feature"              # 缺少 type 和 scope
git commit -m "feat: add feature"            # 缺少 scope
git commit -m "Feat(pet): add feature"       # Type 不应大写
git commit -m "feat(Pet): add feature"       # Scope 不应大写
git commit -m "feat(pet): Add feature"       # Subject 不应大写开头
git commit -m "feat(pet): add feature."      # Subject 不应以句号结尾
```

## 跳过 Hooks（不推荐）

在某些特殊情况下，可以跳过 hooks：

```bash
# 跳过 pre-commit
git commit --no-verify -m "feat(pet): emergency fix"

# 或使用简写
git commit -n -m "feat(pet): emergency fix"
```

**⚠️ 注意**：除非紧急情况，否则不建议跳过 hooks，这会降低代码质量。

## 故障排除

### Hook 没有执行

1. 确保已安装依赖：
   ```bash
   npm install
   ```

2. 检查 hook 文件权限：
   ```bash
   ls -la .husky/
   ```
   
   如果没有执行权限，运行：
   ```bash
   chmod +x .husky/pre-commit .husky/commit-msg
   ```

3. 验证 Git 配置：
   ```bash
   git config core.hooksPath
   # 应该输出: .husky
   ```

### ESLint 错误无法自动修复

如果 pre-commit 失败，查看错误信息并手动修复，然后重新提交：

```bash
# 查看具体错误
cd back-end && pnpm lint
# 或
cd front-end && npm run lint

# 修复后重新提交
git add .
git commit -m "feat(pet): add feature"
```

### Commitlint 验证失败

仔细检查提交信息格式：
- Type 必须在允许列表中
- Scope 必须在允许列表中
- Type、Scope、Subject 都必须小写
- Subject 不能以句号结尾

## 配置文件说明

- `package.json` - 定义依赖和 lint-staged 配置
- `commitlint.config.js` - Commitlint 规则配置
- `.husky/pre-commit` - Pre-commit hook 脚本
- `.husky/commit-msg` - Commit-msg hook 脚本

## 修改规则

如果需要修改提交信息规范，编辑 `commitlint.config.js` 文件：

```javascript
// 添加新的 type
'type-enum': [2, 'always', ['feat', 'fix', ..., 'your-new-type']],

// 添加新的 scope
'scope-enum': [2, 'always', ['pet', 'user', ..., 'your-new-scope']],
```

修改后提交配置文件：
```bash
git add commitlint.config.js
git commit -m "chore(config): update commitlint rules"
```
