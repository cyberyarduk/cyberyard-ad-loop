CREATE TABLE public.device_playlist_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  label text,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  days_of_week integer[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_playlist_schedules_device ON public.device_playlist_schedules(device_id);

ALTER TABLE public.device_playlist_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users view their device schedules"
ON public.device_playlist_schedules FOR SELECT TO authenticated
USING (device_id IN (SELECT id FROM public.devices WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Company users manage their device schedules"
ON public.device_playlist_schedules FOR ALL TO authenticated
USING (device_id IN (SELECT id FROM public.devices WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())))
WITH CHECK (device_id IN (SELECT id FROM public.devices WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Super admins manage all device schedules"
ON public.device_playlist_schedules FOR ALL TO authenticated
USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));