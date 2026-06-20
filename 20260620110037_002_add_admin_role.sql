-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin lookups
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- Create a function to check if a user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_admin = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy for admin management - only admins can update is_admin field
CREATE POLICY "update_admin_status" ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add trigger to prevent non-admins from setting is_admin to true
CREATE OR REPLACE FUNCTION check_admin_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to set is_admin to true, check if the current user is an admin
  IF NEW.is_admin = TRUE AND OLD.is_admin = FALSE THEN
    IF NOT is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only admins can create new admins';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_admin_check
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_admin_privileges();
