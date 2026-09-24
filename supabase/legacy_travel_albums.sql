-- Run in Supabase SQL editor (after deceased_drive_tokens exists)

CREATE TABLE IF NOT EXISTS legacy_travel_albums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  owner_user_email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legacy_travel_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid NOT NULL REFERENCES legacy_travel_albums(id) ON DELETE CASCADE,
  drive_file_id text NOT NULL,
  file_name text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (album_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS legacy_travel_photos_album_id_idx
  ON legacy_travel_photos (album_id, sort_order);

ALTER TABLE legacy_travel_albums DISABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_travel_photos DISABLE ROW LEVEL SECURITY;
