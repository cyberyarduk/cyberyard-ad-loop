-- Add device pairing and authentication fields to devices table
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS device_code TEXT,
ADD COLUMN IF NOT EXISTS pairing_qr_token TEXT,
ADD COLUMN IF NOT EXISTS auth_token TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unpaired' CHECK (status IN ('unpaired', 'active', 'suspended', 'retired')),
ADD COLUMN IF NOT EXISTS admin_pin TEXT;

-- Create unique indexes for secure lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_device_code ON devices(device_code) WHERE device_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_pairing_qr_token ON devices(pairing_qr_token) WHERE pairing_qr_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_auth_token ON devices(auth_token) WHERE auth_token IS NOT NULL;

-- Function to generate random device code (6 chars, alphanumeric uppercase)
CREATE OR REPLACE FUNCTION generate_device_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars like O, 0, I, 1
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to generate secure random token (32 bytes hex)
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Trigger to auto-generate device_code and pairing_qr_token on device creation
CREATE OR REPLACE FUNCTION auto_generate_device_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if not provided
  IF NEW.device_code IS NULL THEN
    NEW.device_code := generate_device_code();
  END IF;
  
  IF NEW.pairing_qr_token IS NULL THEN
    NEW.pairing_qr_token := generate_secure_token();
  END IF;
  
  -- Set default admin PIN if not provided (can be changed later)
  IF NEW.admin_pin IS NULL THEN
    NEW.admin_pin := '1234'; -- Default PIN, company admin should change this
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_device_credentials
BEFORE INSERT ON devices
FOR EACH ROW
EXECUTE FUNCTION auto_generate_device_credentials();

-- Update existing devices to have credentials
UPDATE devices 
SET 
  device_code = generate_device_code(),
  pairing_qr_token = generate_secure_token(),
  status = COALESCE(status, 'unpaired'),
  admin_pin = '1234'
WHERE device_code IS NULL;

-- Add RLS policy for device self-lookup via auth_token
CREATE POLICY "Devices can access their own data via auth_token"
ON devices
FOR SELECT
USING (
  auth_token IS NOT NULL 
  AND auth_token = current_setting('request.headers', true)::json->>'x-device-token'
);

-- Add RLS policy for device updates via auth_token
CREATE POLICY "Devices can update their own last_seen via auth_token"
ON devices
FOR UPDATE
USING (
  auth_token IS NOT NULL 
  AND auth_token = current_setting('request.headers', true)::json->>'x-device-token'
);