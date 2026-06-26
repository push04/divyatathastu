import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

function generateRoomName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
  const rand = Math.random().toString(36).slice(2, 8)
  return `mt-${slug}-${rand}`
}

export async function GET() {
  const supabase = await createClient()
  const admin = await assertAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase as any)
    .from('webinars')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ webinars: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = await assertAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, host_name, scheduled_at, duration_minutes, max_participants, price } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const livekit_room_name = generateRoomName(title)

  const { data, error } = await (supabase as any)
    .from('webinars')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      host_name: host_name?.trim() || 'MahaTathastu Team',
      scheduled_at: scheduled_at || null,
      duration_minutes: Number(duration_minutes) || 60,
      max_participants: Number(max_participants) || 50,
      price: Number(price) || 0,
      livekit_room_name,
      status: 'upcoming',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ webinar: data })
}
