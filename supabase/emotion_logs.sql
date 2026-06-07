-- Run this SQL manually in the Supabase SQL editor:
CREATE TABLE emotion_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  mood text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add next-auth email identifier (run if table already exists):
ALTER TABLE emotion_logs ADD COLUMN user_email text;
