'use client'

import { useState, useEffect } from 'react'
import { updateGameResult } from '@/app/actions/admin'

type Game = {
  id: number
  home_team: string
  away_team: string
  game_date: string
  home_score: number | null
  away_score: number | null
  is_finished: boolean
}

export default function AdminResultadosPage() {
  const [games, setGames] = useState<Game[]>([])
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [feedback, setFeedback] = useState<Record<number, { ok: boolean; msg: string }>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/games')
      .then((r) => r.json())
      .then((json) => {
        const gs: Game[] = json.games ?? []
        setGames(gs)
        const init: Record<number, { home: string; away: string }> = {}
        gs.forEach((g) => {
          init[g.id] = { home: g.home_score?.toString() ?? '', away: g.away_score?.toString() ?? '' }
        })
        setScores(init)
      })
  }, [])

  async function handleSave(gameId: number) {
    const h = parseInt(scores[gameId]?.home ?? '')
    const a = parseInt(scores[gameId]?.away ?? '')
    if (isNaN(h) || isNaN(a)) {
      setFeedback((prev) => ({ ...prev, [gameId]: { ok: false, msg: 'Placar inválido' } }))
      return
    }
    setSaving((prev) => ({ ...prev, [gameId]: true }))
    const res = await updateGameResult(gameId, h, a)
    setSaving((prev) => ({ ...prev, [gameId]: false }))
    if (res?.error) setFeedback((prev) => ({ ...prev, [gameId]: { ok: false, msg: res.error! } }))
    else setFeedback((prev) => ({ ...prev, [gameId]: { ok: true, msg: 'Salvo! Pontos recalculados.' } }))
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="display" style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '.2rem' }}>Resultados</h2>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Lance o placar final de cada partida</p>
      </div>

      {games.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
          Nenhum jogo cadastrado.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {games.map((game, i) => (
          <div key={game.id} className={`card fade-${Math.min(i + 2, 6)}`} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              {/* Match info */}
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.92rem', marginBottom: '3px' }}>
                  {game.home_team} <span style={{ color: 'var(--muted)', margin: '0 4px' }}>×</span> {game.away_team}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>
                    {new Date(game.game_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    {' '}
                    {new Date(game.game_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {game.is_finished && (
                    <span className="badge badge-green" style={{ fontSize: '.6rem', padding: '2px 7px' }}>✓ Encerrado</span>
                  )}
                </div>
              </div>

              {/* Score inputs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number" min="0" max="20"
                  value={scores[game.id]?.home ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [game.id]: { ...prev[game.id], home: e.target.value } }))}
                  className="score-box"
                  placeholder="—"
                />
                <span className="mono" style={{ color: 'var(--muted)', fontWeight: 700 }}>×</span>
                <input
                  type="number" min="0" max="20"
                  value={scores[game.id]?.away ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [game.id]: { ...prev[game.id], away: e.target.value } }))}
                  className="score-box"
                  placeholder="—"
                />
                <button
                  onClick={() => handleSave(game.id)}
                  disabled={saving[game.id]}
                  className="btn btn-green"
                  style={{ padding: '8px 18px', fontSize: '.78rem', minWidth: '72px' }}
                >
                  {saving[game.id] ? '...' : 'Salvar'}
                </button>
              </div>
            </div>

            {feedback[game.id] && (
              <div style={{
                marginTop: '10px', fontSize: '.75rem', fontWeight: 500,
                color: feedback[game.id].ok ? 'var(--green)' : 'var(--red)',
              }}>
                {feedback[game.id].ok ? '✓ ' : '✗ '}{feedback[game.id].msg}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
