'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSpecialPool } from '@/app/actions/special'

export default function AdminBoloesList() {
  const [pools, setPools] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/special-pools').then((r) => r.json()).then((j) => { setPools(j.pools ?? []); setGames(j.games ?? []) })
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreating(true)
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    const res = await createSpecialPool(fd)
    setCreating(false)
    if (res?.error) { setFeedback({ ok: false, msg: res.error }); return }
    setFeedback({ ok: true, msg: 'Mini-bolão criado!' })
    setShowForm(false)
    fetch('/api/admin/special-pools').then((r) => r.json()).then((j) => setPools(j.pools ?? []))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="display" style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '.2rem' }}>Mini-Bolões</h2>
          <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Bolões especiais com perguntas por jogo</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn btn-green"
          style={{ padding: '9px 20px', fontSize: '.82rem' }}
        >
          {showForm ? 'Cancelar' : '+ Novo mini-bolão'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ padding: '20px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>Nome do bolão</label>
              <input name="name" required placeholder="Ex: Bolão Brasil × Argentina" className="score-box" style={{ width: '100%', padding: '9px 12px', fontSize: '.9rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>Jogo vinculado (opcional)</label>
              <select name="game_id" style={{ width: '100%', padding: '9px 12px', fontSize: '.85rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <option value="">— Nenhum —</option>
                {games.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.home_team} × {g.away_team} · {new Date(g.game_date).toLocaleDateString('pt-BR')}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>Cota (R$)</label>
              <input name="entry_fee" type="number" min="1" step="0.01" defaultValue="10" required className="score-box" style={{ width: '120px', padding: '9px 12px', fontSize: '.9rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="submit" disabled={creating} className="btn btn-green" style={{ padding: '9px 24px' }}>
                {creating ? 'Criando...' : 'Criar'}
              </button>
              {feedback && (
                <span style={{ fontSize: '.8rem', color: feedback.ok ? 'var(--green)' : '#ff6b6b' }}>
                  {feedback.msg}
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pools.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            Nenhum mini-bolão criado ainda.
          </div>
        )}
        {pools.map((pool: any, i: number) => (
          <div key={pool.id} className={`card fade-${Math.min(i + 2, 6)}`} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                  <span className={`badge ${pool.is_open ? 'badge-green' : 'badge-muted'}`} style={{ fontSize: '.65rem' }}>
                    {pool.is_open ? 'Aberto' : 'Encerrado'}
                  </span>
                  <span className="badge badge-amber" style={{ fontSize: '.65rem' }}>
                    R$ {parseFloat(pool.entry_fee).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.95rem' }}>{pool.name}</div>
                {pool.game && (
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {pool.game.home_team} × {pool.game.away_team}
                  </div>
                )}
              </div>
              <Link href={`/admin/boloes/${pool.id}`} className="btn" style={{ padding: '8px 18px', fontSize: '.8rem', background: 'var(--s2)', color: 'var(--text)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                Gerenciar →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
