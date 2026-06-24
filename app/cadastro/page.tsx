'use client'

import { useState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function CadastroPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    if (fd.get('password') !== fd.get('confirm')) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }
    const result = await register(fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D1B2A' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold" style={{ color: '#FFD700' }}>Bolão da Copa 2026</h1>
          <p className="text-sm mt-1" style={{ color: '#7A8FA6' }}>Crie sua conta e entre na disputa</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#162233' }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: '#F0F4F8' }}>Criar conta</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#1E2F45', color: '#F44336', border: '1px solid #F44336' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#7A8FA6' }}>Nome</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#1E2F45', color: '#F0F4F8', border: '1px solid #1E2F45' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#7A8FA6' }}>E-mail</label>
              <input
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#1E2F45', color: '#F0F4F8', border: '1px solid #1E2F45' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#7A8FA6' }}>Senha</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#1E2F45', color: '#F0F4F8', border: '1px solid #1E2F45' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#7A8FA6' }}>Confirmar senha</label>
              <input
                name="confirm"
                type="password"
                required
                placeholder="Repita a senha"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#1E2F45', color: '#F0F4F8', border: '1px solid #1E2F45' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#7A8FA6' }}>
            Já tem conta?{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: '#FFD700' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
