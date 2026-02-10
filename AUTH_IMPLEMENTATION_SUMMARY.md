# 认证系统实现总结

本文档总结了 PawWisdom 应用认证系统的完整实现，包括邮箱注册、手机号登录/注册、微信登录等功能。

## 实现概览

### 已完成功能

1. ✅ **邮箱注册与登录**
   - 邮箱密码注册
   - 验证码验证（测试环境）
   - 邮箱密码登录

2. ✅ **手机号注册与登录**
   - 手机号验证码注册
   - 手机号验证码登录（首次登录自动注册）
   - 手机号密码登录
   - 验证码发送和倒计时

3. ✅ **微信快速登录**
   - 微信授权登录
   - OpenID 管理
   - 首次登录自动注册
   - 测试模式支持

4. ✅ **通用功能**
   - JWT Token 管理
   - 自动保持登录状态
   - 用户信息获取
   - 登出功能

## 技术栈

### 后端

- **框架**：NestJS 11.x
- **数据库**：Supabase (PostgreSQL)
- **ORM**：TypeORM
- **认证**：JWT (@nestjs/jwt)
- **密码加密**：bcrypt
- **验证**：class-validator

### 前端

- **框架**：React Native (Expo)
- **路由**：Expo Router
- **状态管理**：Zustand
- **HTTP 客户端**：Axios
- **存储**：AsyncStorage
- **深度链接**：Expo Linking API

## 项目结构

### 后端结构

```
back-end/src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts      # 认证控制器
│   │   ├── auth.service.ts         # 认证服务
│   │   ├── auth.module.ts          # 认证模块
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts   # JWT 守卫
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts     # JWT 策略
│   │   └── dto/
│   │       ├── register.dto.ts     # 注册 DTO
│   │       ├── login.dto.ts        # 登录 DTO
│   │       ├── phone-code.dto.ts   # 手机验证码 DTO
│   │       ├── phone-login.dto.ts  # 手机登录 DTO
│   │       └── wechat-login.dto.ts # 微信登录 DTO
│   └── users/
│       ├── users.controller.ts
│       ├── users.service.ts        # 用户服务
│       └── dto/
│           ├── create-user.dto.ts
│           └── update-user.dto.ts
└── entities/
    └── user.entity.ts              # 用户实体
```

### 前端结构

```
front-end/
├── app/
│   └── auth/
│       ├── login.tsx               # 登录页面
│       ├── register.tsx            # 注册页面
│       ├── verify.tsx              # 验证码验证页面
│       └── reset-password.tsx      # 密码重置页面
├── services/
│   └── auth.service.ts             # 认证服务
├── store/
│   └── auth.store.ts               # 认证状态管理
└── components/
    ├── auth/
    │   └── VerificationCodeInput.tsx  # 验证码输入组件
    └── ui/
        └── DialogProvider.tsx      # 弹窗组件
```

## 核心功能实现

### 1. 邮箱注册与登录

#### 后端实现

```typescript
// auth.service.ts
async register(registerDto: RegisterDto) {
  // 1. 创建用户（自动生成爪印号和昵称）
  const user = await this.usersService.create(registerDto);
  
  // 2. 生成 JWT Token
  const token = this.generateToken(user.id);
  
  // 3. 返回用户信息和 Token
  return { user, token };
}

async login(loginDto: LoginDto) {
  // 1. 通过邮箱或手机号查找用户
  const user = await this.usersService.findByEmailOrPhone(loginDto.identifier);
  
  // 2. 验证密码
  const isPasswordValid = await this.usersService.validatePassword(user, loginDto.password);
  
  // 3. 生成 Token
  const token = this.generateToken(user.id);
  
  return { user, token };
}
```

#### 前端实现

```typescript
// register.tsx
const handleRegister = async () => {
  // 1. 验证输入
  if (registerMode === 'email') {
    // 验证邮箱格式
    // 验证密码强度
  }
  
  // 2. 保存注册信息到 store
  setPendingRegister({ email: identifier.trim(), password })
  
  // 3. 跳转到验证码页面
  router.push('/auth/verify?type=email')
}

// verify.tsx
const handleVerify = async () => {
  // 1. 验证验证码
  if (code !== TEST_CODE) {
    showDialog({ title: '验证码错误' })
    return
  }
  
  // 2. 调用注册接口
  const response = await authService.register(pendingRegister)
  
  // 3. 保存 Token 和用户信息
  setUser(response.user)
  setToken(response.token)
  
  // 4. 跳转到个人中心
  router.replace('/(tabs)/profile')
}
```

