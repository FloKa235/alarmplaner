-- Add summary column to documents table for KI-processed summaries
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary TEXT;

-- Create documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Users can manage files in their own district folder
CREATE POLICY "Users manage own documents" ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM districts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM districts WHERE user_id = auth.uid()
    )
  );
