import { createClient } from '@/lib/supabase/server'
import { getCachedRanking, getCachedSettings, getCachedTotalPaid } from '@/lib/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { RankingTable } from '@/components/RankingTable'
import type { PredictionHistoryByUser, PredictionHistoryRow } from '@/lib/types'

type PredictionHistoryRecord = Omit<PredictionHistoryRow, 'game'> & {
  games: PredictionHistoryRow['game'] | PredictionHistoryRow['game'][] | null
}

async function getPredictionHistory(): Promise<PredictionHistoryByUser> {
  const admin = createAdminClient()
  const closedCutoff = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const { data } = await admin
    .from('predictions')
    .select(`
      user_id,
      game_id,
      predicted_home,
      predicted_away,
      points,
      created_at,
      games!inner(
        home_team,
        away_team,
        home_flag,
        away_flag,
        game_date,
        stage,
        group_name,
        home_score,
        away_score,
        is_finished
      )
    `)
    .lte('games.game_date', closedCutoff)
    .order('game_date', { referencedTable: 'games', ascending: false })

  const history = ((data as PredictionHistoryRecord[] | null) ?? []).reduce<PredictionHistoryByUser>((acc, row) => {
    const game = Array.isArray(row.games) ? row.games[0] : row.games
    if (!game) return acc

    acc[row.user_id] ??= []
    acc[row.user_id].push({
      user_id: row.user_id,
      game_id: row.game_id,
      predicted_home: row.predicted_home,
      predicted_away: row.predicted_away,
      points: row.points,
      created_at: row.created_at,
      game,
    })
    return acc
  }, {})

  for (const rows of Object.values(history)) {
    rows.sort((a, b) => new Date(b.game.game_date).getTime() - new Date(a.game.game_date).getTime())
  }

  return history
}

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [ranking, s, totalPaid, predictionHistory] = await Promise.all([
    getCachedRanking(),
    getCachedSettings(),
    getCachedTotalPaid(),
    getPredictionHistory(),
  ])

  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPool = totalPaid * entryFee
  const prizes = [
    { label: '1º lugar', pct: s.prize_1st_pct ?? '60', value: totalPool * (parseInt(s.prize_1st_pct ?? '60') / 100), color: 'var(--amber)' },
    { label: '2º lugar', pct: s.prize_2nd_pct ?? '30', value: totalPool * (parseInt(s.prize_2nd_pct ?? '30') / 100), color: '#C8D6E5' },
    { label: '3º lugar', pct: s.prize_3rd_pct ?? '10', value: totalPool * (parseInt(s.prize_3rd_pct ?? '10') / 100), color: '#CD8E5A' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fade-1" style={{ marginBottom: '1.75rem' }}>
        <h1 className="display" style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          Ranking
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
          5 pts placar exato · 3 pts empate certo · 1 pt vitória certa · Desempate por acertos exatos
        </p>
      </div>

      {/* Prize summary */}
      <div className="fade-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '2rem' }}>
        {prizes.map((p) => (
          <div key={p.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', marginBottom: '6px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {p.label} · {p.pct}%
            </div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: p.color }}>
              R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="fade-3">
        <RankingTable rows={ranking} currentUserId={session?.user?.id} predictionHistory={predictionHistory} />
      </div>
    </div>
  )
}
