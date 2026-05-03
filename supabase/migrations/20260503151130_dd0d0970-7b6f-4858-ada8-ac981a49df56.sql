
-- Working hours per device (simple daily on/off)
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS working_hours_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS working_hours_start time,
  ADD COLUMN IF NOT EXISTS working_hours_end time,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/London';

-- Per-playlist-item scheduling rules
ALTER TABLE public.playlist_videos
  ADD COLUMN IF NOT EXISTS schedule_start_date date,
  ADD COLUMN IF NOT EXISTS schedule_end_date date,
  ADD COLUMN IF NOT EXISTS schedule_days_of_week smallint[], -- 0=Sun..6=Sat; null = every day
  ADD COLUMN IF NOT EXISTS schedule_start_time time,
  ADD COLUMN IF NOT EXISTS schedule_end_time time;

-- Per-playlist active window
ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS active_start_date date,
  ADD COLUMN IF NOT EXISTS active_end_date date;

-- Company-wide emergency takeover
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS emergency_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_message text,
  ADD COLUMN IF NOT EXISTS emergency_started_at timestamptz;
