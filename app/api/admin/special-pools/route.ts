import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const [{ data: pools }, { data: games }] = await Promise.all([
    admin.from('special_pools').select('*, game:games(id, home_team, away_team, game_date)').order('created_at', { ascending: false }),
    admin.from('games').select('id, home_team, away_team, game_date').order('game_date'),
  ])

  return NextResponse.json({ pools: pools ?? [], games: games ?? [] })
}
