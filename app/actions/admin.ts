'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
