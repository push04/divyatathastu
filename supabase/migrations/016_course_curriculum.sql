-- =============================================
-- MIGRATION 016 — Course Curriculum System
-- =============================================
-- Tables: course_modules, course_lessons
-- Storage: course-videos, course-pdfs buckets (private)
-- =============================================

-- 1. Course Modules (chapters / sections within a course)
CREATE TABLE IF NOT EXISTS public.course_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES public.service_items(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  display_order INT  DEFAULT 0,
  is_active     BOOL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Course Lessons (individual lessons within a module)
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id        UUID NOT NULL REFERENCES public.service_items(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  -- lesson_type: youtube | video | pdf | text
  lesson_type      TEXT NOT NULL DEFAULT 'youtube',
  -- For youtube: full YouTube URL
  -- For video/pdf: path within Supabase storage (e.g. "course-videos/lesson-id.mp4")
  -- For text: NULL (content is in content_text)
  content_url      TEXT,
  content_text     TEXT,
  duration_minutes INT,
  is_free_preview  BOOL DEFAULT false,
  display_order    INT  DEFAULT 0,
  is_active        BOOL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);

-- 4. RLS
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons  ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admin_all_course_modules" ON public.course_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_all_course_lessons" ON public.course_lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Enrolled students: read active modules for their courses
CREATE POLICY "enrolled_read_modules" ON public.course_modules
  FOR SELECT USING (
    is_active AND (
      EXISTS (
        SELECT 1 FROM public.service_bookings
        WHERE user_id = auth.uid()
          AND service_item_id = course_id
          AND payment_status = 'paid'
      )
    )
  );

-- Enrolled students: read active lessons (or free-preview lessons)
CREATE POLICY "enrolled_read_lessons" ON public.course_lessons
  FOR SELECT USING (
    is_active AND (
      is_free_preview
      OR EXISTS (
        SELECT 1 FROM public.service_bookings
        WHERE user_id = auth.uid()
          AND service_item_id = course_id
          AND payment_status = 'paid'
      )
    )
  );

-- 5. Storage buckets (private — require signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-videos', 'course-videos', false, 524288000, -- 500 MB limit
   ARRAY['video/mp4','video/webm','video/ogg','video/quicktime']),
  ('course-pdfs',   'course-pdfs',   false, 104857600, -- 100 MB limit
   ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: admins upload, enrolled users have no direct storage access (use signed URLs)
CREATE POLICY "admin_upload_course_videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-videos'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_course_videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-videos'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_delete_course_videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-videos'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_select_course_videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-videos'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_upload_course_pdfs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-pdfs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_update_course_pdfs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-pdfs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_delete_course_pdfs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-pdfs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_select_course_pdfs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-pdfs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
