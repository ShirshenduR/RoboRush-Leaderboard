import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const ADMIN_SESSION_COOKIE = 'admin_session'

function checkAuth() {
  const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE)
  return sessionCookie?.value === 'authenticated'
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { teamsList } = body

    const lines = teamsList.split('\n').map((line: string) => line.trim()).filter(Boolean)
    
    if (lines.length === 0) {
      return NextResponse.json({ error: 'No teams provided' }, { status: 400 })
    }

    const teamsToInsert = lines.map((teamName: string) => ({
      team_name: teamName,
      score: 0,
      status: 'active' as const,
    }))

    const { data, error } = await supabaseAdmin
      .from('teams')
      .insert(teamsToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Successfully imported ${lines.length} team(s)` 
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import teams' },
      { status: 500 }
    )
  }
}
