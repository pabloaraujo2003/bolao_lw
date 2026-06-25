import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCachedSettings, getCachedGames, getCachedRanking, getCachedTotalPaid } from '@/lib/cache'
import type { Game, RankingRow } from '@/lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function medal(pos: number) {
  if (pos === 1) return { icon: '01', color: 'var(--amber)' }
  if (pos === 2) return { icon: '02', color: '#C8D6E5' }
  if (pos === 3) return { icon: '03', color: '#CD8E5A' }
  return { icon: `${pos < 10 ? '0' : ''}${pos}`, color: 'var(--muted)' }
}

export default async function HomePage() {
  const supabase = await createClient()
  const [
    { data: { session } },
    s,
    allGames,
    allRanking,
    totalPaid,
  ] = await Promise.all([
    supabase.auth.getSession(),
    getCachedSettings(),
    getCachedGames(),
    getCachedRanking(),
    getCachedTotalPaid(),
  ])

  const user = session?.user ?? null
  const nextGames = allGames.filter((g) => !g.is_finished).slice(0, 4)
  const ranking = allRanking.slice(0, 5)

  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPool = totalPaid * entryFee

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="fade-1" style={{
        borderRadius: '20px',
        background: 'linear-gradient(145deg, var(--s1) 0%, var(--s2) 100%)',
        border: '1px solid var(--border)',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background accent */}
        <div style={{
          position: 'absolute', top: '-40%', right: '-10%', width: '420px', height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,153,.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <span style={{
              fontSize: '.65rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
              color: 'var(--green)', background: 'var(--green-dim)',
              padding: '3px 10px', borderRadius: '20px',
            }}>
              Copa do Mundo 2026
            </span>
          </div>

          <h1 className="display" style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            color: 'var(--text)',
            marginBottom: '.5rem',
          }}>
            {s.pool_name ?? 'Bolão da Copa 2026'}
          </h1>

          <p style={{ fontSize: '.9rem', color: 'var(--muted)', marginBottom: '2rem', maxWidth: '36rem' }}>
            Palpite no placar de cada jogo · 3 pts para placar exato · 1 pt para acertar o vencedor
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div>
              <div className="display text-amber" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)' }}>
                R$ {totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Total arrecadado
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
            <div>
              <div className="display" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: 'var(--text)' }}>
                {totalPaid}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Participantes pagos
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
            <div>
              <div className="display" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: 'var(--text)' }}>
                R$ {entryFee.toFixed(2).replace('.', ',')}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Cota de entrada
              </div>
            </div>
          </div>

          {!user ? (
            <Link href="/cadastro" className="btn btn-green" style={{ padding: '12px 28px', fontSize: '.9rem' }}>
              Participar agora
            </Link>
          ) : (
            <Link href="/palpites" className="btn btn-green" style={{ padding: '12px 28px', fontSize: '.9rem' }}>
              Fazer palpites →
            </Link>
          )}
        </div>
      </section>

      {/* ── Grid: próximos jogos + ranking ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Próximos jogos */}
        <section className="fade-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)' }}>Próximos Jogos</h2>
            <Link href="/palpites" style={{ fontSize: '.75rem', color: 'var(--green)', textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>

          {nextGames.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem' }}>
              Nenhum jogo agendado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {nextGames.map((game: Game) => (
                <div key={game.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '.65rem', color: 'var(--muted)', marginBottom: '8px' }}>
                    {game.stage}{game.group_name ? ` · ${game.group_name}` : ''} · {formatDate(game.game_date)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '7px' }}>
                      {game.home_flag && <img src={game.home_flag} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                      <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>{game.home_team}</span>
                    </div>
                    <span style={{ fontSize: '.7rem', color: 'var(--muted)', padding: '2px 8px', background: 'var(--s2)', borderRadius: '6px' }}>VS</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>{game.away_team}</span>
                      {game.away_flag && <img src={game.away_flag} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ranking top 5 */}
        <section className="fade-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)' }}>Ranking</h2>
            <Link href="/ranking" style={{ fontSize: '.75rem', color: 'var(--green)', textDecoration: 'none' }}>
              Ver completo →
            </Link>
          </div>

          {ranking.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem' }}>
              Ranking vazio — aguardando jogos.
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {ranking.map((row: RankingRow, i: number) => {
                const pos = medal(i + 1)
                return (
                  <div
                    key={row.user_id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 16px',
                      borderBottom: i < ranking.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="mono" style={{ fontSize: '.75rem', fontWeight: 700, color: pos.color, width: '20px' }}>
                        {pos.icon}
                      </span>
                      <span style={{ fontSize: '.85rem', color: 'var(--text)' }}>{row.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: '.88rem', fontWeight: 700, color: pos.color }}>
                        {row.total_points} pts
                      </div>
                      <div style={{ fontSize: '.65rem', color: 'var(--muted)' }}>
                        {row.exact_scores} exatos
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Como participar ───────────────────────────────────── */}
      <section className="card fade-4" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Como funciona</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { num: '01', title: 'Crie sua conta', desc: 'Cadastre-se e pague a cota via Pix' },
            { num: '02', title: 'Palpite nos jogos', desc: 'Envie o placar antes de 30 min do início' },
            { num: '03', title: 'Acumule pontos', desc: '3 pts placar exato · 1 pt acertar o vencedor' },
          ].map((item) => (
            <div key={item.num} style={{
              background: 'var(--s2)', borderRadius: '12px', padding: '1rem',
              border: '1px solid var(--border)',
            }}>
              <span className="display" style={{ fontSize: '1.8rem', color: 'var(--green)', opacity: .5 }}>{item.num}</span>
              <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text)', margin: '6px 0 4px' }}>{item.title}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
