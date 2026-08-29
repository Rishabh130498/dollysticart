-- -------------------------------------------------------------
-- Dollysticart Admin Settings & Whitelist migration
-- -------------------------------------------------------------

-- 1. Create Admin Settings Table (Single configuration row)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  admin_limit INTEGER NOT NULL DEFAULT 1 CHECK (admin_limit >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert default single config row if not exists
INSERT INTO public.admin_settings (id, admin_limit) VALUES (1, 1) ON CONFLICT DO NOTHING;

-- 2. Create Admin Whitelist Table
CREATE TABLE IF NOT EXISTS public.admin_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Configure RLS policies (Only admins can read or write)
DROP POLICY IF EXISTS admin_settings_admin_policy ON public.admin_settings;
CREATE POLICY admin_settings_admin_policy ON public.admin_settings
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS admin_whitelist_admin_policy ON public.admin_whitelist;
CREATE POLICY admin_whitelist_admin_policy ON public.admin_whitelist
  FOR ALL USING (public.is_admin());


-- 3. Modify trigger function public.handle_new_user()
-- Checks if registering email is whitelisted and promotes to admin automatically if capacity permits.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_whitelisted BOOLEAN;
  current_admin_limit INTEGER;
  current_admin_count INTEGER;
  assigned_role TEXT;
BEGIN
  -- Check if email is whitelisted
  SELECT EXISTS (
    SELECT 1 FROM public.admin_whitelist WHERE LOWER(email) = LOWER(new.email)
  ) INTO is_whitelisted;

  assigned_role := 'customer';

  -- System Root Fallback admin is always promoted, bypassing dynamic limits
  IF LOWER(new.email) = 'rishabhagarwal.me@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF is_whitelisted THEN
    -- Fetch active admin limit
    SELECT admin_limit INTO current_admin_limit FROM public.admin_settings WHERE id = 1;
    IF current_admin_limit IS NULL THEN
      current_admin_limit := 1;
    END IF;

    -- Count active admins
    SELECT COUNT(*) INTO current_admin_count FROM public.profiles WHERE role = 'admin';

    -- Allocate admin role if under the limit
    IF current_admin_count < current_admin_limit THEN
      assigned_role := 'admin';
    END IF;
  END IF;


  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    assigned_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Redefine is_admin() to check whitelist and root emails without profiles lookup
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN (
    LOWER(auth.jwt() ->> 'email') = 'rishabhagarwal.me@gmail.com'
    OR
    EXISTS (
      SELECT 1 FROM public.admin_whitelist 
      WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Storage Policies for Products Bucket
DROP POLICY IF EXISTS "Public Access to Products Bucket" ON storage.objects;
CREATE POLICY "Public Access to Products Bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admin Upload to Products Bucket" ON storage.objects;
CREATE POLICY "Admin Upload to Products Bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated' 
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin Update to Products Bucket" ON storage.objects;
CREATE POLICY "Admin Update to Products Bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated' 
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin Delete from Products Bucket" ON storage.objects;
CREATE POLICY "Admin Delete from Products Bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated' 
    AND public.is_admin()
  );


