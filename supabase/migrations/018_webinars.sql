-- Webinars: group video sessions created by admin, joinable via a shareable link.
-- Architecture mirrors courses (service_items) but is self-contained since
-- webinars don't need curriculum/modules.

CREATE TABLE IF NOT EXISTS public.webinars (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT        NOT NULL,
  description       TEXT,
  host_name         TEXT        NOT NULL DEFAULT 'MahaTathastu Team',
  scheduled_at      TIMESTAMPTZ,
  duration_minutes  INT         NOT NULL DEFAULT 60,
  max_participants  INT         NOT NULL DEFAULT 50,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  livekit_room_name TEXT        UNIQUE NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'upcoming'
                                  CHECK (status IN ('upcoming','live','ended')),
  is_public         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "webinars_admin_all" ON public.webinars
  FOR ALL TO authenticated
  USING     ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Anyone with the link can read webinar metadata to render the join page
CREATE POLICY "webinars_read_all" ON public.webinars
  FOR SELECT TO anon, authenticated
  USING (true);
