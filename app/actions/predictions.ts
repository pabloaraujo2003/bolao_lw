'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function savePrediction(gameId: number, predictedHome: number, predictedAway: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: game } = await supabase
    .from('games')
    .select('game_date, is_finished')
    .eq('id', gameId)
    .single()

  if (!game) return { error: 'Jogo não encontrado' }
  if (game.is_finished) return { error: 'Jogo já encerrado' }

  const cutoff = new Date(game.game_date).getTime() - 30 * 60 * 1000
  if (Date.now() >= cutoff) return { error: 'Prazo encerrado — palpites fechados 30 min antes do jogo' }

  const { error } = await supabase.from('predictions').upsert(
    { user_id: user.id, game_id: gameId, predicted_home: predictedHome, predicted_away: predictedAway },
    { onConflict: 'user_id,game_id' }
  )

  if (error) return { error: error.message }

  revalidatePath('/palpites')
  return { success: true }
}
