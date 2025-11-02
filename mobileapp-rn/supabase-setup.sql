-- Create user_profiles table for user information
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  target_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_conversations table for chat history
CREATE TABLE chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table for individual chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_starters table
CREATE TABLE conversation_starters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_starters ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat conversations policies
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Conversation starters policies (public read)
CREATE POLICY "Anyone can view conversation starters" ON conversation_starters
  FOR SELECT TO anon USING (true);

-- Insert conversation starters
INSERT INTO conversation_starters (title, prompt, category, difficulty, language) VALUES
('Daily Routine', 'Tell me about your daily routine. What time do you wake up, what do you do during the day, and how do you spend your evenings?', 'lifestyle', 'beginner', 'en'),
('Travel Stories', 'Describe your favorite travel destination. What did you like most about it and why would you recommend it to others?', 'travel', 'intermediate', 'en'),
('Future Plans', 'What are your plans for the next few years? Do you want to learn new skills, travel more, or make any big changes in your life?', 'personal', 'intermediate', 'en'),
('Hobbies & Interests', 'What are your hobbies? Tell me about something you enjoy doing in your free time and why you like it.', 'interests', 'beginner', 'en'),
('Food & Cooking', 'What''s your favorite dish to cook? Can you describe the recipe and why you enjoy making it?', 'food', 'beginner', 'en'),
('Weekend Activities', 'How do you usually spend your weekends? Do you have any favorite weekend activities or traditions?', 'lifestyle', 'beginner', 'en'),
('Learning Experience', 'Tell me about something new you learned recently. How did you learn it and what was the most interesting part?', 'education', 'intermediate', 'en'),
('Dream Vacation', 'If you could go on a dream vacation anywhere in the world with no budget limits, where would you go and what would you do?', 'travel', 'intermediate', 'en'),
('Childhood Memories', 'Tell me about a favorite memory from your childhood. What happened and why does it stand out to you?', 'personal', 'beginner', 'en'),
('Technology & Apps', 'What technology or apps do you use daily? Which one couldn''t you live without and why?', 'technology', 'intermediate', 'en');
