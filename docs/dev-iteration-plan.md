# PawWisdom 开发迭代规划

## 迭代总览

| 迭代版本 | 主题 | 周期 | 核心目标 |
| --- | --- | --- | --- |
| 迭代1 | 基础框架与用户系统 | 2周 | 搭建基础架构，实现用户注册、登录、宠物档案管理 |
| 迭代2 | AI情绪识别与动态发布 | 3周 | 集成AI情绪识别，实现动态发布流程 |
| 迭代3 | 社区互动与信息流 | 2周 | 实现社区动态流、点赞评论、关注功能 |
| 迭代4 | 健康自查与手账 | 2周 | 实现AI健康自查、健康手账基础功能 |
| 迭代5 | 优化与扩展功能 | 2周 | 同城功能、通知提醒、性能优化 |

---

## 迭代1：基础框架与用户系统

### 目标

搭建项目基础架构，实现用户注册登录、宠物档案创建与管理。

### 功能点

1.  **用户注册与登录**
    
    *   手机号/邮箱注册
        
    *   密码登录
        
    *   JWT Token认证
        
2.  **宠物档案管理**
    
    *   创建宠物档案
        
    *   编辑宠物信息
        
    *   删除宠物档案
        
    *   我的主页展示
        
3.  **基础页面结构**
    
    *   首页框架
        
    *   个人中心页面
        

### 数据库设计

```postgresql
-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 宠物表
CREATE TABLE pets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  name VARCHAR(50),
  species ENUM('cat', 'dog', 'other'),
  breed VARCHAR(100),
  birthday DATE,
  gender ENUM('male', 'female', 'unknown'),
  weight DECIMAL(5,2),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户会话表
CREATE TABLE user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  token VARCHAR(512),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 接口设计

#### 用户相关

```plaintext
POST /api/auth/register
Body: {username, email, phone, password}
Response: {user, token}

POST /api/auth/login
Body: {email/phone, password}
Response: {user, token}

GET /api/users/profile
Headers: {Authorization: Bearer {token}}
Response: {user, pets[]}
```

#### 宠物相关

```plaintext
POST /api/pets
Headers: {Authorization: Bearer {token}}
Body: {name, species, breed, birthday, gender, weight, avatar_url}
Response: {pet}

PUT /api/pets/:id
Headers: {Authorization: Bearer {token}}
Body: {更新字段}
Response: {pet}

DELETE /api/pets/:id
Headers: {Authorization: Bearer {token}}
Response: {success: true}

GET /api/users/:userId/pets
Response: {pets[]}
```

### 测试用例

1.  用户注册流程测试
    
2.  用户登录流程测试
    
3.  宠物创建/编辑/删除测试
    
4.  JWT Token验证测试
    
5.  输入验证测试（空值、格式错误等）
    

---

## 迭代2：AI情绪识别与动态发布

### 目标

集成第三方AI识别API，实现宠物照片AI解读，完成动态发布核心流程。

### 功能点

1.  **AI情绪识别集成**
    
    *   集成百度云/腾讯云宠物识别API
        
    *   照片/视频上传处理
        
    *   生成宠物心情卡
        
2.  **动态发布系统**
    
    *   图片/视频上传
        
    *   AI解读结果绑定
        
    *   动态内容编辑（文字、话题、@用户）
        
    *   发布到社区
        
3.  **文件存储服务**
    
    *   图片上传到云存储（OSS）
        
    *   生成缩略图
        

### 数据库设计

```postgresql
-- 动态表
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  pet_id INT,
  content TEXT,
  media_type ENUM('image', 'video'),
  media_urls JSON, -- 存储多个媒体文件URL
  ai_analysis JSON, -- 存储AI分析结果
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- 话题表
CREATE TABLE hashtags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE,
  post_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 动态-话题关联表
