import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_SECRET = process.env.ADMIN_PASSWORD || 'change-me-in-production'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (password === SESSION_SECRET) {
      const response = NextResponse.json({ success: true })
      
      response.cookies.set(ADMIN_SESSION_COOKIE, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours
      })
      
      return response
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
