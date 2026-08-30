-- Migration: 20260830000002_seed_categories.sql
-- Seed default shop categories into Supabase PostgreSQL database with valid UUIDs

INSERT INTO public.categories (id, name, slug, description, parent_id, is_visible, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Original Art', 'original-art', 'Hand-painted textured canvas original artworks', NULL, true, 1),
  ('c2000000-0000-0000-0000-000000000002', 'Art Prints', 'art-prints', 'High quality giclée fine art prints', NULL, true, 2),
  ('c3000000-0000-0000-0000-000000000003', 'Calendar', 'calendar', 'Textured palette aesthetic calendars', NULL, true, 3),
  ('c4000000-0000-0000-0000-000000000004', 'Art Products', 'art-products', 'Collectible art merchandise and accessories', NULL, true, 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.categories (id, name, slug, description, parent_id, is_visible, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Bookmarks', 'bookmarks', 'Hand-painted cardstock bookmarks', 'c4000000-0000-0000-0000-000000000004', true, 1),
  ('b0000000-0000-0000-0000-000000000002', 'Stationery', 'stationery', 'Aesthetic notebooks, post-it pads & journals', 'c4000000-0000-0000-0000-000000000004', true, 2),
  ('b0000000-0000-0000-0000-000000000003', 'Fridge Magnets', 'fridge-magnets', 'Textured mini canvas magnets', 'c4000000-0000-0000-0000-000000000004', true, 3),
  ('b0000000-0000-0000-0000-000000000004', 'Stickers', 'stickers', 'Waterproof vinyl art stickers', 'c4000000-0000-0000-0000-000000000004', true, 4),
  ('b0000000-0000-0000-0000-000000000005', 'Badges', 'badges', 'Aesthetic enamel & button art pins', 'c4000000-0000-0000-0000-000000000004', true, 5),
  ('b0000000-0000-0000-0000-000000000006', 'Apparels', 'apparels', 'Wearable art apparel & organic totes', 'c4000000-0000-0000-0000-000000000004', true, 6),
  ('b0000000-0000-0000-0000-000000000007', 'Mugs', 'mugs', 'Ceramic art prints & impasto mugs', 'c4000000-0000-0000-0000-000000000004', true, 7),
  ('b0000000-0000-0000-0000-000000000008', 'Phone Cases', 'phone-cases', 'Textured art protective phone covers', 'c4000000-0000-0000-0000-000000000004', true, 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order;
