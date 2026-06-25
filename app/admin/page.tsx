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

  const syncOk = lastSync?.status === 'ok'

  const stats = [
    {
      label: 'Participantes',
      value: totalParticipants ?? 0,
      sub: `${totalPaid ?? 0} confirmados`,
      color: 'var(--green)',
      icon: '👥',
    },
    {
      label: 'Arrecadado',
      value: `R$ ${totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: `Cota: R$ ${entryFee.toFixed(2).replace('.', ',')}`,
      color: 'var(--amber)',
      icon: '💰',
    },
    {
      label: 'Jogos',
      value: totalGames ?? 0,
      sub: `${finishedGames ?? 0} encerrados`,
      color: 'var(--green)',
      icon: '⚽',
    },
    {
      label: 'Último sync',
      value: lastSync ? new Date(lastSync.synced_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
      sub: lastSync ? new Date(lastSync.synced_at).toLocaleDateString('pt-BR') : 'Nunca',
      color: syncOk ? 'var(--green)' : 'var(--amber)',
      icon: '🔄',
    },
  ]

  return (
    <div>
      <div className="fade-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <div key={stat.label} className={`card fade-${i + 2}`} style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {stat.label}
              </div>
              <span style={{ fontSize: '1.1rem', opacity: .7 }}>{stat.icon}</span>
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color, marginBottom: '4px', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="fade-3 card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Ações rápidas
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
          {[
            { href: '/admin/resultados', label: '⚽ Lançar resultados' },
            { href: '/admin/participantes', label: '👥 Ver participantes' },
            { href: '/admin/configuracoes', label: '⚙️ Configurações' },
            { href: '/admin/jogos', label: '📋 Gerenciar jogos' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'block', padding: '12px 14px',
                background: 'var(--s2)', borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '.82rem', color: 'var(--text)',
                textDecoration: 'none', fontWeight: 500,
                transition: 'border-color .15s, color .15s',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
