'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User | null
  profile: { name: string; is_admin: boolean } | null
}

const links = [
  { href: '/',          label: 'Início',    icon: '🏠' },
  { href: '/palpites',  label: 'Palpites',  icon: '⚽' },
  { href: '/ranking',   label: 'Ranking',   icon: '🏆' },
  { href: '/premiacao', label: 'Premiação', icon: '💰' },
]

export function Navbar({ user, profile }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Top bar ───────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(4, 8, 13, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        marginBottom: '2rem',
      }}>
        <div style={{
          maxWidth: '80rem', margin: '0 auto', padding: '0 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '3.5rem',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
            <span className="display" style={{ fontSize: '1.4rem', color: 'var(--green)' }}>BOLÃO</span>
            <span className="display" style={{ fontSize: '1.4rem', color: 'rgba(232,240,248,.75)' }}>&nbsp;26</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="top-nav-links">
            {links.map((link) => {
              const active = isActive(link.href)
              return (
                <Link key={link.href} href={link.href} style={{
                  padding: '6px 12px', borderRadius: '8px',
                  fontSize: '.82rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--green)' : 'var(--muted)',
                  background: active ? 'var(--green-dim)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'color .15s, background .15s',
                }}>
                  {link.label}
                </Link>
              )
            })}
            {profile?.is_admin && (
              <Link href="/admin" style={{
                padding: '6px 12px', borderRadius: '8px', marginLeft: '4px',
                fontSize: '.82rem',
                fontWeight: pathname.startsWith('/admin') ? 600 : 400,
                color: pathname.startsWith('/admin') ? 'var(--amber)' : 'var(--muted)',
                background: pathname.startsWith('/admin') ? 'var(--amber-dim)' : 'transparent',
                textDecoration: 'none',
                transition: 'color .15s, background .15s',
              }}>
                Admin
              </Link>
            )}
          </nav>

          {/* User area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <>
                <span className="top-user-name" style={{
                  fontSize: '.75rem', color: 'var(--muted)',
                  maxWidth: '10rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {profile?.name ?? user.email}
                </span>
                <form action={logout}>
                  <button type="submit" className="btn btn-ghost" style={{ padding: '6px 13px', fontSize: '.78rem' }}>
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="btn btn-green" style={{ padding: '7px 16px', fontSize: '.82rem' }}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Bottom tab bar (mobile only) ──────────────────── */}
      <nav className="bottom-nav">
        {links.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`bottom-nav-item${active ? ' active-main' : ''}`}
            >
              <span className="bottom-nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}
        {profile?.is_admin && (
          <Link
            href="/admin"
            className={`bottom-nav-item${pathname.startsWith('/admin') ? ' active-admin' : ''}`}
          >
            <span className="bottom-nav-icon">⚙️</span>
            <span>Admin</span>
          </Link>
        )}
      </nav>
    </>
  )
}
