-- Run this SQL manually in the Supabase SQL editor:
CREATE TABLE IF NOT EXISTS deceased_drive_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL UNIQUE,
  drive_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE deceased_drive_tokens DISABLE ROW LEVEL SECURITY;

-- Add preference columns (run if table already exists):
-- ALTER TABLE deceased_drive_tokens ADD COLUMN IF NOT EXISTS excluded_types jsonb;
-- ALTER TABLE deceased_drive_tokens ADD COLUMN IF NOT EXISTS special_dates jsonb;
-- ALTER TABLE deceased_drive_tokens ADD COLUMN IF NOT EXISTS allow_recommendation boolean;
