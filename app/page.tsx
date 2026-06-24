import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Game, RankingRow } from '@/lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function medal(pos: number) {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `${pos}º`
}

export default async function HomePage() {
  const supabase = await createClient()
  const [
    { data: { session } },
    { data: settingsRows },
    { data: nextGames },
    { data: ranking },
    { count: totalPaid },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('settings').select('key, value'),
    supabase.from('games').select('*').eq('is_finished', false).order('game_date', { ascending: true }).limit(4),
    supabase.from('ranking').select('*').limit(5),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('paid', true),
  ])

  const user = session?.user ?? null
  const s: Record<string, string> = {}
  settingsRows?.forEach((r) => (s[r.key] = r.value))

  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPool = (totalPaid ?? 0) * entryFee

  return (
    <div>
      {/* Hero */}
      <section
        className="rounded-2xl p-8 mb-8 text-center"
        style={{ background: 'linear-gradient(135deg, #162233 0%, #1E2F45 100%)', border: '1px solid #1E2F45' }}
      >
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFD700' }}>
          {s.pool_name ?? 'Bolão da Copa 2026'}
        </h1>
        <p className="mb-6" style={{ color: '#7A8FA6' }}>
          Faça seus palpites e dispute o prêmio com seus colegas
        </p>
        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#FFD700' }}>
              R$ {totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs" style={{ color: '#7A8FA6' }}>Total arrecadado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#FFD700' }}>{totalPaid ?? 0}</div>
            <div className="text-xs" style={{ color: '#7A8FA6' }}>Participantes pagos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#FFD700' }}>R$ {entryFee.toFixed(2).replace('.', ',')}</div>
            <div className="text-xs" style={{ color: '#7A8FA6' }}>Cota de entrada</div>
          </div>
        </div>
        {!user && (
          <Link
            href="/cadastro"
            className="inline-block px-8 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
          >
            Participar agora
          </Link>
        )}
        {user && (
          <Link
            href="/palpites"
            className="inline-block px-8 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
          >
            Fazer palpites
          </Link>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Próximos jogos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#F0F4F8' }}>Próximos Jogos</h2>
            <Link href="/palpites" className="text-xs hover:underline" style={{ color: '#FFD700' }}>
              Ver todos →
            </Link>
          </div>

          {!nextGames?.length && (
            <div className="rounded-2xl p-6 text-center text-sm" style={{ background: '#162233', color: '#7A8FA6' }}>
              Nenhum jogo agendado ainda.
            </div>
          )}

          <div className="space-y-3">
            {nextGames?.map((game: Game) => (
              <div key={game.id} className="rounded-2xl p-4" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
                <div className="text-xs mb-2" style={{ color: '#7A8FA6' }}>
                  {game.stage}{game.group_name ? ` · ${game.group_name}` : ''} · {formatDate(game.game_date)}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {game.home_flag && <img src={game.home_flag} alt="" className="w-6 h-6 object-contain" />}
                    <span className="text-sm font-medium" style={{ color: '#F0F4F8' }}>{game.home_team}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: '#1E2F45', color: '#FFD700' }}>VS</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-sm font-medium" style={{ color: '#F0F4F8' }}>{game.away_team}</span>
                    {game.away_flag && <img src={game.away_flag} alt="" className="w-6 h-6 object-contain" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ranking top 5 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#F0F4F8' }}>Ranking</h2>
            <Link href="/ranking" className="text-xs hover:underline" style={{ color: '#FFD700' }}>
              Ver completo →
            </Link>
          </div>

          {!ranking?.length && (
            <div className="rounded-2xl p-6 text-center text-sm" style={{ background: '#162233', color: '#7A8FA6' }}>
              Ranking vazio — os pontos aparecerão após os primeiros jogos.
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
            {ranking?.map((row: RankingRow, i: number) => (
              <div
                key={row.user_id}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < (ranking.length - 1) ? '1px solid #1E2F45' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{medal(i + 1)}</span>
                  <span className="text-sm font-medium" style={{ color: '#F0F4F8' }}>{row.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: '#FFD700' }}>{row.total_points} pts</div>
                  <div className="text-xs" style={{ color: '#7A8FA6' }}>{row.exact_scores} exatos</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Como participar */}
      <section className="mt-8 rounded-2xl p-6" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#F0F4F8' }}>Como participar</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: '👤', title: 'Crie sua conta', desc: 'Cadastre-se com seu e-mail e senha' },
            { icon: '⚽', title: 'Faça seus palpites', desc: 'Palpite no placar de cada jogo antes de começar' },
            { icon: '🏆', title: 'Acumule pontos', desc: '3 pts placar exato · 1 pt acertar o vencedor' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl" style={{ background: '#1E2F45' }}>
              <span className="text-3xl">{item.icon}</span>
              <h3 className="text-sm font-semibold" style={{ color: '#F0F4F8' }}>{item.title}</h3>
              <p className="text-xs" style={{ color: '#7A8FA6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
