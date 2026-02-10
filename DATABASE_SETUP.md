# 数据库配置指南

本文档详细说明如何在 Supabase 中设置 PawWisdom 数据库。

## 📋 前置要求

- 有效的 Supabase 账号
- 浏览器访问 Supabase Dashboard

## 🚀 设置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：

   - **Name**: PawWisdom (或你喜欢的名称)
   - **Database Password**: 生成强密码并保存
   - **Region**: 选择最近的区域（建议：Singapore 或 Tokyo）
   - **Pricing Plan**: 选择 Free 或根据需求选择

4. 点击 "Create new project" 并等待项目初始化（约 1-2 分钟）

### 2. 获取数据库连接信息

项目创建完成后：

1. 在左侧菜单选择 "Project Settings" → "Database"
2. 记录以下信息：

```
Host: db.xxxxxxxxxxxxx.supabase.co
Port: 5432
Database name: postgres
User: postgres
Password: [你在创建项目时设置的密码]
```

### 3. 运行数据库初始化脚本

1. 在 Supabase Dashboard 左侧菜单选择 "SQL Editor"
2. 点击 "New query"
3. 复制 `back-end/database/init.sql` 文件的全部内容
4. 粘贴到 SQL 编辑器中
5. 点击 "Run" 执行脚本

脚本将创建以下内容：

- ✅ 用户表 (users)
- ✅ 宠物表 (pets)
- ✅ 会话表 (user_sessions)
- ✅ 所有必要的索引
- ✅ 自动更新时间戳的触发器
- ✅ Row Level Security (RLS) 策略

### 4. 验证数据库设置

在 SQL Editor 中运行以下查询验证表已创建：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
```

应该看到：

- users
- pets
- user_sessions

### 5. 获取 Supabase API 密钥

1. 在左侧菜单选择 "Project Settings" → "API"
2. 记录以下信息：

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbG...
service_role key: eyJhbG... (谨慎保管，不要提交到版本控制)
```

### 6. 配置后端环境变量

将获取的信息填入 `back-end/.env` 文件：

```env
# Supabase Database Configuration
SUPABASE_DB_HOST=db.xxxxxxxxxxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=你的数据库密码
SUPABASE_DB_NAME=postgres

# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

### 7. 测试数据库连接

启动后端服务测试连接：

```bash
cd back-end
pnpm start:dev
```

如果看到以下信息表示连接成功：

```
[Nest] LOG  Application is running on: http://localhost:3000/api
```

## 🔒 安全配置

### Row Level Security (RLS)

初始化脚本已自动启用 RLS。确保以下策略已生效：

#### Users 表策略

- 用户只能查看和更新自己的数据

#### Pets 表策略

- 用户只能查看、创建、更新和删除自己的宠物

#### User Sessions 表策略

- 用户只能管理自己的会话

### 网络安全

1. 在 Supabase Dashboard 中进入 "Project Settings" → "Database"
2. 滚动到 "Connection Pooling" 部分
3. 确保启用了 SSL 连接

## 📊 数据库管理

### 查看表结构

在 SQL Editor 中运行：

```sql
-- 查看 users 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';

-- 查看所有索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';
```

### 备份数据库

Supabase 提供自动备份功能（Pro 计划及以上）。

手动备份：

1. 在 Dashboard 中进入 "Database" → "Backups"
2. 点击 "Download backup"

### 监控数据库

1. 在 Dashboard 中进入 "Database" → "Logs"
2. 查看查询日志和性能指标
3. 在 "Reports" 中查看使用统计

## ❓ 常见问题

### 无法连接到数据库

1. 检查 `.env` 文件中的配置是否正确
2. 确认 Supabase 项目状态是否为 "Active"
3. 检查网络连接
4. 验证数据库密码是否正确

### RLS 策略问题

如果遇到权限错误：

1. 确认 RLS 策略已正确创建
2. 检查 JWT token 是否有效
3. 在开发环境可以临时禁用 RLS：

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
```

⚠️ **注意**: 生产环境必须启用 RLS！

### 性能优化

如果查询较慢：

1. 检查是否缺少索引
2. 分析查询计划：

```sql
EXPLAIN ANALYZE
SELECT * FROM pets WHERE owner_id = 'xxx';
```

3. 在必要的列上添加索引：

```sql
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
```

## 🔄 数据迁移

### 添加新表或字段

1. 创建新的 SQL 迁移文件
2. 在 SQL Editor 中执行
3. 更新对应的 TypeORM 实体

示例：添加新字段

```sql
ALTER TABLE pets
ADD COLUMN description TEXT;
```

### 回滚更改

Supabase 支持时间点恢复（Pro 计划）：

1. 进入 "Database" → "Backups"
2. 选择恢复点
3. 创建新分支或恢复到主分支

## 📚 额外资源

- [Supabase 文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [TypeORM 文档](https://typeorm.io/)

## 💡 最佳实践

1. **定期备份**: 在进行重大更改前备份数据库
2. **使用迁移**: 通过迁移文件管理数据库结构变更
3. **监控性能**: 定期检查慢查询
4. **安全第一**: 始终启用 RLS 并使用强密码
5. **环境分离**: 开发和生产使用不同的 Supabase 项目

---

**更新时间**: 2026-02 | **版本**: v1.0
