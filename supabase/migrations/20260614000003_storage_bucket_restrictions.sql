-- Restreindre les buckets provider : 10 MB max, PDF/JPEG/PNG/WebP uniquement
UPDATE storage.buckets
SET
  file_size_limit   = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
WHERE id IN ('provider-applications', 'provider-documents');
