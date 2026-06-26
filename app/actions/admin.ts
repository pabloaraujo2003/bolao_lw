'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchFinishedFixturesSince, mapFixtureToGame } from '@/lib/api-football'
import { calcPoints } from '@/lib/scoring'
import { invalidate } from '@/lib/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Acesso negado')
  return user
}

export async function updateGameResult(gameId: number, homeScore: number, awayScore: number) {
  await assertAdmin()
  const admin = createAdminClient()

  const { error: gameErr } = await admin
    .from('games')
    .update({ home_score: homeScore, away_score: awayScore, is_finished: true })
    .eq('id', gameId)

  if (gameErr) return { error: gameErr.message }

  const { data: predictions } = await admin
    .from('predictions')
    .select('id, predicted_home, predicted_away')
    .eq('game_id', gameId)

  if (predictions?.length) {
    const updates = predictions.map((p) => ({
      id: p.id,
      points: calcPoints(p.predicted_home, p.predicted_away, homeScore, awayScore),
    }))
    for (const u of updates) {
      await admin.from('predictions').update({ points: u.points }).eq('id', u.id)
    }
  }

  await invalidate('games', 'ranking')
  revalidatePath('/palpites')
  revalidatePath('/admin/resultados')
  revalidatePath('/ranking')
  revalidatePath('/')
  return { success: true }
}

export async function togglePayment(userId: string, paid: boolean) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ paid }).eq('id', userId)
  if (error) return { error: error.message }
  await invalidate('total-paid', `profile:${userId}`)
  revalidatePath('/admin/participantes')
  revalidatePath('/premiacao')
  revalidatePath('/')
  return { success: true }
}

export async function forceSyncResults(): Promise<{ success?: boolean; gamesUpdated?: number; error?: string }> {
  try {
    await assertAdmin()
  } catch (e: any) {
    return { error: e.message }
  }
  const admin = createAdminClient()

  try {
    const data = await fetchFinishedFixturesSince('')
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

    if (gamesUpdated > 0) {
      await invalidate('games', 'ranking')
    }

    revalidatePath('/palpites')
    revalidatePath('/ranking')
    revalidatePath('/admin/resultados')
    revalidatePath('/')

    return { success: true, gamesUpdated }
  } catch (err: any) {
    await admin.from('sync_log').insert({ games_updated: 0, status: 'error', error_msg: err.message })
    return { error: err.message }
  }
}

export async function updateSettings(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    await assertAdmin()
  } catch (e: any) {
    return { error: e.message }
  }
  const admin = createAdminClient()
  const keys = ['entry_fee', 'prize_1st_pct', 'prize_2nd_pct', 'prize_3rd_pct', 'pix_key', 'pool_name']
  for (const key of keys) {
    const value = formData.get(key) as string
    if (value !== null) {
      await admin.from('settings').upsert({ key, value })
    }
  }
  await invalidate('settings')
  revalidatePath('/admin/configuracoes')
  revalidatePath('/')
  revalidatePath('/premiacao')
  return { success: true }
}
