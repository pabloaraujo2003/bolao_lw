import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchAllFixtures, mapFixtureToGame } from '@/lib/api-football'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  try {
    const data = await fetchAllFixtures()
    const allMatches = data?.matches ?? data?.response ?? []
    const fixtures = allMatches.filter((m: any) => m.homeTeam?.name && m.awayTeam?.name)

    if (!fixtures.length) {
      return NextResponse.json({ error: 'Nenhum jogo retornado pela API. Verifique a FOOTBALL_DATA_TOKEN.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const games = fixtures.map(mapFixtureToGame)

    const { error } = await admin.from('games').upsert(games, { onConflict: 'api_fixture_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ imported: games.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
