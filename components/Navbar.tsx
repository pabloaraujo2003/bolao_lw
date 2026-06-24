'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User | null
  profile: { name: string; is_admin: boolean } | null
}

export function Navbar({ user, profile }: Props) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Início' },
    { href: '/palpites', label: 'Palpites' },
    { href: '/ranking', label: 'Ranking' },
    { href: '/premiacao', label: 'Premiação' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header style={{ background: '#162233', borderBottom: '1px solid #1E2F45' }} className="sticky top-0 z-50 mb-6">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-base" style={{ color: '#FFD700' }}>
          <span>⚽</span>
          <span className="hidden sm:inline">Bolão 2026</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: isActive(link.href) ? '#FFD700' : '#7A8FA6',
                background: isActive(link.href) ? '#1E2F45' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

          {profile?.is_admin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ml-1"
              style={{
                color: pathname.startsWith('/admin') ? '#FFD700' : '#7A8FA6',
                background: pathname.startsWith('/admin') ? '#1E2F45' : 'transparent',
              }}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs hidden sm:inline" style={{ color: '#7A8FA6' }}>
                {profile?.name ?? user.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: '#1E2F45', color: '#7A8FA6' }}
                >
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
