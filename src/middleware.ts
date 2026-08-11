import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard',
  '/family',
  '/reports',
  '/ai-guide',
  '/orders',
  '/consultations',
  '/mailbox',
  '/my-library',
  '/social',
  '/settings',
  '/handwritten-report',
  '/shop/checkout',
  // Reviews are members-only by design, and referral links/credits are
  // per-account, so both belong behind the login wall.
  '/reviews',
  '/refer',
]

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // HIGH-4: Protect all /api/admin/* routes at the middleware level (defense-in-depth)
  if (path.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const isProtected = PROTECTED_PATHS.some(p => path === p || path.startsWith(p + '/'))

  if (isProtected && !user) {
    // Send existing users to /login, not /register. Pointing this at /register
    // was half of a redirect ping-pong: a sign-in whose cookies had not yet
    // landed bounced /dashboard → /register, and /register (which by then DID
    // see the cookies) bounced straight back to /dashboard. During a soft
    // client-side navigation that loop simply stalls, which is why the
    // dashboard appeared to hang until a manual refresh.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if ((path === '/login' || path === '/register') && user) {
    // Honour ?redirect= so a bounced deep link resumes where it left off.
    // It must be a relative in-app path - an absolute URL here would be an
    // open redirect straight off the site.
    const wanted = request.nextUrl.searchParams.get('redirect')
    const safe = wanted && wanted.startsWith('/') && !wanted.startsWith('//') ? wanted : '/dashboard'
    return NextResponse.redirect(new URL(safe, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
