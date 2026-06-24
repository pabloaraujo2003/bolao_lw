'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
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
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D1B2A' }}>
      <div className="w-full max-w-md">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold" style={{ color: '#FFD700' }}>Bolão da Copa 2026</h1>
          <p className="text-sm mt-1" style={{ color: '#7A8FA6' }}>Entre na sua conta para fazer seus palpites</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#162233' }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: '#F0F4F8' }}>Entrar</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#1E2F45', color: '#F44336', border: '1px solid #F44336' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#7A8FA6' }}>E-mail</label>
              <input
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2"
                style={{
                  background: '#1E2F45',
                  color: '#F0F4F8',
                  border: '1px solid #1E2F45',
                  '--tw-ring-color': '#FFD700',
                } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#7A8FA6' }}>Senha</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2"
                style={{
                  background: '#1E2F45',
                  color: '#F0F4F8',
                  border: '1px solid #1E2F45',
                } as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#7A8FA6' }}>
            Não tem conta?{' '}
            <Link href="/cadastro" className="font-medium hover:underline" style={{ color: '#FFD700' }}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
