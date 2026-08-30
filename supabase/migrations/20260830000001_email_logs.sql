-- -------------------------------------------------------------
-- Dollysticart Migration: Email Logs & Courier Tracking
-- -------------------------------------------------------------

-- 1. Create email_logs table for tracking dispatches and idempotency
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  brevo_template_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_email_logs_order ON public.email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_event ON public.email_logs(event_type, order_id);

-- 2. Add Courier Tracking Columns to Orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- 3. Enable RLS on email_logs table
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_logs_admin_policy ON public.email_logs
  FOR ALL USING (public.is_admin());
