-- Enable realtime for devices table to detect playlist changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;