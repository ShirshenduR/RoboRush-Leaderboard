import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // No special CORS headers needed for same-origin API routes
  return response
}

export const config = {
  matcher: '/api/:path*',
}
