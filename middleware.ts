import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize Supabase Client for Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Handle unauthenticated users
  if (!user) {
    // If they are trying to access a protected route (anything not auth, public token, or root)
    if (!pathname.startsWith('/login') && !pathname.startsWith('/public') && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Handle authenticated users
  // Fetch user role from custom users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = userData?.role || 'team_member'

  // If authenticated user goes to login, redirect to dashboard
  if (pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  // Route-based Access Control (RBAC)
  
  // Leader-only routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'leader') {
      // Team members get redirected to their dashboard overview
      return NextResponse.redirect(new URL('/overview', request.url))
    }
  }

  // External viewers trying to access internal routes
  if (role === 'external_viewer' && !pathname.startsWith('/public')) {
      return NextResponse.redirect(new URL('/public/unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
