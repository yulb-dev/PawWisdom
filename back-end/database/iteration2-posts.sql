-- PawWisdom Iteration 2: Posts, Hashtags and Relations
-- Run this script in Supabase SQL Editor after init.sql

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  pet_id UUID,
  content TEXT NOT NULL,
  media_type VARCHAR(20) CHECK (media_type IN ('image', 'video')),
  media_urls JSONB,
  ai_analysis JSONB,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
);

-- Create hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  post_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_hashtags junction table
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID NOT NULL,
  hashtag_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, hashtag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_pet_id ON posts(pet_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_deleted ON posts(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);

-- Create trigger for updating posts updated_at
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts
CREATE POLICY "Anyone can view non-deleted posts" ON posts
  FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for hashtags
CREATE POLICY "Anyone can view hashtags" ON hashtags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create hashtags" ON hashtags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for post_hashtags
CREATE POLICY "Anyone can view post hashtags" ON post_hashtags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create post hashtags" ON post_hashtags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Post owners can delete post hashtags" ON post_hashtags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_hashtags.post_id 
      AND posts.user_id::text = auth.uid()::text
    )
  );

-- Create function to update hashtag post count
CREATE OR REPLACE FUNCTION update_hashtag_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags SET post_count = post_count + 1 WHERE id = NEW.hashtag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags SET post_count = post_count - 1 WHERE id = OLD.hashtag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to maintain hashtag post count
CREATE TRIGGER update_hashtag_count_on_post_hashtag
AFTER INSERT OR DELETE ON post_hashtags
FOR EACH ROW EXECUTE FUNCTION update_hashtag_post_count();

-- Create function to update post comment/like count
CREATE OR REPLACE FUNCTION increment_post_counter(
  post_id_param UUID,
  counter_name TEXT,
  increment_by INT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  IF counter_name = 'like_count' THEN
    UPDATE posts SET like_count = like_count + increment_by WHERE id = post_id_param;
  ELSIF counter_name = 'comment_count' THEN
    UPDATE posts SET comment_count = comment_count + increment_by WHERE id = post_id_param;
  ELSIF counter_name = 'share_count' THEN
    UPDATE posts SET share_count = share_count + increment_by WHERE id = post_id_param;
  END IF;
END;
$$ language 'plpgsql';
