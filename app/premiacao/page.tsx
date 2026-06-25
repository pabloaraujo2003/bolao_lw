import { createClient } from '@/lib/supabase/server'
import { getCachedSettings, getCachedRanking, getCachedTotalPaid } from '@/lib/cache'
import { buildPixPayload } from '@/lib/pix'
import { PixQrCard } from '@/components/PixQrCard'
import type { RankingRow } from '@/lib/types'

export default async function PremiacaoPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [s, ranking, totalPaid] = await Promise.all([
    getCachedSettings(),
    getCachedRanking(),
    getCachedTotalPaid(),
  ])

  let profile = null
  if (session?.user) {
    const { data } = await supabase.from('profiles').select('paid').eq('id', session.user.id).single()
    profile = data
  }

  const pixPayload = buildPixPayload(
    s.pix_key ?? '',
    s.pool_name ?? 'Bolão',
    'Brasil',
    s.entry_fee ?? '50',
  )

  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPool = totalPaid * entryFee
  const pct1 = parseInt(s.prize_1st_pct ?? '60')
  const pct2 = parseInt(s.prize_2nd_pct ?? '30')
  const pct3 = parseInt(s.prize_3rd_pct ?? '10')

  const prizes = [
    { pos: '01', label: '1º lugar', pct: pct1, value: totalPool * pct1 / 100, color: 'var(--amber)', dim: 'var(--amber-dim)', border: 'rgba(245,200,66,.2)' },
    { pos: '02', label: '2º lugar', pct: pct2, value: totalPool * pct2 / 100, color: '#C8D6E5', dim: 'rgba(200,214,229,.04)', border: 'rgba(200,214,229,.14)' },
    { pos: '03', label: '3º lugar', pct: pct3, value: totalPool * pct3 / 100, color: '#CD8E5A', dim: 'rgba(205,142,90,.04)', border: 'rgba(205,142,90,.14)' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fade-1" style={{ marginBottom: '1.75rem' }}>
        <h1 className="display" style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          Premiação
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Distribuição do prêmio e situação de pagamento</p>
      </div>

      {/* Payment status */}
      {session?.user && (
        <div className="fade-2 card" style={{
          padding: '16px 20px', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderColor: profile?.paid ? 'rgba(0,229,153,.25)' : 'rgba(255,77,77,.25)',
        }}>
          <div>
            <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Seu pagamento</div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Cota de R$ {entryFee.toFixed(2).replace('.', ',')}</div>
          </div>
          <span className={`badge ${profile?.paid ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '.75rem', padding: '5px 14px' }}>
            {profile?.paid ? '✓ Confirmado' : '✗ Pendente'}
          </span>
        </div>
      )}

      {/* Pix */}
      <div className="fade-3" style={{ marginBottom: '1.5rem' }}>
        {session?.user && profile?.paid === false ? (
          <PixQrCard
            pixPayload={pixPayload}
            pixKey={s.pix_key ?? ''}
            amount={s.entry_fee ?? '50'}
          />
        ) : session?.user && profile?.paid ? (
          <div className="card" style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px',
            borderColor: 'rgba(0,229,153,.25)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(0,229,153,.15)', border: '1px solid rgba(0,229,153,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem',
            }}>✓</div>
            <div>
              <div style={{ fontWeight: 600, color: '#00E599', fontSize: '.95rem' }}>Pagamento confirmado</div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                Sua inscrição está confirmada no bolão.
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Pagamento via Pix
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'var(--s2)', borderRadius: '10px', padding: '14px 16px',
              border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '1.4rem' }}>📱</span>
              <div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '2px' }}>Chave Pix</div>
                <div className="mono" style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '.95rem' }}>
                  {s.pix_key ?? '—'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '10px', lineHeight: 1.6 }}>
              Envie R$ {entryFee.toFixed(2).replace('.', ',')} com seu nome na descrição. O admin confirmará o pagamento.
            </p>
          </div>
        )}
      </div>

      {/* Total + distribution */}
      <div className="fade-4 card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Total arrecadado
          </div>
          <div className="display text-amber" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '4px' }}>
            R$ {totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
            {totalPaid} participante{totalPaid !== 1 ? 's' : ''} pago{totalPaid !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {prizes.map((p, i) => (
            <div key={p.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: '11px',
              background: p.dim, border: `1px solid ${p.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="mono display" style={{ fontSize: '1.5rem', color: p.color }}>
                  {p.pos}
                </span>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)' }}>{p.label}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{p.pct}% do total</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontWeight: 700, color: p.color, fontSize: '1rem' }}>
                  R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {ranking[i] && (
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {(ranking[i] as RankingRow).name}
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
