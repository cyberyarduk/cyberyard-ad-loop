-- Fix critical security vulnerabilities

-- 1. Remove public SELECT policy from devices table (CRITICAL)
DROP POLICY IF EXISTS "Public can view devices for player" ON devices;

-- 2. Remove public SELECT policy from playlist_videos table
DROP POLICY IF EXISTS "Public can view playlist videos for player" ON playlist_videos;

-- 3. Add function to hash PINs (for future use)
CREATE OR REPLACE FUNCTION hash_pin(pin text) RETURNS text AS $$
BEGIN
  RETURN crypt(pin, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add function to verify PIN (for future use when we implement hashing)
CREATE OR REPLACE FUNCTION verify_pin(pin text, hashed_pin text) RETURNS boolean AS $$
BEGIN
  RETURN hashed_pin = crypt(pin, hashed_pin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;