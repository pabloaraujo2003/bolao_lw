import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedGames } from '@/lib/cache'
import { GameCard } from '@/components/GameCard'
import type { GameWithPrediction } from '@/lib/types'

export default async function PalpitesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const [games, { data: predictions }] = await Promise.all([
    getCachedGames(),
    supabase.from('predictions').select('game_id, predicted_home, predicted_away, points').eq('user_id', session.user.id),
  ])

  const predMap = new Map(predictions?.map((p) => [p.game_id, p]) ?? [])

  const gamesWithPreds: GameWithPrediction[] = games.map((g) => ({
    ...g,
    prediction: predMap.get(g.id),
  }))

  const upcoming = gamesWithPreds.filter((g) => !g.is_finished)
  const finished = gamesWithPreds.filter((g) => g.is_finished)

  return (
    <div>
      {/* Header */}
      <div className="fade-1" style={{ marginBottom: '1.75rem' }}>
        <h1 className="display" style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          Meus Palpites
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
          Envie seu palpite até 30 min antes do início de cada jogo.
        </p>
      </div>

      {games.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          Nenhum jogo cadastrado ainda. Aguarde o admin importar os jogos da Copa 2026.
        </div>
      )}

      {upcoming.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px',
          }}>
            <span className="live-dot" />
            <span className="section-label">Jogos abertos · {upcoming.length}</span>
          </div>
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {upcoming.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <div style={{ marginBottom: '14px' }}>
            <span className="section-label">Jogos encerrados · {finished.length}</span>
          </div>
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {finished.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
          </div>
        </section>
      )}
    </div>
  )
}
