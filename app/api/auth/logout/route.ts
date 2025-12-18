import { NextResponse } from 'next/server'

const ADMIN_SESSION_COOKIE = 'admin_session'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    response.cookies.delete(ADMIN_SESSION_COOKIE)
    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
