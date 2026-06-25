import { createClient } from '@/lib/supabase/server'
import { getCachedRanking, getCachedSettings, getCachedTotalPaid } from '@/lib/cache'
import { RankingTable } from '@/components/RankingTable'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [ranking, s, totalPaid] = await Promise.all([
    getCachedRanking(),
    getCachedSettings(),
    getCachedTotalPaid(),
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
          3 pts placar exato · 1 pt acertar o resultado · Desempate por acertos exatos
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
        <RankingTable rows={ranking} currentUserId={session?.user?.id} />
      </div>
    </div>
  )
}
