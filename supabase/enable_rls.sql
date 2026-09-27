-- Enable RLS on server-managed tables (policies not included).
-- Server routes use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.
-- Run manually in Supabase SQL editor when ready.

ALTER TABLE deceased_drive_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_travel_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_travel_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;
