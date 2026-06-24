import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchFinishedFixturesSince, mapFixtureToGame } from '@/lib/api-football'
import { calcPoints } from '@/lib/scoring'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()

  try {
    // Pega a data do último sync bem-sucedido
    const { data: lastSync } = await admin
      .from('sync_log')
      .select('synced_at')
      .eq('status', 'success')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single()

    const since = lastSync?.synced_at ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const data = await fetchFinishedFixturesSince(since)
    // football-data.org retorna todos os jogos no campo "matches"
    const allMatches = data?.matches ?? data?.response ?? []
    const fixtures = allMatches.filter(
      (m: any) => m.status === 'FINISHED' && m.homeTeam?.name && m.awayTeam?.name
    )

    let gamesUpdated = 0

    for (const fixture of fixtures) {
      const game = mapFixtureToGame(fixture)
      if (game.home_score === null || game.away_score === null) continue

      const { error: gameErr } = await admin.from('games').upsert(game, { onConflict: 'api_fixture_id' })
      if (gameErr) continue

      // Recalcula pontos dos palpites desse jogo
      const { data: predictions } = await admin
        .from('predictions')
        .select('id, predicted_home, predicted_away')
        .eq('game_id', game.id)

      if (predictions?.length) {
        for (const p of predictions) {
          const points = calcPoints(p.predicted_home, p.predicted_away, game.home_score, game.away_score)
          await admin.from('predictions').update({ points }).eq('id', p.id)
        }
      }

      gamesUpdated++
    }

    await admin.from('sync_log').insert({ games_updated: gamesUpdated, status: 'success' })

    return NextResponse.json({ ok: true, gamesUpdated })
  } catch (err: any) {
    await admin.from('sync_log').insert({ games_updated: 0, status: 'error', error_msg: err.message })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
