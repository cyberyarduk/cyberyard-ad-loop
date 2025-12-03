-- Set REPLICA IDENTITY FULL on devices table for proper realtime filtering
ALTER TABLE public.devices REPLICA IDENTITY FULL;