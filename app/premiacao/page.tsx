import { createClient } from '@/lib/supabase/server'
import type { RankingRow } from '@/lib/types'

export default async function PremiacaoPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [{ data: settings }, { data: ranking }, { count: totalPaid }] = await Promise.all([
    supabase.from('settings').select('key, value'),
    supabase.from('ranking').select('*').limit(3),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('paid', true),
  ])

  let profile = null
  if (session?.user) {
    const { data } = await supabase.from('profiles').select('paid').eq('id', session.user.id).single()
    profile = data
  }

  const s: Record<string, string> = {}
  settings?.forEach((r) => (s[r.key] = r.value))

  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPool = (totalPaid ?? 0) * entryFee
  const pct1 = parseInt(s.prize_1st_pct ?? '60')
  const pct2 = parseInt(s.prize_2nd_pct ?? '30')
  const pct3 = parseInt(s.prize_3rd_pct ?? '10')

  const prizes = [
    { pos: '🥇', label: '1º lugar', pct: pct1, value: totalPool * pct1 / 100 },
    { pos: '🥈', label: '2º lugar', pct: pct2, value: totalPool * pct2 / 100 },
    { pos: '🥉', label: '3º lugar', pct: pct3, value: totalPool * pct3 / 100 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F4F8' }}>Premiação</h1>
      <p className="text-sm mb-8" style={{ color: '#7A8FA6' }}>Distribuição do prêmio e situação de pagamento</p>

      {/* Status de pagamento do usuário */}
      {session?.user && (
        <div
          className="rounded-2xl p-4 mb-6 flex items-center justify-between"
          style={{
            background: '#162233',
            border: `1px solid ${profile?.paid ? '#00C853' : '#F44336'}`,
          }}
        >
          <div>
            <div className="text-sm font-medium" style={{ color: '#F0F4F8' }}>Seu pagamento</div>
            <div className="text-xs" style={{ color: '#7A8FA6' }}>Cota de R$ {entryFee.toFixed(2).replace('.', ',')}</div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              background: profile?.paid ? '#00C853' : '#F44336',
              color: '#fff',
            }}
          >
            {profile?.paid ? '✓ Pago' : '✗ Pendente'}
          </span>
        </div>
      )}

      {/* Chave Pix */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: '#F0F4F8' }}>Pagamento via Pix</h2>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1E2F45' }}>
          <span className="text-2xl">📱</span>
          <div>
            <div className="text-xs" style={{ color: '#7A8FA6' }}>Chave Pix</div>
            <div className="font-mono font-bold" style={{ color: '#FFD700' }}>{s.pix_key ?? '—'}</div>
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: '#7A8FA6' }}>
          Envie R$ {entryFee.toFixed(2).replace('.', ',')} com seu nome na descrição. O admin confirmará o pagamento.
        </p>
      </div>

      {/* Total e distribuição */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
        <h2 className="text-base font-semibold mb-1" style={{ color: '#F0F4F8' }}>Total arrecadado</h2>
        <div className="text-3xl font-bold mb-1" style={{ color: '#FFD700' }}>
          R$ {totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs mb-6" style={{ color: '#7A8FA6' }}>{totalPaid} participante(s) pago(s)</div>

        <div className="space-y-3">
          {prizes.map((p) => (
            <div key={p.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#1E2F45' }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.pos}</span>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#F0F4F8' }}>{p.label}</div>
                  <div className="text-xs" style={{ color: '#7A8FA6' }}>{p.pct}% do total</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ color: '#FFD700' }}>
                  R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {ranking && ranking[prizes.indexOf(p)] && (
                  <div className="text-xs" style={{ color: '#7A8FA6' }}>
                    {(ranking[prizes.indexOf(p)] as RankingRow).name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
