import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'

export async function GET() {
  try {
    const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE)
    const isAuthenticated = sessionCookie?.value === 'authenticated'
    
    return NextResponse.json({ authenticated: isAuthenticated })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
