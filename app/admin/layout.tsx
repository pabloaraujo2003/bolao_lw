import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const navItems = [
    { href: '/admin', label: 'Dashboard', exact: true },
    { href: '/admin/jogos', label: 'Jogos' },
    { href: '/admin/resultados', label: 'Resultados' },
    { href: '/admin/participantes', label: 'Participantes' },
    { href: '/admin/configuracoes', label: 'Configurações' },
  ]

  return (
    <div>
      {/* Admin header */}
      <div className="fade-1" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <span className="badge badge-amber" style={{ fontSize: '.62rem' }}>ADMIN</span>
          <h1 style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--text)' }}>Painel Administrativo</h1>
        </div>

        {/* Sub-nav */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '7px 14px', borderRadius: '9px',
                fontSize: '.8rem', fontWeight: 500,
                background: 'var(--s1)', color: 'var(--muted)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                transition: 'color .15s, border-color .15s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  )
}
