import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWebinarInviteEmail } from '@/lib/email'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const admin = await assertAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { emails, recipientName } = await req.json()

  if (!emails?.length) return NextResponse.json({ error: 'No emails provided' }, { status: 400 })

  const { data: webinar, error } = await (supabase as any)
    .from('webinars')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !webinar) return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })

  const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://mahatathastu.com'
  const joinUrl = `${APP}/webinar/${id}`

  const results: { email: string; ok: boolean; error?: string }[] = []
  for (const email of emails as string[]) {
    try {
      await sendWebinarInviteEmail(
        email.trim(),
        recipientName || 'Seeker',
        webinar.title,
        webinar.host_name,
        webinar.scheduled_at,
        webinar.duration_minutes,
        joinUrl,
      )
      results.push({ email, ok: true })
    } catch (err: any) {
      results.push({ email, ok: false, error: err.message })
    }
  }

  return NextResponse.json({ results })
}
