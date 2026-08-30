-- -------------------------------------------------------------
-- Dollysticart Migration: Fix Admin Whitelist & Role Auto-Promotion
-- Ensures any whitelisted email automatically receives the 'admin' role upon signup or login.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_whitelisted BOOLEAN;
  assigned_role TEXT;
BEGIN
  -- Check if email is whitelisted in admin_whitelist table
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist WHERE LOWER(email) = LOWER(new.email)
  ) INTO is_whitelisted;

  assigned_role := 'customer';

  -- Promote to admin if root email or present in admin_whitelist
  IF LOWER(new.email) = 'rishabhagarwal.me@gmail.com' OR is_whitelisted THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing registered profiles whose email is in admin_whitelist or root admin
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) = 'rishabhagarwal.me@gmail.com'
   OR LOWER(email) IN (SELECT LOWER(email) FROM public.admin_whitelist);
