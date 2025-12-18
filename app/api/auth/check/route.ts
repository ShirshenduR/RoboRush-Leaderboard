import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'

export async function GET() {
  try {
    const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE)
    const isAuthenticated = sessionCookie?.value === 'authenticated'
    
    console.log('Auth check - Cookie present:', !!sessionCookie, 'Authenticated:', isAuthenticated)
    
    return NextResponse.json({ 
      authenticated: isAuthenticated 
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
