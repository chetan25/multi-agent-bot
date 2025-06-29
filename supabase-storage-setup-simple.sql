-- Create storage bucket for chat images (PRIVATE for security)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  false, -- PRIVATE bucket for security
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
) ON CONFLICT (id) DO NOTHING;

-- Simple RLS policies for authenticated users
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own files
CREATE POLICY "Allow authenticated reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'chat-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 