import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedGames } from '@/lib/cache'
import { GameCard } from '@/components/GameCard'
import type { GameWithPrediction } from '@/lib/types'

const KNOCKOUT_STAGES = ['Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Third Place', 'Final']

function isKnockout(stage: string) {
  return KNOCKOUT_STAGES.includes(stage)
}

function GameSection({
  label,
  games,
  dot,
}: {
  label: string
  games: GameWithPrediction[]
  dot?: boolean
}) {
  if (games.length === 0) return null
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        {dot && <span className="live-dot" />}
        <span className="section-label">{label} · {games.length}</span>
      </div>
      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {games.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
      </div>
    </div>
  )
}

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
  const finished = gamesWithPreds.filter((g) => g.is_finished).reverse()

  const upcomingKnockout = upcoming.filter((g) => isKnockout(g.stage))
  const upcomingGroup = upcoming.filter((g) => !isKnockout(g.stage))

  const finishedKnockout = finished.filter((g) => isKnockout(g.stage))
  const finishedGroup = finished.filter((g) => !isKnockout(g.stage))

  const hasUpcoming = upcoming.length > 0
  const hasFinished = finished.length > 0

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

      {/* Jogos abertos */}
      {hasUpcoming && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span className="live-dot" />
            <span className="section-label">Jogos abertos · {upcoming.length}</span>
          </div>

          {upcomingKnockout.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '8px',
              }}>
                Mata-Mata
              </div>
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {upcomingKnockout.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
              </div>
            </div>
          )}

          {upcomingGroup.length > 0 && (
            <div>
              {upcomingKnockout.length > 0 && (
                <div style={{
                  fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px',
                }}>
                  Fase de Grupos
                </div>
              )}
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {upcomingGroup.map((g, i) => <GameCard key={g.id} game={g} index={i + upcomingKnockout.length} />)}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Jogos encerrados */}
      {hasFinished && (
        <section>
          <div style={{ marginBottom: '16px' }}>
            <span className="section-label">Jogos encerrados · {finished.length}</span>
          </div>

          {finishedKnockout.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '8px',
              }}>
                Mata-Mata
              </div>
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {finishedKnockout.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
              </div>
            </div>
          )}

          {finishedGroup.length > 0 && (
            <div>
              {finishedKnockout.length > 0 && (
                <div style={{
                  fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px',
                }}>
                  Fase de Grupos
                </div>
              )}
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {finishedGroup.map((g, i) => <GameCard key={g.id} game={g} index={i + finishedKnockout.length} />)}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
