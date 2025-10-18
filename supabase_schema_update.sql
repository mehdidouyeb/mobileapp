-- Update discussions table to include conversation name
ALTER TABLE discussions ADD COLUMN conversation_name TEXT;

-- Create index for conversation names
CREATE INDEX idx_discussions_conversation_name ON discussions(conversation_name);

-- Update the existing policy to include conversation_name
DROP POLICY IF EXISTS "Allow all operations on discussions" ON discussions;
CREATE POLICY "Allow all operations on discussions" ON discussions FOR ALL USING (true);
