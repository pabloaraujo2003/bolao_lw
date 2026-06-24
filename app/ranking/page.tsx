import { createClient } from '@/lib/supabase/server'
import { RankingTable } from '@/components/RankingTable'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: ranking }, { data: settings }, { count: totalPaid }] = await Promise.all([
    supabase.from('ranking').select('*'),
    supabase.from('settings').select('key, value'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('paid', true),
  ])

  const s: Record<string, string> = {}
  settings?.forEach((r) => (s[r.key] = r.value))

  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPool = (totalPaid ?? 0) * entryFee
  const prize1 = totalPool * (parseInt(s.prize_1st_pct ?? '60') / 100)
  const prize2 = totalPool * (parseInt(s.prize_2nd_pct ?? '30') / 100)
  const prize3 = totalPool * (parseInt(s.prize_3rd_pct ?? '10') / 100)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F4F8' }}>Ranking</h1>
      <p className="text-sm mb-6" style={{ color: '#7A8FA6' }}>
        3 pts placar exato · 1 pt acertar o resultado · Desempate por acertos exatos
      </p>

      {/* Prize summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: '🥇 1º lugar', value: prize1, pct: s.prize_1st_pct ?? '60' },
          { label: '🥈 2º lugar', value: prize2, pct: s.prize_2nd_pct ?? '30' },
          { label: '🥉 3º lugar', value: prize3, pct: s.prize_3rd_pct ?? '10' },
        ].map((p) => (
          <div key={p.label} className="rounded-2xl p-4 text-center" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
            <div className="text-xs mb-1" style={{ color: '#7A8FA6' }}>{p.label} ({p.pct}%)</div>
            <div className="text-lg font-bold" style={{ color: '#FFD700' }}>
              R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      <RankingTable rows={ranking ?? []} currentUserId={session?.user?.id} />
    </div>
  )
}
