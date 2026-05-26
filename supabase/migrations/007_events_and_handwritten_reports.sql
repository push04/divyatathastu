-- =============================================
-- MIGRATION 007 — Events + Handwritten Reports
-- =============================================

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'satsang' CHECK (type IN ('satsang','workshop','webinar','pilgrimage','puja','other')),
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  location TEXT,
  meeting_link TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  max_attendees INTEGER,
  cover_image_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read" ON public.events
  FOR SELECT USING (is_published = true);

CREATE POLICY "events_admin_all" ON public.events
  FOR ALL USING (public.get_my_role() = 'admin');

-- Handwritten report requests table
CREATE TABLE IF NOT EXISTS public.handwritten_report_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'kundli' CHECK (report_type IN ('kundli','numerology','vastu','compatibility','career','health','custom')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  file_url TEXT,
  file_name TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.handwritten_report_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hrr_user_read_own" ON public.handwritten_report_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "hrr_user_insert" ON public.handwritten_report_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hrr_admin_all" ON public.handwritten_report_requests
  FOR ALL USING (public.get_my_role() = 'admin');

-- Storage: blog-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "blog_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "blog_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND public.get_my_role() = 'admin');

CREATE POLICY "blog_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'blog-images' AND public.get_my_role() = 'admin');

CREATE POLICY "blog_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'blog-images' AND public.get_my_role() = 'admin');

-- Storage: handwritten-reports bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('handwritten-reports', 'handwritten-reports', false, 20971520, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "hr_reports_user_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'handwritten-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "hr_reports_admin_all" ON storage.objects
  FOR ALL USING (bucket_id = 'handwritten-reports' AND public.get_my_role() = 'admin');
