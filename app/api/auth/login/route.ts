import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_SECRET = process.env.ADMIN_PASSWORD || 'change-me-in-production'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    console.log('Login attempt - Password matches:', password === SESSION_SECRET)
    console.log('Environment:', process.env.NODE_ENV)
    
    if (password === SESSION_SECRET) {
      const response = NextResponse.json({ success: true })
      
      // Set cookie with production settings
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours
      }
      
      response.cookies.set(ADMIN_SESSION_COOKIE, 'authenticated', cookieOptions)
      
      console.log('Cookie set with options:', cookieOptions)
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
