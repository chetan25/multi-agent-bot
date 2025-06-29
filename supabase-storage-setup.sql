-- Create storage bucket for chat images (PRIVATE for security)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  false, -- PRIVATE bucket for security
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chat images
-- Users can upload images to their own folder
CREATE POLICY "Users can upload images to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view images from their own folder
CREATE POLICY "Users can view images from their own folder" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update images in their own folder
CREATE POLICY "Users can update images in their own folder" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete images from their own folder
CREATE POLICY "Users can delete images from their own folder" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 