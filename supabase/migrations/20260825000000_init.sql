-- -------------------------------------------------------------
-- Dollysticart Init Migration: Core DB Tables, Triggers, & RLS
-- -------------------------------------------------------------

-- 1. Helper Function to Check Admin Role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN (LOWER(auth.jwt() ->> 'email') = 'rishabhagarwal.me@gmail.com');
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Categories Table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- 4. Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  regular_price INTEGER NOT NULL CHECK (regular_price >= 0),
  discounted_price INTEGER CHECK (discounted_price >= 0 AND discounted_price < regular_price),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);

-- 5. Product Images Table
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_product_images_product ON public.product_images(product_id);

-- 6. Homepage Sections Table (CMS)
CREATE TABLE public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('hero', 'promo', 'editorial', 'featured_products', 'grid')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  draft_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Cart Items Table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, product_id)
);
CREATE INDEX idx_cart_items_user ON public.cart_items(user_id);

-- 8. Wishlists Table
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, product_id)
);
CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);

-- 9. Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'shipped', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_razorpay_order ON public.orders(razorpay_order_id);

-- 10. Order Items Table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase INTEGER NOT NULL,
  discount_at_purchase INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- 11. Customize Requests Table
CREATE TABLE public.customize_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'responded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Contact Messages Table
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -------------------------------------------------------------
-- Triggers
-- -------------------------------------------------------------

-- Trigger function to create a profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN LOWER(new.email) = 'rishabhagarwal.me@gmail.com' THEN 'admin'
      ELSE 'customer'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to prevent non-admins from changing their role to admin
CREATE OR REPLACE FUNCTION public.check_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF old.role <> new.role AND NOT public.is_admin() THEN
    new.role := old.role; -- Revert to old role
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.check_profile_role_change();

-- -------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customize_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Categories Policies
CREATE POLICY categories_select_policy ON public.categories
  FOR SELECT USING (is_visible = true OR public.is_admin());

CREATE POLICY categories_admin_policy ON public.categories
  FOR ALL USING (public.is_admin());

-- Products Policies
CREATE POLICY products_select_policy ON public.products
  FOR SELECT USING (status = 'published' OR public.is_admin());

CREATE POLICY products_admin_policy ON public.products
  FOR ALL USING (public.is_admin());

-- Product Images Policies
CREATE POLICY product_images_select_policy ON public.product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_id AND (products.status = 'published' OR public.is_admin())
    )
  );

CREATE POLICY product_images_admin_policy ON public.product_images
  FOR ALL USING (public.is_admin());

-- Homepage Sections Policies
CREATE POLICY homepage_sections_select_policy ON public.homepage_sections
  FOR SELECT USING (is_visible = true OR public.is_admin());

CREATE POLICY homepage_sections_admin_policy ON public.homepage_sections
  FOR ALL USING (public.is_admin());

-- Cart Items Policies
CREATE POLICY cart_items_policy ON public.cart_items
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Wishlists Policies
CREATE POLICY wishlists_policy ON public.wishlists
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Orders Policies (Customers read-only, Admin full-access, Inserts/Updates handled server-side)
CREATE POLICY orders_select_policy ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY orders_admin_policy ON public.orders
  FOR ALL USING (public.is_admin());

-- Order Items Policies (Customers read-only, Admin full-access, Inserts/Updates handled server-side)
CREATE POLICY order_items_select_policy ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Customize Requests Policies (Public insert, admin full-access)
CREATE POLICY customize_requests_insert_policy ON public.customize_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY customize_requests_admin_policy ON public.customize_requests
  FOR ALL USING (public.is_admin());

-- Contact Messages Policies (Public insert, admin full-access)
CREATE POLICY contact_messages_insert_policy ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY contact_messages_admin_policy ON public.contact_messages
  FOR ALL USING (public.is_admin());
