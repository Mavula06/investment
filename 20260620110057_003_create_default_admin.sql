-- 003_create_default_admin.sql

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
SELECT EXISTS (
SELECT 1
FROM profiles
WHERE id = auth.uid()
AND is_admin = TRUE
);
$$;

CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
SELECT EXISTS (
SELECT 1
FROM profiles
WHERE id = auth.uid()
AND role = 'owner'
);
$$;

CREATE OR REPLACE FUNCTION check_admin_privileges()
RETURNS TRIGGER AS $$
DECLARE
owner_count INTEGER;
BEGIN

SELECT COUNT(*)
INTO owner_count
FROM profiles
WHERE role = 'owner';

IF NEW.is_admin = TRUE
AND COALESCE(OLD.is_admin,FALSE) = FALSE THEN

 IF owner_count > 0 THEN
   IF NOT EXISTS (
     SELECT 1
     FROM profiles
     WHERE id = auth.uid()
       AND role = 'owner'
   ) THEN
     RAISE EXCEPTION 'Only the owner can create admins';
   END IF;
 END IF;

END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_admin_privileges ON profiles;

CREATE TRIGGER enforce_admin_privileges
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_admin_privileges();

COMMENT ON TABLE profiles IS
'Owner/Admin role system enabled';
