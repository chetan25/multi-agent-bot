-- Create a separate table for Google Drive tokens
-- This approach works better with Supabase's security model

-- Create google_tokens table
CREATE TABLE IF NOT EXISTS google_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_refresh_token ON google_tokens(refresh_token) WHERE refresh_token IS NOT NULL;

-- Enable RLS on google_tokens table
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for google_tokens
-- Users can only access their own tokens
CREATE POLICY "Users can view their own Google tokens" ON google_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google tokens" ON google_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google tokens" ON google_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google tokens" ON google_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_google_tokens_updated_at 
    BEFORE UPDATE ON google_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_google_tokens_updated_at();

-- Add comments to document the table and columns
COMMENT ON TABLE google_tokens IS 'Stores Google OAuth tokens for Drive API access';
COMMENT ON COLUMN google_tokens.user_id IS 'Reference to auth.users table';
COMMENT ON COLUMN google_tokens.refresh_token IS 'Google OAuth refresh token for Drive API access';
COMMENT ON COLUMN google_tokens.access_token IS 'Google OAuth access token (cached)';
COMMENT ON COLUMN google_tokens.token_expiry IS 'Expiry timestamp for the access token'; 