import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns a short-lived signed URL for reading a purchased ebook (1-hour expiry)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ebookId = req.nextUrl.searchParams.get('ebookId')
  if (!ebookId) return NextResponse.json({ error: 'Missing ebookId' }, { status: 400 })

  // Verify user has purchased this ebook
  const { data: purchase } = await supabase
    .from('ebook_purchases')
    .select('id, ebooks(id, title, author, file_url)')
    .eq('user_id', user.id)
    .eq('ebook_id', ebookId)
    .maybeSingle()

  if (!purchase) return NextResponse.json({ error: 'Not purchased' }, { status: 403 })

  const ebook = purchase.ebooks as any
  if (!ebook?.file_url) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  // Try to get a signed URL if this is a Supabase Storage URL
  let readUrl = ebook.file_url
  try {
    const fileUrl = new URL(ebook.file_url)
    // Supabase public URL pattern: /storage/v1/object/public/{bucket}/{path}
    const match = fileUrl.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
    if (match) {
      const [, bucket, path] = match
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600) // 1 hour
      if (signed?.signedUrl) readUrl = signed.signedUrl
    }
  } catch {
    // Non-storage URL, use as-is
  }

  return NextResponse.json({
    url: readUrl,
    title: ebook.title,
    author: ebook.author,
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
