-- Add super admin policies for devices
CREATE POLICY "Super admins can view all devices" 
ON public.devices 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create devices" 
ON public.devices 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all devices" 
ON public.devices 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all devices" 
ON public.devices 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Add super admin policies for videos
CREATE POLICY "Super admins can view all videos" 
ON public.videos 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all videos" 
ON public.videos 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all videos" 
ON public.videos 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Add super admin policies for playlists
CREATE POLICY "Super admins can view all playlists" 
ON public.playlists 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create playlists" 
ON public.playlists 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all playlists" 
ON public.playlists 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all playlists" 
ON public.playlists 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Add super admin policies for venues
CREATE POLICY "Super admins can view all venues" 
ON public.venues 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create venues" 
ON public.venues 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all venues" 
ON public.venues 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all venues" 
ON public.venues 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Add super admin policies for playlist_videos
CREATE POLICY "Super admins can view all playlist_videos" 
ON public.playlist_videos 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create playlist_videos" 
ON public.playlist_videos 
FOR INSERT 
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update playlist_videos" 
ON public.playlist_videos 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete all playlist_videos" 
ON public.playlist_videos 
FOR DELETE 
USING (is_super_admin(auth.uid()));