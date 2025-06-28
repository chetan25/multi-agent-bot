-- Create chat_threads table
CREATE TABLE IF NOT EXISTS chat_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "threadId" TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "threadId" TEXT NOT NULL REFERENCES chat_threads("threadId") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    attachments JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id ON chat_threads("userId");
CREATE INDEX IF NOT EXISTS idx_chat_threads_updated_at ON chat_threads("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages("threadId");
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages("createdAt");

-- Create RLS (Row Level Security) policies
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for chat_threads - users can only see their own threads
CREATE POLICY "Users can view their own chat threads" ON chat_threads
    FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own chat threads" ON chat_threads
    FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own chat threads" ON chat_threads
    FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own chat threads" ON chat_threads
    FOR DELETE USING (auth.uid() = "userId");

-- Policy for chat_messages - users can only see messages from their own threads
CREATE POLICY "Users can view messages from their own threads" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads."threadId" = chat_messages."threadId" 
            AND chat_threads."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their own threads" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads."threadId" = chat_messages."threadId" 
            AND chat_threads."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can update messages from their own threads" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads."threadId" = chat_messages."threadId" 
            AND chat_threads."userId" = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages from their own threads" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads."threadId" = chat_messages."threadId" 
            AND chat_threads."userId" = auth.uid()
        )
    );

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updatedAt
CREATE TRIGGER update_chat_threads_updated_at 
    BEFORE UPDATE ON chat_threads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 