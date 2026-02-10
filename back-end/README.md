# PawWisdom Backend

基于 NestJS 的 PawWisdom 后端服务，使用 Supabase 作为数据库。

## 技术栈

- **框架**: NestJS 11
- **数据库**: Supabase (PostgreSQL)
- **ORM**: TypeORM
- **认证**: JWT (Passport)
- **语言**: TypeScript

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

配置项说明：

- `SUPABASE_DB_HOST`: Supabase 数据库主机地址
- `SUPABASE_DB_PORT`: 数据库端口（默认 5432）
- `SUPABASE_DB_USER`: 数据库用户名（默认 postgres）
- `SUPABASE_DB_PASSWORD`: 数据库密码
- `SUPABASE_DB_NAME`: 数据库名称（默认 postgres）
- `JWT_SECRET`: JWT 密钥（生产环境请使用强密码）
- `JWT_EXPIRES_IN`: JWT 过期时间（默认 7d）

### 3. 初始化数据库

在 Supabase 控制台的 SQL Editor 中运行 `database/init.sql` 脚本。

### 4. 启动开发服务器

```bash
pnpm start:dev
```

服务器将在 `http://localhost:3000/api` 启动。

## API 文档

### 认证相关

#### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "phone": "string (optional)",
  "password": "string (min 6 chars)"
}
```

#### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "email or phone",
  "password": "string"
}
```

#### 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer {token}
```

### 用户相关

#### 获取用户资料（包含宠物列表）

```http
GET /api/users/profile
Authorization: Bearer {token}
```

#### 更新用户资料

```http
PATCH /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "string (optional)",
  "phone": "string (optional)",
  "avatarUrl": "string (optional)"
}
```

#### 删除用户账号（软删除）

```http
DELETE /api/users/profile
Authorization: Bearer {token}
```

### 宠物相关

#### 创建宠物档案

```http
POST /api/pets
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "species": "cat | dog | other",
  "breed": "string (optional)",
  "birthday": "YYYY-MM-DD (optional)",
  "gender": "male | female | unknown (optional)",
  "weight": number (optional),
  "avatarUrl": "string (optional)"
}
```

#### 获取我的宠物列表

```http
GET /api/pets
Authorization: Bearer {token}
```

#### 获取单个宠物信息

```http
GET /api/pets/:id
Authorization: Bearer {token}
```

#### 获取指定用户的宠物列表

```http
GET /api/pets/user/:userId
Authorization: Bearer {token}
```

#### 更新宠物信息

```http
PATCH /api/pets/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string (optional)",
  "species": "cat | dog | other (optional)",
  "breed": "string (optional)",
  "birthday": "YYYY-MM-DD (optional)",
  "gender": "male | female | unknown (optional)",
  "weight": number (optional)",
  "avatarUrl": "string (optional)"
}
```

#### 删除宠物档案（软删除）

```http
DELETE /api/pets/:id
Authorization: Bearer {token}
```

## 项目结构

```
src/
├── config/               # 配置文件
│   ├── database.config.ts
│   └── supabase.config.ts
├── entities/            # TypeORM 实体
│   ├── user.entity.ts
│   ├── pet.entity.ts
│   └── user-session.entity.ts
├── common/              # 共享资源
│   └── enums/
│       └── pet.enum.ts
├── modules/             # 功能模块
│   ├── auth/           # 认证模块
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/          # 用户模块
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── pets/           # 宠物模块
│       ├── dto/
│       ├── pets.controller.ts
│       ├── pets.service.ts
│       └── pets.module.ts
├── app.module.ts
└── main.ts
```

## 开发命令

```bash
# 开发模式
pnpm start:dev

# 生产构建
pnpm build

# 启动生产服务
pnpm start:prod

# 代码检查
pnpm lint

# 运行测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e
```

## 数据库管理

### 查看数据库连接

```bash
# 使用 TypeORM CLI
pnpm typeorm schema:log
```

### 生成迁移文件

```bash
pnpm typeorm migration:generate -- -n MigrationName
```

### 运行迁移

```bash
pnpm typeorm migration:run
```

### 回滚迁移

```bash
pnpm typeorm migration:revert
```

## 安全注意事项

1. **环境变量**: 永远不要提交 `.env` 文件到版本控制
2. **JWT 密钥**: 在生产环境使用强随机密钥
3. **数据库密码**: 使用 Supabase 提供的强密码
4. **CORS**: 在生产环境配置正确的 CORS 策略
5. **RLS**: 确保 Supabase Row Level Security 已正确配置

## 常见问题

### 数据库连接失败

1. 检查 Supabase 数据库是否正在运行
2. 确认 `.env` 中的数据库配置正确
3. 检查 IP 是否已添加到 Supabase 白名单

### JWT 认证失败

1. 确认 `JWT_SECRET` 已正确配置
2. 检查 token 是否已过期
3. 确认请求头格式：`Authorization: Bearer {token}`

## 许可证

Private - PawWisdom Team
