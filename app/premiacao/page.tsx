import { createClient } from '@/lib/supabase/server'
import { getCachedSettings, getCachedRanking, getCachedTotalPaid } from '@/lib/cache'
import { buildPixPayload } from '@/lib/pix'
import { PremiacaoClient } from '@/components/PremiacaoClient'
import type { RankingRow } from '@/lib/types'

export default async function PremiacaoPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [s, ranking, totalPaid] = await Promise.all([
    getCachedSettings(),
    getCachedRanking(),
    getCachedTotalPaid(),
  ])

  let profile: { paid: boolean } | null = null
  let myParticipations: { pool_id: string; paid: boolean }[] = []

  if (session?.user) {
    const [{ data: p }, { data: parts }] = await Promise.all([
      supabase.from('profiles').select('paid').eq('id', session.user.id).single(),
      supabase.from('special_participants').select('pool_id, paid').eq('user_id', session.user.id),
    ])
    profile = p
    myParticipations = parts ?? []
  }

  const { data: specialPools } = await supabase
    .from('special_pools')
    .select('id, name, entry_fee, game:games(home_team, away_team)')
    .eq('is_open', true)
    .order('created_at', { ascending: false })

  const partMap = new Map(myParticipations.map((p) => [p.pool_id, p]))

  const pixKey = s.pix_key ?? ''
  const poolName = s.pool_name ?? 'Bolão'
  const entryFee = s.entry_fee ?? '50'

  const pixOptions = [
    {
      id: 'main',
      label: 'Bolão Principal',
      amount: entryFee,
      paid: profile?.paid ?? false,
      pixPayload: buildPixPayload(pixKey, poolName, 'Brasil', entryFee),
    },
    ...((specialPools ?? []) as any[]).map((pool) => {
      const part = partMap.get(pool.id)
      const game = pool.game
      return {
        id: pool.id,
        label: pool.name,
        subtitle: game ? `${game.home_team} × ${game.away_team}` : undefined,
        amount: String(pool.entry_fee),
        paid: part?.paid ?? false,
        pixPayload: buildPixPayload(pixKey, pool.name, 'Brasil', String(pool.entry_fee)),
      }
    }),
  ]

  const fee = parseFloat(entryFee)
  const totalPool = totalPaid * fee
  const pct1 = parseInt(s.prize_1st_pct ?? '60')
  const pct2 = parseInt(s.prize_2nd_pct ?? '30')
  const pct3 = parseInt(s.prize_3rd_pct ?? '10')

  const prizes = [
    { pos: '01', label: '1º lugar', pct: pct1, value: totalPool * pct1 / 100, color: 'var(--amber)', dim: 'var(--amber-dim)', border: 'rgba(245,200,66,.2)' },
    { pos: '02', label: '2º lugar', pct: pct2, value: totalPool * pct2 / 100, color: '#C8D6E5', dim: 'rgba(200,214,229,.04)', border: 'rgba(200,214,229,.14)' },
    { pos: '03', label: '3º lugar', pct: pct3, value: totalPool * pct3 / 100, color: '#CD8E5A', dim: 'rgba(205,142,90,.04)', border: 'rgba(205,142,90,.14)' },
  ]

  return (
    <PremiacaoClient
      pixKey={pixKey}
      pixOptions={pixOptions}
      ranking={ranking as RankingRow[]}
      totalPool={totalPool}
      totalPaid={totalPaid}
      prizes={prizes}
      isLoggedIn={!!session?.user}
    />
  )
}
