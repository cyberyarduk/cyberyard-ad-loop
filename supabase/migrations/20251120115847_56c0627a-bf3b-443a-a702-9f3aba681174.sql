-- Create venues table
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_videos junction table
CREATE TABLE public.playlist_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venues (authenticated users can manage their own)
CREATE POLICY "Users can view their own venues"
  ON public.venues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own venues"
  ON public.venues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own venues"
  ON public.venues FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own venues"
  ON public.venues FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for playlists
CREATE POLICY "Users can view their own playlists"
  ON public.playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for videos
CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for devices (users manage their own, but public can read for player)
CREATE POLICY "Users can view their own devices"
  ON public.devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view devices for player"
  ON public.devices FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own devices"
  ON public.devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON public.devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON public.devices FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for playlist_videos (manage through playlist ownership, public read for player)
CREATE POLICY "Users can view playlist videos through playlist ownership"
  ON public.playlist_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_videos.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view playlist videos for player"
  ON public.playlist_videos FOR SELECT
  USING (true);

CREATE POLICY "Users can create playlist videos through playlist ownership"
  ON public.playlist_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_videos.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete playlist videos through playlist ownership"
  ON public.playlist_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_videos.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_playlist_id ON public.devices(playlist_id);
CREATE INDEX idx_venues_user_id ON public.venues(user_id);
CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_playlist_videos_playlist_id ON public.playlist_videos(playlist_id);
CREATE INDEX idx_playlist_videos_order ON public.playlist_videos(playlist_id, order_index);