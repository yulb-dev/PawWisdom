# 认证系统使用指南

本指南介绍 PawWisdom 应用的完整认证系统，包括邮箱注册、手机号登录/注册、微信登录等功能。

## 目录

- [功能概览](#功能概览)
- [邮箱注册与登录](#邮箱注册与登录)
- [手机号登录与注册](#手机号登录与注册)
- [微信登录](#微信登录)
- [配置说明](#配置说明)
- [API 接口](#api-接口)
- [测试说明](#测试说明)

## 功能概览

PawWisdom 支持以下认证方式：

1. **邮箱注册/登录**：传统的邮箱密码方式
2. **手机号验证码登录**：支持验证码登录，首次登录自动注册
3. **微信快速登录**：使用微信授权登录，首次登录自动注册

所有认证方式均使用 JWT Token 进行会话管理。

## 邮箱注册与登录

### 注册流程

1. 用户在注册页面选择"邮箱注册"
2. 输入邮箱和密码（密码需包含大小写字母和数字，至少 8 位）
3. 点击"注册"按钮
4. 进入验证码页面，输入 4 位验证码（测试环境默认：`0000`）
5. 验证成功后自动登录并跳转到个人中心

### 登录流程

1. 在登录页面输入邮箱和密码
2. 点击"登录"按钮
3. 验证成功后跳转到个人中心

### 密码规则

- 至少 8 个字符
- 必须包含至少一个小写字母
- 必须包含至少一个大写字母
- 必须包含至少一个数字

示例有效密码：`Password123`

## 手机号登录与注册

### 注册流程

1. 在注册页面选择"手机号注册"
2. 输入 11 位手机号
3. 点击"获取验证码"按钮
4. 输入收到的 4 位验证码（测试环境默认：`0000`）
5. 点击"注册"按钮
6. 系统自动完成注册并登录

### 登录流程（两种方式）

#### 方式 1：验证码登录

1. 在登录页面输入手机号
2. 系统自动识别为手机号，显示"密码登录"和"验证码登录"切换按钮
3. 选择"验证码登录"
4. 点击"获取验证码"
5. 输入验证码并登录
6. 如果是新用户，系统自动注册

#### 方式 2：密码登录

1. 在登录页面输入手机号
2. 选择"密码登录"
3. 输入密码
4. 点击"登录"按钮

### 验证码说明

- 验证码有效期：5 分钟
- 同一手机号 60 秒内只能发送一次验证码
- 测试环境固定验证码：`0000`
- 生产环境需配置短信服务商（阿里云、腾讯云等）

### 手机号格式

- 必须是 11 位数字
- 必须以 1 开头
- 示例：`13812345678`

## 微信登录

### 功能说明

微信登录采用微信 OAuth 2.0 授权机制，用户通过微信授权后即可完成登录。首次使用微信登录会自动创建账号。

### 登录流程

1. 在登录或注册页面点击"微信登录"按钮
2. 应用拉起微信客户端
3. 用户在微信中确认授权
4. 微信回调应用并传递授权码
5. 应用使用授权码获取用户 OpenID
6. 系统查找或创建用户账号
7. 自动登录并跳转到个人中心

### 实现方式

#### 前端实现

```typescript
// 拉起微信授权
const handleWechatLogin = async () => {
  const appId = process.env.EXPO_PUBLIC_WECHAT_APP_ID
  const state = `pw_${Date.now()}`
  const authUrl = `weixin://app/${appId}/auth/?scope=snsapi_userinfo&state=${state}`

  const canOpen = await Linking.canOpenURL(authUrl)
  if (canOpen) {
    await Linking.openURL(authUrl)
  }
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
```

#### 后端实现

```typescript
async wechatCodeLogin(wechatCodeDto: WechatCodeDto) {
  // 1. 使用授权码向微信换取 access_token 和 openid
  const url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
  const params = {
    appid: WECHAT_APP_ID,
    secret: WECHAT_APP_SECRET,
    code: wechatCodeDto.code,
    grant_type: 'authorization_code'
  }

  const response = await fetch(url + '?' + new URLSearchParams(params))
  const data = await response.json()

  // 2. 查找或创建用户
  let user = await this.usersService.findByWechatOpenId(data.openid)
  if (!user) {
    // 首次登录，自动注册
    user = await this.usersService.create({
      email: `wx_${data.openid}@pawwisdom.local`,
      password: this.generateWechatPassword(),
      wechatOpenId: data.openid
    })
  }

  // 3. 生成 JWT Token
  const token = this.generateToken(user.id)
  return { user, token }
}
```

### 测试模式

开发环境下，可以使用模拟的 OpenID 进行测试：

```typescript
// 模拟微信登录（仅用于测试）
const handleWechatLogin = async () => {
  let openId = await AsyncStorage.getItem('wechat_open_id')
  if (!openId) {
    openId = `wx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await AsyncStorage.setItem('wechat_open_id', openId)
  }
  const response = await authService.wechatLogin({ openId })
  // 登录成功
}
```

## 配置说明

### 后端配置

在 `back-end/.env` 文件中配置：

```env
# 微信配置
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret

# JWT 配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 前端配置

在 `front-end/.env` 文件中配置：

```env
EXPO_PUBLIC_API_URL=http://your-backend-url/api
EXPO_PUBLIC_WECHAT_APP_ID=your-wechat-app-id
```

### 微信开放平台配置

1. 在 [微信开放平台](https://open.weixin.qq.com/) 注册账号
2. 创建移动应用
3. 获取 AppID 和 AppSecret
4. 配置授权回调域名
5. 在应用的 `app.json` 中配置 URL Scheme：

```json
{
  "expo": {
    "scheme": "pawwisdom",
    "ios": {
      "bundleIdentifier": "com.yourcompany.pawwisdom"
    },
    "android": {
      "package": "com.yourcompany.pawwisdom"
    }
  }
}
```

## API 接口

### 邮箱注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

响应：

```json
{
  "user": {
    "id": "uuid",
    "username": "12345678",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 邮箱/手机号密码登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com", // 或手机号
  "password": "Password123"
}
```

### 发送手机验证码

```http
POST /api/auth/phone/code
Content-Type: application/json

{
  "phone": "13812345678"
}
```

响应：

```json
{
  "success": true
}
```

### 手机号验证码登录

```http
POST /api/auth/phone/login
Content-Type: application/json

{
  "phone": "13812345678",
  "code": "0000"
}
```

响应：

```json
{
  "user": {
    "id": "uuid",
    "username": "12345678",
    "phone": "13812345678",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 微信登录（直接 OpenID）

```http
POST /api/auth/wechat
Content-Type: application/json

{
  "openId": "wx_openid_string"
}
```

### 微信登录（授权码）

```http
POST /api/auth/wechat/code
Content-Type: application/json

{
  "code": "authorization_code_from_wechat"
}
```

### 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer {token}
```

响应：

```json
{
  "id": "uuid",
  "username": "12345678",
  "nickname": "用户昵称",
  "email": "user@example.com",
  "phone": "13812345678",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 测试说明

### 测试账号

开发环境可以使用以下测试数据：

- **邮箱验证码**：`0000`
- **手机验证码**：`0000`
- **测试邮箱**：`test@example.com`
- **测试密码**：`Test1234`
- **测试手机号**：`13800138000`

### 测试流程

#### 1. 邮箱注册测试

```bash
# 1. 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# 2. 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"Test1234"}'
```

#### 2. 手机号登录测试

```bash
# 1. 发送验证码
curl -X POST http://localhost:3000/api/auth/phone/code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

# 2. 验证码登录
curl -X POST http://localhost:3000/api/auth/phone/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"0000"}'
```

#### 3. 微信登录测试

```bash
# 使用模拟 OpenID
curl -X POST http://localhost:3000/api/auth/wechat \
  -H "Content-Type: application/json" \
  -d '{"openId":"wx_test_openid_123"}'
```

### 前端测试

在 React Native 应用中测试：

1. 启动后端服务：`cd back-end && pnpm run start:dev`
2. 启动前端应用：`cd front-end && pnpm run start`
3. 在模拟器或真机上测试各种登录方式

### 注意事项

1. **验证码过期时间**：5 分钟
2. **Token 过期时间**：默认 7 天
3. **密码加密**：使用 bcrypt，加密强度为 10
4. **手机号格式**：仅支持中国大陆手机号（11 位，1 开头）
5. **邮箱格式**：标准邮箱格式验证
6. **微信授权**：需要真实的微信 AppID 和 AppSecret

## 安全建议

1. **生产环境配置**：
   - 使用强密码作为 JWT_SECRET
   - 启用 HTTPS
   - 配置 CORS 白名单
   - 启用速率限制（防止暴力破解）

2. **短信服务商集成**：
   - 推荐使用阿里云短信服务或腾讯云短信服务
   - 配置短信签名和模板
   - 添加发送频率限制
   - 记录发送日志

3. **微信安全**：
   - 妥善保管 AppSecret
   - 验证 state 参数防止 CSRF
   - 校验授权回调来源

4. **数据库安全**：
   - 用户表启用 Row Level Security (RLS)
   - 敏感字段加密存储
   - 定期备份数据

## 常见问题

### Q: 验证码收不到怎么办？

A: 开发环境使用固定验证码 `0000`。生产环境需要配置短信服务商。

### Q: 微信登录拉不起微信客户端？

A: 检查以下配置：
- 是否安装了微信客户端
- AppID 是否正确
- URL Scheme 是否配置正确

### Q: Token 过期后如何处理？

A: 前端检测到 401 错误时，清除本地 Token，跳转到登录页面。建议实现 Token 刷新机制。

### Q: 如何实现记住登录状态？

A: Token 存储在 AsyncStorage 中，应用启动时自动读取并验证。

### Q: 如何实现退出登录？

A: 调用 `authService.logout()` 清除本地 Token，然后跳转到登录页面。

## 更新日志

- **2024-02-10**：完善微信登录和手机号登录/注册功能
- **2024-02-10**：支持注册页面的邮箱和手机号切换
- **2024-02-10**：优化验证码输入体验

## 技术支持

如有问题，请联系技术团队或提交 Issue。