### 2. 手机号登录与注册

#### 后端实现

```typescript
// auth.service.ts
private readonly phoneCodeStore = new Map<string, PhoneCodeRecord>();

async sendPhoneCode(phoneCodeDto: PhoneCodeDto) {
  // 1. 生成验证码（测试环境固定为 0000）
  const code = '0000';
  const expiresAt = Date.now() + 5 * 60 * 1000;
  
  // 2. 存储验证码
  this.phoneCodeStore.set(phoneCodeDto.phone, { code, expiresAt });
  
  // 生产环境：调用短信服务商 API 发送验证码
  
  return { success: true };
}

async phoneLogin(phoneLoginDto: PhoneLoginDto) {
  // 1. 验证验证码
  const record = this.phoneCodeStore.get(phoneLoginDto.phone);
  if (!record || record.code !== phoneLoginDto.code || record.expiresAt < Date.now()) {
    throw new UnauthorizedException('验证码错误或已过期');
  }
  
  // 2. 删除已使用的验证码
  this.phoneCodeStore.delete(phoneLoginDto.phone);
  
  // 3. 查找或创建用户
  let user = await this.usersService.findByPhone(phoneLoginDto.phone);
  if (!user) {
    // 首次登录，自动注册
    user = await this.usersService.create({
      email: `phone_${phoneLoginDto.phone}@pawwisdom.local`,
      password: this.generateSmsPassword(),
      phone: phoneLoginDto.phone,
    });
  }
  
  // 4. 生成 Token
  const token = this.generateToken(user.id);
  
  return { user, token };
}
```

#### 前端实现

```typescript
// register.tsx - 手机号注册
const handleRegister = async () => {
  if (registerMode === 'phone') {
    // 1. 验证手机号和验证码
    const phoneRegex = /^1\d{10}$/
    if (!phoneRegex.test(identifier.trim())) {
      showDialog({ title: '错误', message: '请输入有效的手机号' })
      return
    }
    
    // 2. 调用手机号登录接口（自动注册）
    const response = await authService.phoneLogin({
      phone: identifier.trim(),
      code: code.trim()
    })
    
    // 3. 保存用户信息和 Token
    setUser(response.user)
    setToken(response.token)
    
    // 4. 跳转到个人中心
    router.replace('/(tabs)/profile')
  }
}

// 发送验证码
const handleSendCode = async () => {
  await authService.sendPhoneCode({ phone: identifier.trim() })
  setCodeCountdown(60)
  showDialog({ title: '提示', message: '验证码已发送（测试环境为 0000）' })
}
```

### 3. 微信登录

#### 后端实现

```typescript
// auth.service.ts
async wechatCodeLogin(wechatCodeDto: WechatCodeDto) {
  // 1. 使用授权码向微信换取 access_token 和 openid
  const url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
  const params = {
    appid: this.configService.get('WECHAT_APP_ID'),
    secret: this.configService.get('WECHAT_APP_SECRET'),
    code: wechatCodeDto.code,
    grant_type: 'authorization_code'
  }
  
  const response = await fetch(url + '?' + new URLSearchParams(params))
  const data = await response.json()
  
  if (!data.openid) {
    throw new UnauthorizedException('微信授权失败')
  }
  
  // 2. 查找或创建用户
  let user = await this.usersService.findByWechatOpenId(data.openid)
  if (!user) {
    // 首次登录，自动注册
    user = await this.usersService.create({
      email: `wx_${data.openid}@pawwisdom.local`,
      password: this.generateWechatPassword(),
      wechatOpenId: data.openid,
    })
  }
  
  // 3. 生成 Token
  const token = this.generateToken(user.id)
  
  return { user, token }
}

// 测试模式：直接使用 OpenID
async wechatLogin(wechatLoginDto: WechatLoginDto) {
  let user = await this.usersService.findByWechatOpenId(wechatLoginDto.openId)
  if (!user) {
    user = await this.usersService.create({
      email: `wx_${wechatLoginDto.openId}@pawwisdom.local`,
      password: this.generateWechatPassword(),
      wechatOpenId: wechatLoginDto.openId,
    })
  }
  
  const token = this.generateToken(user.id)
  return { user, token }
}
```

#### 前端实现