CREATE TABLE post_hashtags (
  post_id INT,
  hashtag_id INT,
  PRIMARY KEY (post_id, hashtag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
);
```

### 接口设计

#### AI识别相关

```plaintext
POST /api/ai/analyze-emotion
Headers: {Authorization: Bearer {token}}
Content-Type: multipart/form-data
Body: {image: file, pet_id}
Response: {
  emotion: string,
  confidence: number,
  description: string,
  mood_card_url: string
}

POST /api/upload/media
Headers: {Authorization: Bearer {token}}
Content-Type: multipart/form-data
Body: {files[]}
Response: {urls: string[]}
```

#### 动态相关

```plaintext
POST /api/posts
Headers: {Authorization: Bearer {token}}
Body: {
  pet_id,
  content,
  media_urls: string[],
  ai_analysis: object,
  hashtags: string[]
}
Response: {post}

GET /api/posts/:id
Response: {post, user, pet, hashtags[]}
```

### 测试用例

1.  图片上传功能测试
    
2.  AI API调用测试（正常、错误响应）
    
3.  心情卡生成测试
    
4.  动态发布完整流程测试
    
5.  话题标签解析测试
    

---

## 迭代3：社区互动与信息流

### 目标

实现社区核心互动功能，构建首页信息流。

### 功能点

1.  **信息流系统**
    
    *   推荐流（基于简单算法）
        
    *   关注流（时间序）
        
    *   动态分页加载
        
2.  **社交互动**
    
    *   点赞功能
        
    *   评论功能
        
    *   关注用户
        
3.  **用户关系**
    
    *   关注/取关
        
    *   粉丝列表
        

### 数据库设计

```postgresql
-- 点赞表
CREATE TABLE likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  post_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 评论表
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  post_id INT,
  content TEXT,
  parent_id INT NULL, -- 支持回复
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 关注表
CREATE TABLE follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  follower_id INT,
  following_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_follow (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 接口设计

#### 信息流

```plaintext
GET /api/posts/feed/recommended
Query: {page, limit}
Response: {posts[], pagination}

GET /api/posts/feed/following
Headers: {Authorization: Bearer {token}}
Query: {page, limit}
Response: {posts[], pagination}
```

#### 互动功能

```plaintext
POST /api/posts/:postId/like
Headers: {Authorization: Bearer {token}}
Response: {success: true, like_count}

DELETE /api/posts/:postId/like
Headers: {Authorization: Bearer {token}}
Response: {success: true, like_count}

POST /api/posts/:postId/comments
Headers: {Authorization: Bearer {token}}
Body: {content, parent_id}
Response: {comment}

GET /api/posts/:postId/comments
Query: {page, limit}
Response: {comments[], pagination}

POST /api/users/:userId/follow
Headers: {Authorization: Bearer {token}}
Response: {success: true}

DELETE /api/users/:userId/follow
Headers: {Authorization: Bearer {token}}
Response: {success: true}
```

### 测试用例

1.  信息流分页测试
    
2.  点赞/取消点赞功能测试
    
3.  评论/回复功能测试
    
4.  关注/取关功能测试
    
5.  推荐算法基础测试
    

---

## 迭代4：健康自查与手账

### 目标

实现AI健康自查功能，完成健康手账基础功能。

### 功能点

1.  **AI健康自查**
    
    *   症状选择与描述
        
    *   图片上传识别
        
    *   结构化建议输出
        
    *   免责声明展示
        
2.  **健康手账**
    
    *   健康事件记录（疫苗、驱虫、体重等）
        
    *   时间轴视图
        
    *   体重折线图
        
    *   记录与AI自查关联
        
3.  **健康知识库对接**
    
    *   集成大语言模型API
        
    *   构建智能问答Agent
        

### 数据库设计

```postgresql
-- 健康事件表
CREATE TABLE health_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pet_id INT,
  event_type ENUM('vaccine', 'deworm', 'weight', 'medical_visit', 'symptom'),
  title VARCHAR(100),
  description TEXT,
  event_date DATE,
  value DECIMAL(8,2), -- 用于存储体重等数值
  unit VARCHAR(20),
  images JSON,
  ai_analysis_id INT NULL, -- 关联AI自查记录
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- AI自查记录表
CREATE TABLE ai_health_checks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pet_id INT,
  symptoms TEXT,
  images JSON,
  ai_analysis JSON,
  disclaimer_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- 提醒设置表
CREATE TABLE health_reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pet_id INT,
  event_type ENUM('vaccine', 'deworm'),
  last_date DATE,
  next_date DATE,
  cycle_days INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);
```

### 接口设计

#### 健康自查

```plaintext
POST /api/ai/health-check
Headers: {Authorization: Bearer {token}}
Body: {
  pet_id,
  symptoms: string,
  body_part: string,
  images: string[]
}
Response: {
  analysis: {
    possibilities: Array<{condition, probability, advice}>,
    disclaimer: string
  }
}

POST /api/ai/health-check/:checkId/record
Headers: {Authorization: Bearer {token}}
Body: {event_type, description, event_date}
Response: {health_event}
```

#### 健康手账

```plaintext
GET /api/pets/:petId/health-events
Query: {event_type, start_date, end_date}
Response: {events[]}

POST /api/pets/:petId/health-events
Headers: {Authorization: Bearer {token}}
Body: {event_type, title, description, event_date, value, unit, images}
Response: {event}

GET /api/pets/:petId/weight-history
Response: {data: Array<{date, weight}>, chart_data}

POST /api/pets/:petId/health-reminders
Headers: {Authorization: Bearer {token}}
Body: {event_type, last_date, cycle_days}
Response: {reminder}
```

### 测试用例

1.  AI健康自查流程测试
    
2.  免责声明展示与确认测试
    
3.  健康事件记录测试
    
4.  体重历史数据查询测试
    
5.  数据关联性测试（自查记录→健康事件）
    

---

## 迭代5：优化与扩展功能

### 目标

实现同城功能，完善通知系统，进行性能优化。

### 功能点

1.  **同城功能**
    
    *   用户地理位置获取（可选）
        
    *   同城动态展示
        
    *   同城用户推荐
        
2.  **通知系统**
    
    *   点赞/评论通知
        
    *   关注通知
        
    *   健康提醒通知
        
3.  **性能优化**
    
    *   图片懒加载
        
    *   数据缓存策略
        
    *   API响应优化
        
4.  **扩展功能**
    
    *   同款心情生成
        
    *   机器人水军（基础版）
        
    *   数据统计面板
        

### 数据库设计

```postgresql
-- 用户位置表（可选）
CREATE TABLE user_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,
  city VARCHAR(50),
  district VARCHAR(50),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 通知表
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  type ENUM('like', 'comment', 'follow', 'reminder'),
  title VARCHAR(100),
  content TEXT,
  related_id INT, -- 关联的动态/评论/用户ID
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 应用统计表
CREATE TABLE app_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE UNIQUE,
  daily_active_users INT DEFAULT 0,
  new_users INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  ai_usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 接口设计

#### 同城功能

text

```plaintext
GET /api/posts/nearby
Query: {city, page, limit}
Response: {posts[], pagination}

GET /api/users/nearby
Query: {city, pet_species}
Response: {users[]}

POST /api/users/location
Headers: {Authorization: Bearer {token}}
Body: {city, district, latitude, longitude}
Response: {success: true}
```

#### 通知系统

text

```plaintext
GET /api/notifications
Headers: {Authorization: Bearer {token}}
Query: {unread_only, page, limit}
Response: {notifications[], unread_count}

PUT /api/notifications/:id/read
Headers: {Authorization: Bearer {token}}
Response: {success: true}

PUT /api/notifications/read-all
Headers: {Authorization: Bearer {token}}
Response: {success: true}
```

#### 数据统计

text

```plaintext
GET /api/admin/statistics/daily
Headers: {Authorization: Bearer {token}}
Query: {start_date, end_date}
Response: {statistics[]}

GET /api/admin/statistics/overview
Headers: {Authorization: Bearer {token}}
Response: {total_users, total_pets, total_posts, total_ai_usage}
```

### 测试用例

1.  同城动态筛选测试
    
2.  地理位置获取与更新测试
    
3.  通知生成与推送测试
    
4.  通知已读标记测试
    
5.  性能压力测试
    
6.  缓存命中率测试
    

---

## 技术实现要点

### 前端 (React Native)

*   使用React Native Camera/Roll处理图片
    
*   使用图表库展示体重数据
    

### 后端 (Nest.js)

*   使用TypeORM进行数据库操作
    
*   文件上传处理（使用multer）
    

### AI服务集成

*   情绪识别：百度云/腾讯云API
    
*   健康自查：使用LangChain + 国内大模型API
    
*   请求限流与失败重试机制
    
*   结果缓存减少API调用
    

### 部署架构

*   前端：App Store / 华为应用市场
    
*   后端：云服务器（2核4G起步）
    
*   数据库：supabase
    
*   文件存储：云对象存储（OSS）
    
*   CI/CD：GitHub Actions / Jenkins
    

---

## 风险控制与监控

### 监控指标

1.  API响应时间（特别是AI服务）
    
2.  错误率统计
    
3.  用户活跃度
    
4.  AI识别准确率（用户反馈）
    
5.  服务器资源使用率
    

### 应急方案

1.  AI服务降级：当第三方API不可用时，提供基础功能
    
2.  数据库备份：每日自动备份
    
3.  流量控制：防止恶意请求
    
4.  错误日志：实时监控与告警
    

---

## 后续迭代规划（V1.1+）

1.  **智能提醒系统完善**
    
2.  **高级推荐算法**
    
3.  **宠物社交功能扩展**
    
4.  **数据导出与分享**
    
5.  **多语言支持**
    
6.  **Web版管理后台**
    

---

**文档版本：** V1.0  
**最后更新：** 2026年2月  
**说明：** 本规划基于PRD V1.0，实际开发中可根据进度和反馈灵活调整各迭代内容和优先级。