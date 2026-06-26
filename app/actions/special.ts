'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchMatchDetail, deriveAnswersFromMatch } from '@/lib/api-football'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Acesso negado')
  return user
}

// ── User actions ──────────────────────────────────────────────

export async function joinPool(poolId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('special_participants').insert({ user_id: user.id, pool_id: poolId })
  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath('/boloes')
  revalidatePath(`/boloes/${poolId}`)
  return { success: true }
}

export async function saveSpecialAnswers(poolId: string, answers: Record<string, string>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: pool } = await supabase.from('special_pools').select('is_open').eq('id', poolId).single()
  if (!pool?.is_open) return { error: 'Bolão encerrado' }

  const rows = Object.entries(answers).map(([question_id, answer]) => ({
    user_id: user.id,
    question_id,
    answer,
    points: 0,
  }))

  const { error } = await supabase.from('special_answers').upsert(rows, { onConflict: 'user_id,question_id' })
  if (error) return { error: error.message }

  revalidatePath(`/boloes/${poolId}`)
  return { success: true }
}

// ── Admin actions ─────────────────────────────────────────────

export async function createSpecialPool(formData: FormData) {
  try { await assertAdmin() } catch (e: any) { return { error: e.message } }
  const admin = createAdminClient()

  const name = formData.get('name') as string
  const game_id = formData.get('game_id') ? Number(formData.get('game_id')) : null
  const entry_fee = Number(formData.get('entry_fee') ?? 10)

  const { data, error } = await admin.from('special_pools').insert({ name, game_id, entry_fee }).select('id').single()
  if (error) return { error: error.message }

  revalidatePath('/admin/boloes')
  return { success: true, id: data.id }
}

export async function updateSpecialPool(poolId: string, formData: FormData) {
  try { await assertAdmin() } catch (e: any) { return { error: e.message } }
  const admin = createAdminClient()

  const name = formData.get('name') as string
  const is_open = formData.get('is_open') === 'true'
  const entry_fee = Number(formData.get('entry_fee') ?? 10)

  const { error } = await admin.from('special_pools').update({ name, is_open, entry_fee }).eq('id', poolId)
  if (error) return { error: error.message }

  revalidatePath('/admin/boloes')
  revalidatePath(`/admin/boloes/${poolId}`)
  return { success: true }
}

export async function addQuestion(poolId: string, formData: FormData) {
  try { await assertAdmin() } catch (e: any) { return { error: e.message } }
  const admin = createAdminClient()

  const question = formData.get('question') as string
  const metric_type = (formData.get('metric_type') as string) || null
  const points = Number(formData.get('points') ?? 2)
  const rawOptions = formData.get('options') as string
  const options = rawOptions.split('\n').map((o) => o.trim()).filter(Boolean)

  const { data: last } = await admin
    .from('special_questions')
    .select('order_index')
    .eq('pool_id', poolId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const order_index = (last?.order_index ?? -1) + 1

  const { error } = await admin.from('special_questions').insert({ pool_id: poolId, question, options, metric_type, points, order_index })
  if (error) return { error: error.message }

  revalidatePath(`/admin/boloes/${poolId}`)
  return { success: true }
}

export async function deleteQuestion(questionId: string, poolId: string) {
  try { await assertAdmin() } catch (e: any) { return { error: e.message } }
  const admin = createAdminClient()
  const { error } = await admin.from('special_questions').delete().eq('id', questionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/boloes/${poolId}`)
  return { success: true }
}

export async function toggleParticipantPayment(userId: string, poolId: string, paid: boolean) {
  try { await assertAdmin() } catch (e: any) { return { error: e.message } }
  const admin = createAdminClient()
  const { error } = await admin.from('special_participants').update({ paid }).eq('user_id', userId).eq('pool_id', poolId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/boloes/${poolId}`)
  return { success: true }
}

export async function syncSpecialResults(poolId: string) {
  try { await assertAdmin() } catch (e: any) { return { error: e.message } }
  const admin = createAdminClient()

  const { data: pool } = await admin
    .from('special_pools')
    .select('*, game:games(api_fixture_id)')
    .eq('id', poolId)
    .single()

  if (!pool?.game?.api_fixture_id) return { error: 'Jogo não vinculado ou sem ID da API' }

  const matchData = await fetchMatchDetail(pool.game.api_fixture_id)
  const derived = deriveAnswersFromMatch(matchData)

  const { data: questions } = await admin
    .from('special_questions')
    .select('id, metric_type, correct_answer')
    .eq('pool_id', poolId)

  let updated = 0
  for (const q of questions ?? []) {
    if (!q.metric_type) continue
    const answer = derived[q.metric_type]
    if (!answer) continue

    await admin.from('special_questions').update({ correct_answer: answer }).eq('id', q.id)
    updated++
  }

  await recalcSpecialPoints(poolId)

  revalidatePath(`/admin/boloes/${poolId}`)
  revalidatePath(`/boloes/${poolId}`)
  return { success: true, updated }
}

export async function setCorrectAnswer(questionId: string, poolId: string, correct_answer: string) {
  try { await assertAdmin() } catch (e: any) { return { error: e.message } }
  const admin = createAdminClient()
  const { error } = await admin.from('special_questions').update({ correct_answer }).eq('id', questionId)
  if (error) return { error: error.message }

  await recalcSpecialPoints(poolId)
  revalidatePath(`/admin/boloes/${poolId}`)
  revalidatePath(`/boloes/${poolId}`)
  return { success: true }
}

async function recalcSpecialPoints(poolId: string) {
  const admin = createAdminClient()

  const { data: questions } = await admin
    .from('special_questions')
    .select('id, correct_answer, points')
    .eq('pool_id', poolId)
    .not('correct_answer', 'is', null)

  for (const q of questions ?? []) {
    const { data: answers } = await admin
      .from('special_answers')
      .select('id, answer')
      .eq('question_id', q.id)

    for (const a of answers ?? []) {
      const pts = a.answer.trim().toLowerCase() === q.correct_answer!.trim().toLowerCase() ? q.points : 0
      await admin.from('special_answers').update({ points: pts }).eq('id', a.id)
    }
  }
}
