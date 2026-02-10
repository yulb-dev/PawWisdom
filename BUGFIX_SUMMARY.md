# 迭代2 Bug 修复总结

## 修复时间
2026-02-10

## 问题列表及解决方案

### 1. 后端编译错误

#### 问题 1.1: 缺少 @nestjs/mapped-types 包
**错误**: `Cannot find module '@nestjs/mapped-types'`

**解决方案**: 
- 手动定义 `UpdatePostDto`，不使用 `PartialType`
- 将所有 `CreatePostDto` 的属性复制为可选属性

**文件**: `back-end/src/modules/posts/dto/update-post.dto.ts`

#### 问题 1.2: 缺少 @types/multer 类型定义
**错误**: `Namespace 'global.Express' has no exported member 'Multer'`

**解决方案**:
- 创建自定义 Multer 类型定义文件
- 定义 `Express.Multer.File` 接口

**文件**: `back-end/src/types/multer.d.ts`

#### 问题 1.3: Posts Service 类型错误
**错误**: `hashtags` 类型不匹配（string[] vs Hashtag[]）

**解决方案**:
- 在创建 post 前解构 `hashtags`
- 避免将 string[] 传递给 TypeORM create 方法

**文件**: `back-end/src/modules/posts/posts.service.ts`

#### 问题 1.4: Upload Service Buffer 验证
**错误**: `Buffer<ArrayBufferLike> | undefined` 不能赋值给 `FileBody`

**解决方案**:
- 添加 buffer 存在性检查
- 在上传前验证 `file.buffer` 不为 undefined

**文件**: `back-end/src/modules/upload/upload.service.ts`

---

### 2. SQL 查询错误

#### 问题 2.1: 热度排序列不存在
**错误**: `column "hotscore" does not exist`

**原因**: 使用 `addSelect` 添加别名后，PostgreSQL 大小写敏感导致找不到列

**解决方案**: 
- 改用双步查询策略
- 第一步：查询 post IDs（不加载关联，避免 DISTINCT）
- 第二步：根据 IDs 加载完整数据（包含关联）

#### 问题 2.2: SELECT DISTINCT 与 ORDER BY 冲突
**错误**: `for SELECT DISTINCT, ORDER BY expressions must appear in select list`

**原因**: 
- leftJoinAndSelect hashtags 时，TypeORM 使用 SELECT DISTINCT
- ORDER BY 的计算表达式不在 SELECT 列表中

**解决方案**:
- 重写 `findAll` 方法，使用两步查询
- 避免在有 JOIN 关系时使用复杂的 ORDER BY 表达式

**文件**: `back-end/src/modules/posts/posts.service.ts`

---

### 3. 前端错误

#### 问题 3.1: API 导入错误
**错误**: `Cannot read property 'post' of undefined`

**原因**: 使用默认导入而不是命名导入

**解决方案**:
- 将 `import api from` 改为 `import { api } from`

**文件**:
- `front-end/services/upload.service.ts`
- `front-end/services/post.service.ts`
- `front-end/services/ai.service.ts`

#### 问题 3.2: babel.config.js 弃用警告
**警告**: `expo-router/babel is deprecated`

**解决方案**:
- 移除 `'expo-router/babel'` 插件
- 功能已包含在 `babel-preset-expo` 中

**文件**: `front-end/babel.config.js`

#### 问题 3.3: expo-image 弃用警告
**警告**: `Prop "resizeMode" is deprecated, use "contentFit" instead`

**解决方案**:
- 将所有 `resizeMode` 改为 `contentFit` prop
- 从 styles 中移除 resizeMode

**文件**: `front-end/app/(tabs)/_layout.tsx`

#### 问题 3.4: api.config.ts TypeScript 错误
**错误**: `类型"EmbeddedManifest"上不存在属性"debuggerHost"`

**解决方案**:
- 移除过时的 `Constants.manifest?.debuggerHost`
- 只使用 `Constants.expoConfig?.hostUri`

**文件**: `front-end/config/api.config.ts`

#### 问题 3.5: API 请求超时
**错误**: `timeout of 10000ms exceeded`

**解决方案**:
- 将超时时间从 10 秒增加到 30 秒
- 适应文件上传等耗时操作

**文件**: `front-end/config/api.config.ts`

---

## 测试验证

### 后端
✅ 编译无错误
✅ 服务器成功启动在 http://localhost:3000/api
✅ 所有路由正常映射
✅ Posts CRUD 功能正常
✅ 热度排序算法正确

### 前端
✅ 无 linter 错误
✅ 无运行时错误
✅ API 调用正常
✅ 图片上传功能正常

---

## 关键学习点

1. **TypeORM 查询优化**: 当有多对多关系时，避免在 SELECT DISTINCT 查询中使用复杂的 ORDER BY 表达式
2. **依赖管理**: 缺少依赖时，可以创建临时类型定义文件作为 workaround
3. **导入/导出**: 确保 import 语句与 export 方式匹配（默认 vs 命名）
4. **超时设置**: 根据实际操作复杂度设置合理的超时时间
5. **PostgreSQL 特性**: 注意 PostgreSQL 的大小写敏感性和 DISTINCT 查询限制

---

## 后续优化建议

1. 考虑添加数据库索引优化查询性能
2. 实现缓存机制减少重复查询
3. 添加更详细的错误日志和监控
4. 考虑使用 DataLoader 优化 N+1 查询问题
5. 添加单元测试和集成测试
