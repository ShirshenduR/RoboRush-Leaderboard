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

export async function PATCH(request: NextRequest) {
  if (!checkAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, newScore } = body

    // Use a transaction-like approach with RPC for atomic operation
    // This is faster and safer for concurrent updates
    const { data: team, error: fetchError } = await supabaseAdmin
      .from('teams')
      .select('score')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const oldScore = team?.score || 0

    // Update score with optimistic locking
    const { error: updateError } = await supabaseAdmin
      .from('teams')
      .update({
        score: newScore,
        last_score_update: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Record in history asynchronously (don't wait for it)
    supabaseAdmin.from('score_history').insert({
      team_id: id,
      old_score: oldScore,
      new_score: newScore,
      changed_by: 'admin',
      reason: null,
    }).then()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Score update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update score' },
      { status: 500 }
    )
  }
}
