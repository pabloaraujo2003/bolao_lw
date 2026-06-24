import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GameCard } from '@/components/GameCard'
import type { GameWithPrediction } from '@/lib/types'

export default async function PalpitesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const [{ data: games }, { data: predictions }] = await Promise.all([
    supabase.from('games').select('*').order('game_date', { ascending: true }),
    supabase.from('predictions').select('game_id, predicted_home, predicted_away, points').eq('user_id', session.user.id),
  ])

  const predMap = new Map(predictions?.map((p) => [p.game_id, p]) ?? [])

  const gamesWithPreds: GameWithPrediction[] = (games ?? []).map((g) => ({
    ...g,
    prediction: predMap.get(g.id),
  }))

  const upcoming = gamesWithPreds.filter((g) => !g.is_finished)
  const finished = gamesWithPreds.filter((g) => g.is_finished)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#F0F4F8' }}>Meus Palpites</h1>

      {!games?.length && (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#162233', color: '#7A8FA6' }}>
          Nenhum jogo cadastrado ainda. Aguarde o admin importar os jogos da Copa 2026.
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#7A8FA6' }}>
            Jogos abertos ({upcoming.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#7A8FA6' }}>
            Jogos encerrados ({finished.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {finished.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}
