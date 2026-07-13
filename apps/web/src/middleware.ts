/**
 * Next.js Edge Middleware — auth gate.
 *
 * ⚠️  DEV BYPASS ACTIVE when NEXT_PUBLIC_BYPASS_AUTH=true  ⚠️
 * Search for "BYPASS_AUTH" across the codebase before shipping to production.
 * It must be removed (or the env var unset) before any real users touch this.
 *
 * When Clerk is wired up:
 *   1. `npm install @clerk/nextjs` in apps/web
 *   2. Replace the bypass block below with:
 *        import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
 *        const isPublic = createRouteMatcher(['/login(.*)', '/signup(.*)', '/pricing(.*)', '/', '/forgot-password(.*)'])
 *        export default clerkMiddleware((auth, req) => {
 *          if (!isPublic(req)) auth().protect()
 *        })
 *   3. Remove NEXT_PUBLIC_BYPASS_AUTH from .env.local
 *   4. Delete this comment block
 */

import { NextResponse, type NextRequest } from 'next/server'

// Routes that are always public — no auth required.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/forgot-password',
  // Static assets & Next internals — never intercept.
  '/_next',
  '/favicon',
  '/api',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── DEV BYPASS ──────────────────────────────────────────────────────────────
  // NEXT_PUBLIC_BYPASS_AUTH=true skips all auth checks so you can explore the
  // UI without Clerk keys configured.
  //
  // ⚠️  TODO: remove this block (and unset the env var) before going to prod.
  // ────────────────────────────────────────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.next()
  }

  // If the path is public, let it through.
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // No auth yet — redirect unauthenticated visitors to login.
  // This will be replaced by Clerk's `auth().protect()` once keys are set up.
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Run on all paths except static file extensions.
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|woff2?|ttf|otf|css|js|map)$).*)'],
}
