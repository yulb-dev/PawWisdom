-- ===============================================
-- 迭代 3: 社交功能增强 - 数据库迁移
-- 创建时间: 2026-02-10
-- 描述: 添加草稿、标题、封面图、心情、@用户、点赞记录、收藏、评论功能
-- ===============================================

-- 1. 扩展 posts 表，添加新字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pet_mood VARCHAR(50);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS mentioned_user_ids JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_posts_is_draft ON posts(is_draft);

-- 添加注释
COMMENT ON COLUMN posts.title IS '动态标题';
COMMENT ON COLUMN posts.cover_image_url IS '封面图URL（从mediaUrls中选择）';
COMMENT ON COLUMN posts.pet_mood IS '宠物心情';
COMMENT ON COLUMN posts.mentioned_user_ids IS '提到的用户ID数组';
COMMENT ON COLUMN posts.favorite_count IS '收藏数';
COMMENT ON COLUMN posts.is_draft IS '是否为草稿';

-- 2. 创建点赞记录表
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at);

COMMENT ON TABLE post_likes IS '动态点赞记录表';
COMMENT ON COLUMN post_likes.post_id IS '动态ID';
COMMENT ON COLUMN post_likes.user_id IS '点赞用户ID';

-- 3. 创建收藏记录表
CREATE TABLE IF NOT EXISTS post_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_favorites_post_id ON post_favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_user_id ON post_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_created_at ON post_favorites(created_at);

COMMENT ON TABLE post_favorites IS '动态收藏记录表';
COMMENT ON COLUMN post_favorites.post_id IS '动态ID';
COMMENT ON COLUMN post_favorites.user_id IS '收藏用户ID';

-- 4. 创建评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reply_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  images JSONB,
  like_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

COMMENT ON TABLE comments IS '评论表';
COMMENT ON COLUMN comments.post_id IS '动态ID';
COMMENT ON COLUMN comments.user_id IS '评论用户ID';
COMMENT ON COLUMN comments.parent_id IS '父评论ID（回复评论时使用）';
COMMENT ON COLUMN comments.reply_to_user_id IS '回复的用户ID';
COMMENT ON COLUMN comments.content IS '评论内容';
COMMENT ON COLUMN comments.images IS '评论图片URL数组';
COMMENT ON COLUMN comments.like_count IS '点赞数';
COMMENT ON COLUMN comments.is_pinned IS '是否置顶';

-- 5. 创建评论点赞记录表
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

COMMENT ON TABLE comment_likes IS '评论点赞记录表';

-- 6. 创建触发器：自动更新点赞数
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_like_count ON post_likes;
CREATE TRIGGER trigger_post_like_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 7. 创建触发器：自动更新收藏数
CREATE OR REPLACE FUNCTION update_post_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_favorite_count ON post_favorites;
CREATE TRIGGER trigger_post_favorite_count
AFTER INSERT OR DELETE ON post_favorites
FOR EACH ROW EXECUTE FUNCTION update_post_favorite_count();

-- 8. 创建触发器：自动更新评论数
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.post_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_comment_count ON comments;
CREATE TRIGGER trigger_post_comment_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- 9. 创建触发器：自动更新评论点赞数
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_like_count ON comment_likes;
CREATE TRIGGER trigger_comment_like_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- 10. 启用 Row Level Security (RLS)
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 11. 创建 RLS 策略
-- 点赞记录：用户可以查看所有，但只能操作自己的
CREATE POLICY "Users can view all likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON post_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own likes" ON post_likes FOR DELETE USING (auth.uid()::text = user_id);

-- 收藏记录：用户可以查看所有，但只能操作自己的
CREATE POLICY "Users can view all favorites" ON post_favorites FOR SELECT USING (true);
CREATE POLICY "Users can insert own favorites" ON post_favorites FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own favorites" ON post_favorites FOR DELETE USING (auth.uid()::text = user_id);

-- 评论：用户可以查看所有，但只能修改/删除自己的
CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid()::text = user_id);

-- 评论点赞：用户可以查看所有，但只能操作自己的
CREATE POLICY "Users can view all comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own comment likes" ON comment_likes FOR DELETE USING (auth.uid()::text = user_id);

-- ===============================================
-- 迁移完成
-- ===============================================
