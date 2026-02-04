-- PawWisdom Database Initialization Script for Supabase
-- Run this script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  species VARCHAR(20) NOT NULL CHECK (species IN ('cat', 'dog', 'other')),
  breed VARCHAR(100),
  birthday DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unknown')),
  weight DECIMAL(5,2),
  avatar_url VARCHAR(255),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_owner_deleted ON pets(owner_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for pets
CREATE POLICY "Users can view their own pets" ON pets
  FOR SELECT USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can create pets" ON pets
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can update their own pets" ON pets
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can delete their own pets" ON pets
  FOR DELETE USING (auth.uid()::text = owner_id::text);

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Insert sample data (optional, for testing)
-- You can comment out this section if you don't need sample data

-- INSERT INTO users (username, email, password_hash) VALUES
--   ('testuser', 'test@example.com', '$2b$10$...');
-- (Note: Use bcrypt to generate password_hash)
