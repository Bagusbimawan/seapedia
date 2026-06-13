import { type NextRequest, NextResponse } from 'next/server'

const PROTECTED_PREFIXES = ['/buyer', '/seller', '/driver', '/admin', '/role-select']
const AUTH_ONLY_PATHS = ['/login', '/register']

function getStartsWithProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function getRoleDashboard(role: string): string {
  return `/${role.toLowerCase()}`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('seapedia-token')?.value
  const role = request.cookies.get('seapedia-role')?.value

  const isProtected = getStartsWithProtected(pathname)
  const isAuthOnly = AUTH_ONLY_PATHS.includes(pathname)

  // Case 1: No token + trying to access protected route → redirect to login
  if (!token && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Case 2: Has token + trying to access auth-only pages → redirect to dashboard
  if (token && isAuthOnly) {
    if (role && role !== 'PENDING') {
      return NextResponse.redirect(new URL(getRoleDashboard(role), request.url))
    }
    // If role is PENDING, redirect to role-select
    return NextResponse.redirect(new URL('/role-select', request.url))
  }

  // Case 3: Has token but role=PENDING + not on /role-select → redirect to /role-select
  if (token && role === 'PENDING' && pathname !== '/role-select') {
    // Allow access to public pages (landing, products) even when PENDING
    const isPublicPath =
      pathname === '/' ||
      pathname.startsWith('/products') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api')

    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/role-select', request.url))
    }
  }

  // Case 4: Role-based route protection
  if (token && role && role !== 'PENDING') {
    const roleRoutes: Record<string, string> = {
      BUYER: '/buyer',
      SELLER: '/seller',
      DRIVER: '/driver',
      ADMIN: '/admin',
    }
    const allowedPrefix = roleRoutes[role]
    const dashboardPrefixes = ['/buyer', '/seller', '/driver', '/admin']
    const accessingDashboard = dashboardPrefixes.some((p) => pathname.startsWith(p))
    if (accessingDashboard && allowedPrefix && !pathname.startsWith(allowedPrefix) && pathname !== '/role-select') {
      return NextResponse.redirect(new URL(allowedPrefix, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
