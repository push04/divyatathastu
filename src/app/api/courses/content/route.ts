import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/courses/content?courseId=xxx
// Returns modules + lessons for an enrolled user or admin.
// Storage-based lesson URLs (video/pdf) are replaced with 4-hour signed URLs.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  // Check admin or enrollment
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: booking } = await (supabase as any)
      .from('service_bookings')
      .select('id')
      .eq('user_id', user.id)
      .eq('service_item_id', courseId)
      .eq('payment_status', 'paid')
      .maybeSingle()

    if (!booking) return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
  }

  // Load modules
  const { data: modules, error: modErr } = await (supabase as any)
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('display_order')

  if (modErr) return NextResponse.json({ error: modErr.message }, { status: 500 })

  // Load lessons for all modules
  const { data: lessons, error: lesErr } = await (supabase as any)
    .from('course_lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('display_order')

  if (lesErr) return NextResponse.json({ error: lesErr.message }, { status: 500 })

  // Generate signed URLs for storage-based lessons (video + pdf)
  const signedLessons = await Promise.all((lessons || []).map(async (lesson: any) => {
    if ((lesson.lesson_type === 'video' || lesson.lesson_type === 'pdf') && lesson.content_url) {
      const bucket = lesson.lesson_type === 'video' ? 'course-videos' : 'course-pdfs'
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(lesson.content_url, 60 * 60 * 4) // 4 hours
      return { ...lesson, signed_url: signed?.signedUrl || null }
    }
    return lesson
  }))

  // Group lessons by module
  const modulesWithLessons = (modules || []).map((mod: any) => ({
    ...mod,
    lessons: signedLessons.filter((l: any) => l.module_id === mod.id),
  }))

  return NextResponse.json({ modules: modulesWithLessons })
}
