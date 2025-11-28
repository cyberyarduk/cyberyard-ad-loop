-- Add battery_level column to devices table (nullable, 0-100 percentage)
ALTER TABLE public.devices 
ADD COLUMN battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100);