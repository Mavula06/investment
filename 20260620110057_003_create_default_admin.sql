-- Update the check_admin_privileges function to allow first admin creation
CREATE OR REPLACE FUNCTION check_admin_privileges()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- If trying to set is_admin to true
  IF NEW.is_admin = TRUE AND (OLD.is_admin = FALSE OR OLD IS NULL) THEN
    -- Count existing admins
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE is_admin = TRUE;
    
    -- If no admins exist yet, allow it (bootstrap first admin)
    IF admin_count = 0 THEN
      RETURN NEW;
    END IF;
    
    -- Otherwise, check if the current user is an admin
    IF NOT is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins can create new admins';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make the first user (Bruno) the default admin
-- This is allowed since no admins exist yet
UPDATE profiles SET is_admin = TRUE WHERE id = 'ec29edfb-ea62-49cd-b730-fbaa660e1bd2';

-- Update the profile name if needed
UPDATE profiles SET full_name = 'Admin Bruno' WHERE id = 'ec29edfb-ea62-49cd-b730-fbaa660e1bd2';

-- Add a note about the default admin credentials
COMMENT ON TABLE profiles IS 'Default admin account: sellbymeng@outlook.com (already registered) - made admin on first deployment';
