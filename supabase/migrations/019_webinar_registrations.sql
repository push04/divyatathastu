-- Tracks who has registered/paid for a webinar
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id          UUID         NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status      TEXT         NOT NULL DEFAULT 'pending'
                                     CHECK (payment_status IN ('pending','paid')),
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  amount              NUMERIC(10,2) NOT NULL DEFAULT 0,
  registered_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (webinar_id, user_id)
);

ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Users see only their own registrations
CREATE POLICY "webinar_reg_own" ON public.webinar_registrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins see everything
CREATE POLICY "webinar_reg_admin" ON public.webinar_registrations
  FOR ALL TO authenticated
  USING     ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
