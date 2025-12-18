import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const ADMIN_SESSION_COOKIE = 'admin_session'

function checkAuth() {
  const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE)
  return sessionCookie?.value === 'authenticated'
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 0 // No caching for real-time updates
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('score', { ascending: false })
      .order('team_name', { ascending: true })

    if (error) throw error

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'CDN-Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { team_name } = body

    const { data, error } = await supabaseAdmin
      .from('teams')
      .insert({
        team_name,
        score: 0,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
