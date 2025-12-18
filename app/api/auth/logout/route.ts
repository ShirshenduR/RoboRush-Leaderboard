import { NextResponse } from 'next/server'

const ADMIN_SESSION_COOKIE = 'admin_session'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
