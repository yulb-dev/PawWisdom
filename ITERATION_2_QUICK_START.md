# 迭代 2 快速启动指南

## 📦 安装依赖

如果还没有安装依赖，请运行：

```bash
# 在项目根目录
pnpm install
```

## 🗄️ 数据库设置

### 1. 运行数据库迁移

在 Supabase SQL Editor 中执行以下SQL文件：

```sql
-- 如果还没有运行过基础迁移
-- 先运行：back-end/database/init.sql

-- 然后运行迭代2的迁移
-- 文件：back-end/database/iteration2-posts.sql
```

### 2. 创建 Supabase Storage Bucket

Bucket会在首次启动后端时自动创建，名称为 `pet-media`。

或者手动创建：
1. 进入 Supabase Dashboard
2. 选择 Storage
3. 创建新bucket: `pet-media`
4. 设置为 Public

## 🔧 配置环境变量

### 后端配置

在 `back-end/.env` 文件中添加AI服务配置：

```env
# AI Service Configuration
AI_PROVIDER=baidu
BAIDU_AI_API_KEY=your-baidu-api-key
BAIDU_AI_SECRET_KEY=your-baidu-secret-key
```

**注意：** 如果不配置AI服务，系统会自动使用模拟数据。

### 获取百度AI API Key

1. 访问 [百度AI开放平台](https://ai.baidu.com/)
2. 注册/登录账号
3. 创建应用
4. 获取 API Key 和 Secret Key
5. 复制到 .env 文件

## 🚀 启动项目

### 启动后端

```bash
cd back-end
pnpm run start:dev
```

后端将运行在: `http://localhost:3000`

### 启动前端

```bash
cd front-end
pnpm run start
```

选择你的运行平台：
- 按 `i` 打开 iOS 模拟器
- 按 `a` 打开 Android 模拟器
- 按 `w` 在浏览器中打开

## 🧪 测试迭代2功能

### 1. AI情绪识别

1. 登录应用
2. 在首页点击右上角的**相机图标**
3. 选择或拍摄宠物照片
4. 点击"开始分析"
5. 查看AI情绪识别结果
6. 点击"发布动态"

### 2. 发布动态

方式1：通过AI情绪识别流程
- 分析完成后直接发布

方式2：直接创建
1. 进入"创建"标签页
2. 输入动态内容
3. 选择图片（最多9张）
4. 添加话题标签
5. 点击"发布"

### 3. 浏览动态流

1. 进入"首页"标签页
2. 查看推荐动态
3. 下拉刷新获取最新动态
4. 点击动态卡片查看详情
5. 点赞/评论/分享（功能完整实现在迭代3）

## 📝 新增API端点

### 文件上传

```bash
# 上传单个文件
POST /api/upload/file?folder=posts
Content-Type: multipart/form-data
Body: { file: File }

# 批量上传文件
POST /api/upload/files?folder=posts
Content-Type: multipart/form-data
Body: { files: File[] }
```

### AI情绪识别

```bash
# 分析宠物情绪
POST /api/ai/analyze-emotion
Body: {
  "imageUrl": "https://...",
  "petId": "uuid" (可选)
}
```

### 动态管理

```bash
# 创建动态
POST /api/posts
Body: {
  "content": "动态内容",
  "mediaUrls": ["url1", "url2"],
  "hashtags": ["萌宠", "开心"],
  "aiAnalysis": { ... }
}

# 查询动态列表
GET /api/posts?page=1&limit=20&sortBy=latest

# 推荐动态流
GET /api/posts/feed/recommended?page=1&limit=20

# 查询单个动态
GET /api/posts/:id

# 点赞动态
POST /api/posts/:id/like

# 取消点赞
DELETE /api/posts/:id/like
```

## 🎨 UI设计参考

本迭代的UI设计参考了您提供的设计图，包括：
- 现代化的卡片式布局
- 清晰的信息层级
- 友好的交互反馈
- 美观的情绪标签

## ⚠️ 注意事项

### AI服务

- 百度AI API需要实名认证
- 有免费调用额度限制
- 未配置时会使用模拟数据
- 模拟数据适用于开发和演示

### 文件上传

- 单个文件最大10MB
- 支持格式：JPG, PNG, GIF, WEBP, MP4, MOV
- 批量上传最多9个文件

### 性能建议

- 使用图片压缩减少上传时间
- 动态流支持分页加载
- 首次加载会创建Storage Bucket（需要几秒）

## 🐛 常见问题

### Q: 图片上传失败

A: 检查：
1. Supabase Storage配置是否正确
2. Bucket是否存在且为Public
3. 文件大小是否超过限制
4. 网络连接是否正常

### Q: AI分析一直显示"分析中"

A: 可能原因：
1. 百度API配置错误
2. 网络问题
3. API额度用尽

解决：检查后端日志，系统会自动降级到模拟数据

### Q: 动态流为空

A: 确保：
1. 已运行数据库迁移
2. 已发布至少一条动态
3. 后端服务正常运行

## 📖 相关文档

- [迭代2完成总结](./ITERATION_2_SUMMARY.md)
- [后端API文档](./back-end/README.md)
- [前端开发指南](./front-end/README.md)
- [数据库设置指南](./DATABASE_SETUP.md)

## 🎉 开始使用

现在你已经准备好体验迭代2的所有功能了！祝使用愉快！

有任何问题，请查看文档或提交Issue。
