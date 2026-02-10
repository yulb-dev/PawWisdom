# 🚀 快速启动指南

5 分钟内启动 PawWisdom 开发环境！

## ✅ 前置检查

确保你已安装：

- ✓ Node.js 18+ (`node --version`)
- ✓ pnpm 8+ (`pnpm --version`)
- ✓ Expo CLI (`npx expo --version`)
- ✓ Git (`git --version`)

## 📦 步骤 1: 安装依赖

```bash
# 克隆项目
git clone <your-repo-url>
cd PawWisdom

# 安装所有依赖
pnpm install
```

## 🗄️ 步骤 2: 配置 Supabase 数据库

### 2.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)，登录或注册
2. 点击 "New Project"
3. 填写信息并**记录数据库密码**
4. 等待项目创建（约 1-2 分钟）

### 2.2 初始化数据库

1. 在 Supabase Dashboard 中打开 "SQL Editor"
2. 点击 "New query"
3. 复制并粘贴 `back-end/database/init.sql` 的内容
4. 点击 "Run" 执行

### 2.3 获取连接信息

在 "Project Settings" → "Database" 中获取：

- Host
- Database name
- User
- Password (之前记录的)

在 "Project Settings" → "API" 中获取：

- Project URL
- anon public key
- service_role key

## ⚙️ 步骤 3: 配置环境变量

### 后端配置

```bash
cd back-end
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
PORT=3000
NODE_ENV=development

SUPABASE_DB_HOST=db.xxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=你的数据库密码
SUPABASE_DB_NAME=postgres

JWT_SECRET=随机生成一个长字符串
JWT_EXPIRES_IN=7d

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

### 前端配置

```bash
cd ../front-end
cp .env.example .env
```

编辑 `.env` 文件：

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 🎬 步骤 4: 启动应用

### 启动后端

```bash
# 在项目根目录
pnpm dev:backend

# 看到以下信息表示成功：
# Application is running on: http://localhost:3000/api
```

### 启动前端（新终端）

```bash
# 在项目根目录
pnpm dev:frontend

# 或者分别启动
cd front-end
pnpm start
```

然后：

- 扫描二维码在 Expo Go 中打开
- 按 `i` 打开 iOS 模拟器
- 按 `a` 打开 Android 模拟器
- 按 `w` 在浏览器中打开

## 🧪 步骤 5: 测试

### 测试后端 API

访问 http://localhost:3000/api

你应该能看到响应。

### 测试完整流程

1. 在前端应用中点击 "Register"
2. 填写注册信息（用户名、邮箱、密码）
3. 注册成功后自动跳转到个人中心
4. 点击 "Pets" Tab
5. 添加你的第一只宠物

## ❓ 常见问题

### 后端无法启动

```bash
# 检查端口是否被占用
lsof -i :3000

# 如果被占用，杀死进程或更改端口
kill -9 $(lsof -ti:3000)
```

### 前端无法连接后端

1. 确认后端已启动
2. 检查 `front-end/.env` 中的 API_URL
3. 如果使用真机测试，将 `localhost` 改为你的局域网 IP：
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api
   ```

### 数据库连接失败

1. 检查 Supabase 项目是否在运行
2. 验证 `.env` 中的数据库配置
3. 确认密码正确（没有多余空格）

### Expo Go 无法扫描二维码

1. 确保手机和电脑在同一网络
2. 尝试使用 Tunnel 模式：`pnpm start --tunnel`
3. 或使用模拟器代替真机测试

## 📚 下一步

现在你已经成功启动了 PawWisdom！

推荐阅读：

- [完整 README](./README.md) - 了解项目完整功能
- [API 文档](./back-end/README.md) - 后端 API 详细说明
- [数据库配置](./DATABASE_SETUP.md) - 深入了解数据库设置
- [部署指南](./DEPLOYMENT.md) - 如何部署到生产环境

## 🎯 功能测试清单

- [ ] 用户注册
- [ ] 用户登录
- [ ] 查看个人资料
- [ ] 添加宠物
- [ ] 编辑宠物信息
- [ ] 删除宠物
- [ ] 退出登录

全部通过？恭喜！你已经完成了迭代 1 的所有功能！

## 💡 开发技巧

### 热重载

- 后端修改会自动重启
- 前端修改会自动刷新

### 调试

```bash
# 后端调试
cd back-end
pnpm start:debug

# 然后在 VS Code 中附加调试器
```

### 查看日志

```bash
# 后端日志在终端中直接显示
# 前端日志在 Expo Dev Tools 中查看
```

---

遇到问题？查看 [故障排查指南](./TROUBLESHOOTING.md) 或提交 Issue。

**祝开发愉快！** 🐾
