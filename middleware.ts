import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Agency routes - only accessible by agency staff
    if (path.startsWith('/agency')) {
      if (!token || (token.role !== 'AGENCY_ADMIN' && token.role !== 'AGENCY_STAFF')) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // Client routes - only accessible by clients
    if (path.startsWith('/client')) {
      if (!token || (token.role !== 'CLIENT_ADMIN' && token.role !== 'CLIENT_USER')) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Public routes
        if (path === '/login' || path === '/') {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/agency/:path*', '/client/:path*', '/api/:path*'],
}

