-- ============================================================
-- WhatsApp Order Bot — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id                 BIGSERIAL PRIMARY KEY,
  order_number       TEXT        UNIQUE NOT NULL,
  customer_name      TEXT        NOT NULL,
  customer_phone     TEXT        NOT NULL,
  product_details    TEXT        NOT NULL,
  delivery_address   TEXT        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  notes              TEXT,
  estimated_delivery TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Status change audit log
CREATE TABLE IF NOT EXISTS public.order_status_log (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT      NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT        NOT NULL,
  changed_by  TEXT        NOT NULL DEFAULT 'system',
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_phone  ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- Row Level Security (RLS)
-- The API uses the service role key so RLS is bypassed server-side.
-- Enable RLS anyway to block any accidental anon/public access.
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_log ENABLE ROW LEVEL SECURITY;

-- No public policies → only service role can read/write.
