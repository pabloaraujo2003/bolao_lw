'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await login(fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.redirectTo) {
      router.push(result.redirectTo)
      router.refresh()
    }
  }

  return (
    <main style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="display" style={{ fontSize: '3rem', color: 'var(--green)', lineHeight: 1, marginBottom: '.25rem' }}>
            BOLÃO
          </div>
          <div className="display" style={{ fontSize: '1.25rem', color: 'var(--muted)', letterSpacing: '.1em' }}>
            COPA 2026
          </div>
        </div>

        <div className="auth-card">
          <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1.5rem' }}>
            Entrar na conta
          </h1>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(255,77,77,.3)',
              borderRadius: '10px', padding: '10px 14px',
              fontSize: '.82rem', color: 'var(--red)', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', color: 'var(--muted)', marginBottom: '6px', fontWeight: 500, letterSpacing: '.04em' }}>
                E-MAIL
              </label>
              <input name="email" type="email" required placeholder="seu@email.com" className="field" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.75rem', color: 'var(--muted)', marginBottom: '6px', fontWeight: 500, letterSpacing: '.04em' }}>
                SENHA
              </label>
              <input name="password" type="password" required placeholder="••••••••" className="field" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-green"
              style={{ padding: '13px', fontSize: '.9rem', marginTop: '4px', width: '100%' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '.82rem', color: 'var(--muted)' }}>
            Não tem conta?{' '}
            <Link href="/cadastro" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
