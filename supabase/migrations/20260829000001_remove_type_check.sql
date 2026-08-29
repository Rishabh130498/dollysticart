-- Remove rigid check constraint on homepage_sections type to support extensible component types
ALTER TABLE public.homepage_sections DROP CONSTRAINT IF EXISTS homepage_sections_type_check;
