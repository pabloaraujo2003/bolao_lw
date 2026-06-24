import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/jogos', label: 'Jogos' },
    { href: '/admin/resultados', label: 'Resultados' },
    { href: '/admin/participantes', label: 'Participantes' },
    { href: '/admin/configuracoes', label: 'Configurações' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: '#C9A800', color: '#0D1B2A' }}>
          ADMIN
        </span>
        <h1 className="text-lg font-bold" style={{ color: '#F0F4F8' }}>Painel Administrativo</h1>
      </div>

      <div className="flex gap-1 mb-8 flex-wrap">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#162233', color: '#7A8FA6', border: '1px solid #1E2F45' }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  )
}
