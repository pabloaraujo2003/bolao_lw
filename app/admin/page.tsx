import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalParticipants },
    { count: totalPaid },
    { count: totalGames },
    { count: finishedGames },
    { data: lastSync },
    { data: settings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('paid', true),
    supabase.from('games').select('*', { count: 'exact', head: true }),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_finished', true),
    supabase.from('sync_log').select('*').order('synced_at', { ascending: false }).limit(1).single(),
    supabase.from('settings').select('key, value'),
  ])

  const s: Record<string, string> = {}
  settings?.forEach((r) => (s[r.key] = r.value))

  const entryFee = parseFloat(s.entry_fee ?? '50')
  const totalPool = (totalPaid ?? 0) * entryFee

  const stats = [
    { label: 'Participantes', value: totalParticipants ?? 0, sub: `${totalPaid ?? 0} pagos` },
    { label: 'Total arrecadado', value: `R$ ${totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: `Cota: R$ ${entryFee.toFixed(2).replace('.', ',')}` },
    { label: 'Jogos', value: totalGames ?? 0, sub: `${finishedGames ?? 0} encerrados` },
    { label: 'Último sync', value: lastSync ? new Date(lastSync.synced_at).toLocaleString('pt-BR') : '—', sub: lastSync?.status ?? '—' },
  ]

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
            <div className="text-xs mb-1" style={{ color: '#7A8FA6' }}>{stat.label}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#FFD700' }}>{stat.value}</div>
            <div className="text-xs" style={{ color: '#7A8FA6' }}>{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
