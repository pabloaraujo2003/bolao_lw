import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { SpecialPool, Game } from '@/lib/types'

export default async function BoloesList() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const { data: pools } = await supabase
    .from('special_pools')
    .select('*, game:games(id, home_team, away_team, game_date, home_flag, away_flag)')
    .order('created_at', { ascending: false })

  const { data: myParticipations } = await supabase
    .from('special_participants')
    .select('pool_id, paid')
    .eq('user_id', session.user.id)

  const partMap = new Map(myParticipations?.map((p) => [p.pool_id, p]) ?? [])

  return (
    <div>
      <div className="fade-1" style={{ marginBottom: '1.75rem' }}>
        <h1 className="display" style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          Mini-Bolões
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
          Bolões especiais com perguntas sobre jogos específicos.
        </p>
      </div>

      {(!pools || pools.length === 0) && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          Nenhum mini-bolão disponível ainda.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pools?.map((pool: any, i: number) => {
          const part = partMap.get(pool.id)
          const joined = !!part
          const paid = part?.paid ?? false
          const game: Game | null = pool.game ?? null

          return (
            <div key={pool.id} className={`card fade-${Math.min(i + 2, 6)}`} style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className={`badge ${pool.is_open ? 'badge-green' : 'badge-muted'}`} style={{ fontSize: '.65rem' }}>
                      {pool.is_open ? 'Aberto' : 'Encerrado'}
                    </span>
                    <span className="badge badge-amber" style={{ fontSize: '.65rem' }}>
                      R$ {parseFloat(pool.entry_fee).toFixed(2).replace('.', ',')}
                    </span>
                    {joined && (
                      <span className={`badge ${paid ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '.65rem' }}>
                        {paid ? '✓ Pago' : '⚠ Pagamento pendente'}
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                    {pool.name}
                  </h2>

                  {game && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.8rem', color: 'var(--muted)' }}>
                      {game.home_flag && <img src={game.home_flag} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                      <span>{game.home_team}</span>
                      <span style={{ color: 'var(--border)' }}>×</span>
                      <span>{game.away_team}</span>
                      {game.away_flag && <img src={game.away_flag} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <span>{new Date(game.game_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/boloes/${pool.id}`}
                  className="btn btn-green"
                  style={{ padding: '9px 20px', fontSize: '.82rem', whiteSpace: 'nowrap' }}
                >
                  {joined ? 'Ver meus palpites' : 'Participar →'}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