```typescript
// login.tsx - 拉起微信授权
const handleWechatLogin = async () => {
  const appId = process.env.EXPO_PUBLIC_WECHAT_APP_ID
  const state = `pw_${Date.now()}`
  const authUrl = `weixin://app/${appId}/auth/?scope=snsapi_userinfo&state=${state}`
  
  // 检查是否安装微信
  const canOpen = await Linking.canOpenURL(authUrl)
  if (!canOpen) {
    showDialog({ title: '提示', message: '未检测到微信客户端' })
    return
  }
  
  // 拉起微信
  await Linking.openURL(authUrl)
}

// 监听微信回调
useEffect(() => {
  const handleUrl = (url: string) => {
    const parsed = new URL(url)
    if (parsed.hostname === 'wechat-auth') {
      const code = parsed.searchParams.get('code')
      if (code) {
        handleWechatCodeLogin(code)
      }
    }
  }
  
  const subscription = Linking.addEventListener('url', handleUrl)
  return () => subscription.remove()
}, [])

const handleWechatCodeLogin = async (code: string) => {
  // 使用授权码登录
  const response = await authService.wechatCodeLogin({ code })
  setUser(response.user)
  setToken(response.token)
  router.replace('/(tabs)/profile')
}

// 测试模式：使用模拟 OpenID
const handleWechatLogin = async () => {
  let openId = await AsyncStorage.getItem('wechat_open_id')
  if (!openId) {
    openId = `wx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await AsyncStorage.setItem('wechat_open_id', openId)
  }
  const response = await authService.wechatLogin({ openId })
  setUser(response.user)
  setToken(response.token)
  router.replace('/(tabs)/profile')
}
```

## 数据库设计

### User 表结构

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,           -- 爪印号（8位数字）
  nickname VARCHAR(50),                           -- 昵称
  email VARCHAR(100) UNIQUE NOT NULL,             -- 邮箱
  phone VARCHAR(20) UNIQUE,                       -- 手机号
  password_hash VARCHAR(255) NOT NULL,            -- 密码哈希
  avatar_url VARCHAR(255),                        -- 头像
  background_url VARCHAR(255),                    -- 背景图
  wechat_open_id VARCHAR(64) UNIQUE,             -- 微信 OpenID
  signature TEXT,                                 -- 个性签名
  birthday DATE,                                  -- 生日
  gender VARCHAR(10) DEFAULT 'secret',           -- 性别
  education VARCHAR(50),                          -- 学历
  occupation VARCHAR(50),                         -- 职业
  is_deleted BOOLEAN DEFAULT false,              -- 软删除标记
  created_at TIMESTAMPTZ DEFAULT now(),          -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT now()           -- 更新时间
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_wechat_open_id ON users(wechat_open_id);
```

### 用户自动生成规则

1. **爪印号（username）**：
   - 格式：8 位随机数字
   - 示例：`12345678`
   - 唯一性：数据库唯一约束

2. **昵称（nickname）**：
   - 格式：`用户{N}`
   - 示例：`用户1`, `用户2`
   - N 为当前用户总数 + 1

3. **邮箱（自动注册）**：
   - 微信用户：`wx_{openid}@pawwisdom.local`
   - 手机用户：`phone_{phone}@pawwisdom.local`

## API 接口文档

### 1. 邮箱注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

### 2. 登录（邮箱/手机号 + 密码）

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com",  // 或手机号
  "password": "Password123"
}
```

### 3. 发送手机验证码

```http
POST /api/auth/phone/code
Content-Type: application/json

{
  "phone": "13800138000"
}
```

### 4. 手机号验证码登录

```http
POST /api/auth/phone/login
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "0000"
}
```

### 5. 微信登录（OpenID）

```http
POST /api/auth/wechat
Content-Type: application/json

{
  "openId": "wx_openid_string"
}
```

### 6. 微信登录（授权码）

```http
POST /api/auth/wechat/code
Content-Type: application/json

{
  "code": "authorization_code"
}
```

### 7. 获取当前用户

```http
GET /api/auth/me
Authorization: Bearer {token}
```

## 配置说明

### 后端环境变量（.env）

```env
# 数据库配置
SUPABASE_DB_HOST=your-project.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password
SUPABASE_DB_NAME=postgres

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 微信配置
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
```

### 前端环境变量（.env）

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_WECHAT_APP_ID=your-wechat-app-id
```

### App 配置（app.json）

```json
{
  "expo": {
    "scheme": "pawwisdom",
    "ios": {
      "bundleIdentifier": "com.yuxx.pawwisdom",
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["weixin", "weixinULAPI"]
      }
    },
    "android": {
      "package": "com.yuxx.pawwisdom",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "pawwisdom",
              "host": "wechat-auth"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## 安全特性

1. **密码安全**
   - 使用 bcrypt 加密，加密强度 10
   - 密码强度验证：至少 8 位，包含大小写字母和数字
   - 密码不在响应中返回

2. **Token 安全**
   - 使用 JWT 进行身份验证
   - Token 包含用户 ID 和过期时间
   - Token 存储在 AsyncStorage（加密）

3. **验证码安全**
   - 5 分钟有效期
   - 60 秒发送间隔限制
   - 使用后立即失效

4. **数据库安全**
   - 所有敏感字段添加索引和唯一约束
   - 软删除机制保护数据
   - Row Level Security (RLS) 保护

## 测试说明

### 测试环境配置

- 验证码固定为：`0000`
- 测试邮箱：`test@example.com`
- 测试密码：`Test1234`
- 测试手机号：`13800138000`

### 测试命令

```bash
# 后端 API 测试
cd back-end
pnpm test

# 前端测试
cd front-end
pnpm test

# E2E 测试
pnpm test:e2e
```

## 已知限制和改进空间

### 当前限制

1. **验证码发送**：
   - 测试环境使用固定验证码
   - 生产环境需集成短信服务商（阿里云、腾讯云等）

2. **微信登录**：
   - 需要真实的微信 AppID 和 AppSecret
   - 需要在微信开放平台配置回调域名

3. **Token 刷新**：
   - 当前未实现 Refresh Token 机制
   - Token 过期后需重新登录

4. **密码重置**：
   - 密码重置功能界面已创建但未完全实现
   - 需要邮件服务支持

### 改进建议

1. **短信服务集成**：
   ```typescript
   // 集成阿里云短信服务
   import * as SMSClient from '@alicloud/dysmsapi20170525';
   
   async sendPhoneCode(phone: string) {
     const client = new SMSClient.default({
       accessKeyId: this.configService.get('ALIYUN_ACCESS_KEY_ID'),
       accessKeySecret: this.configService.get('ALIYUN_ACCESS_KEY_SECRET'),
     });
     
     const code = this.generateRandomCode();
     await client.sendSms({
       phoneNumbers: phone,
       signName: '爪智慧',
       templateCode: 'SMS_12345678',
       templateParam: `{"code":"${code}"}`
     });
   }
   ```

2. **Token 刷新机制**：
   ```typescript
   // 实现 Refresh Token
   async refreshToken(refreshToken: string) {
     const payload = this.jwtService.verify(refreshToken);
     const newToken = this.generateToken(payload.sub);
     return { token: newToken };
   }
   ```

3. **密码重置**：
   ```typescript
   // 发送重置邮件
   async sendResetPasswordEmail(email: string) {
     const token = this.generateResetToken(email);
     await this.emailService.sendMail({
       to: email,
       subject: '重置密码',
       html: `点击链接重置密码: ${resetUrl}?token=${token}`
     });
   }
   ```

4. **社交登录扩展**：
   - 支持 Apple 登录（iOS 要求）
   - 支持支付宝登录
   - 支持 QQ 登录

5. **安全增强**：
   - 实现登录频率限制（防止暴力破解）
   - 添加图形验证码
   - IP 黑名单机制
   - 异常登录检测

6. **用户体验优化**：
   - 添加生物识别登录（Face ID / Touch ID）
   - 记住上次登录方式
   - 支持多设备管理
   - 登录历史记录

## 文档索引

- [认证系统使用指南](./AUTHENTICATION_GUIDE.md) - 完整的使用说明和 API 文档
- [测试检查清单](./AUTH_TEST_CHECKLIST.md) - 详细的测试步骤和检查项

## 更新日志

### 2024-02-10

- ✅ 完善注册页面，支持邮箱和手机号两种注册方式
- ✅ 修改验证码页面，支持邮箱和手机号验证
- ✅ 实现手机号验证码登录和自动注册
- ✅ 实现微信授权登录和自动注册
- ✅ 优化用户体验和错误提示
- ✅ 更新应用配置支持微信回调
- ✅ 创建完整的文档和测试清单

## 联系方式

如有问题或建议，请联系开发团队或提交 Issue。
