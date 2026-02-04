# 部署指南

本文档说明如何将 PawWisdom 应用部署到生产环境。

## 📋 部署架构

```
┌─────────────┐
│   前端      │
│ React Native│
│   (Expo)    │
└──────┬──────┘
       │
       ↓ HTTPS
┌──────────────┐
│   后端 API   │
│   (NestJS)   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   数据库     │
│ (Supabase)   │
└──────────────┘
```

## 🖥️ 后端部署

### 选项 1: Vercel (推荐)

#### 准备工作

1. 在项目根目录创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "back-end/src/main.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "back-end/src/main.ts"
    }
  ]
}
```

2. 安装 Vercel CLI：

```bash
npm install -g vercel
```

#### 部署步骤

```bash
cd back-end

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

#### 配置环境变量

在 Vercel Dashboard 中设置环境变量：

1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加所有 `.env` 中的变量

### 选项 2: Railway

#### 部署步骤

1. 访问 [Railway](https://railway.app)
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. 设置构建命令：

```bash
cd back-end && pnpm install && pnpm build
```

5. 设置启动命令：

```bash
cd back-end && pnpm start:prod
```

6. 配置环境变量

### 选项 3: 云服务器 (阿里云/腾讯云)

#### 服务器要求

- OS: Ubuntu 20.04+
- CPU: 2 核
- RAM: 4GB
- 存储: 20GB SSD

#### 部署步骤

1. **安装依赖**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2
```

2. **克隆代码**

```bash
cd /var/www
git clone <your-repo-url>
cd PawWisdom/back-end
```

3. **安装依赖并构建**

```bash
pnpm install
pnpm build
```

4. **配置环境变量**

```bash
cp .env.example .env
nano .env  # 编辑配置
```

5. **使用 PM2 启动**

```bash
pm2 start dist/main.js --name pawwisdom-api
pm2 save
pm2 startup
```

6. **配置 Nginx 反向代理**

```nginx
server {
    listen 80;
    server_name api.pawwisdom.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **配置 SSL (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.pawwisdom.com
```

## 📱 前端部署

### React Native App (iOS & Android)

#### 构建生产版本

1. **更新配置**

编辑 `front-end/app.json`:

```json
{
  "expo": {
    "name": "PawWisdom",
    "slug": "pawwisdom",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.pawwisdom",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.yourcompany.pawwisdom",
      "versionCode": 1
    }
  }
}
```

2. **更新 API 地址**

编辑 `front-end/.env`:

```env
EXPO_PUBLIC_API_URL=https://api.pawwisdom.com/api
```

3. **使用 EAS Build**

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo
eas login

# 配置构建
eas build:configure

# 构建 iOS
eas build --platform ios

# 构建 Android
eas build --platform android
```

4. **提交到应用商店**

- **iOS**: 使用 EAS Submit 或 App Store Connect
- **Android**: 使用 EAS Submit 或 Google Play Console

```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

### Web 版本部署

如果需要 Web 版本：

```bash
cd front-end
pnpm build:web

# 部署到 Vercel
vercel --prod

# 或部署到 Netlify
netlify deploy --prod
```

## 🗄️ 数据库配置

### 生产环境 Supabase 设置

1. 创建生产环境 Supabase 项目
2. 运行初始化脚本
3. 启用数据库备份（Pro 计划）
4. 配置连接池：
   - Max connections: 根据负载调整
   - 启用 SSL

### 数据库优化

```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_pets_owner_id ON pets(owner_id);

-- 启用查询优化
SET random_page_cost = 1.1;
SET effective_cache_size = '2GB';
```

## 🔒 安全配置

### 1. 环境变量

确保所有敏感信息存储在环境变量中：

```bash
# 生成强 JWT 密钥
openssl rand -base64 32
```

### 2. CORS 配置

在 `back-end/src/main.ts` 中：

```typescript
app.enableCors({
  origin: ['https://your-app.com', 'https://api.your-app.com'],
  credentials: true
})
```

### 3. Rate Limiting

安装并配置限流：

```bash
cd back-end
pnpm add @nestjs/throttler
```

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  {
    ttl: 60000,
    limit: 10
  }
])
```

### 4. Helmet 安全头

```bash
cd back-end
pnpm add helmet
```

```typescript
// main.ts
import helmet from 'helmet'
app.use(helmet())
```

## 📊 监控与日志

### 应用监控

推荐使用：

- **Sentry**: 错误追踪
- **LogRocket**: 用户会话重放
- **DataDog**: 全栈监控

### 配置 Sentry

```bash
cd back-end
pnpm add @sentry/node
```

```typescript
// main.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

### 日志管理

使用 PM2 日志：

```bash
# 查看日志
pm2 logs pawwisdom-api

# 日志轮转
pm2 install pm2-logrotate
```

## 🔄 CI/CD 配置

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Install dependencies
        run: cd back-end && pnpm install
      - name: Build
        run: cd back-end && pnpm build
      - name: Deploy to production
        run: |
          # 你的部署脚本
```

## 🧪 生产环境测试

部署后运行健康检查：

```bash
# 测试后端 API
curl https://api.pawwisdom.com/api/health

# 测试数据库连接
curl https://api.pawwisdom.com/api/health/db
```

## 📈 性能优化

### 1. 启用压缩

```typescript
// main.ts
import compression from 'compression'
app.use(compression())
```

### 2. 配置缓存

使用 Redis 缓存：

```bash
pnpm add @nestjs/cache-manager cache-manager
```

### 3. CDN 配置

使用 CDN 加速静态资源：

- 图片、视频使用 Supabase Storage + CDN
- 前端静态资源使用 Vercel CDN

## 🔧 运维命令

```bash
# 重启应用
pm2 restart pawwisdom-api

# 查看状态
pm2 status

# 查看监控
pm2 monit

# 零停机重载
pm2 reload pawwisdom-api

# 查看日志
pm2 logs pawwisdom-api --lines 100
```

## 📞 故障排查

### 常见问题

1. **数据库连接失败**

   - 检查 Supabase 项目状态
   - 验证环境变量
   - 检查网络连接

2. **API 响应慢**

   - 检查数据库查询
   - 启用缓存
   - 增加服务器资源

3. **内存泄漏**
   - 使用 PM2 监控内存
   - 检查未关闭的连接
   - 配置自动重启

## ✅ 部署检查清单

- [ ] 生产环境变量已配置
- [ ] 数据库已初始化
- [ ] SSL 证书已配置
- [ ] CORS 正确配置
- [ ] 安全头已启用
- [ ] 限流已配置
- [ ] 监控已设置
- [ ] 日志已配置
- [ ] 备份策略已实施
- [ ] CI/CD 已配置
- [ ] 健康检查通过
- [ ] 性能测试通过

---

**更新时间**: 2026-02 | **版本**: v1.0
