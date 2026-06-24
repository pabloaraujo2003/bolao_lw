'use client'

import { useState, useEffect } from 'react'
import { updateGameResult } from '@/app/actions/admin'

type Game = { id: number; home_team: string; away_team: string; game_date: string; home_score: number | null; away_score: number | null; is_finished: boolean }

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
          init[g.id] = {
            home: g.home_score?.toString() ?? '',
            away: g.away_score?.toString() ?? '',
          }
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
    else setFeedback((prev) => ({ ...prev, [gameId]: { ok: true, msg: 'Resultado salvo e pontos recalculados!' } }))
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: '#F0F4F8' }}>Lançar Resultados</h2>

      {games.length === 0 && (
        <div className="text-center py-8 rounded-2xl" style={{ background: '#162233', color: '#7A8FA6' }}>
          Nenhum jogo cadastrado.
        </div>
      )}

      <div className="space-y-3">
        {games.map((game) => (
          <div key={game.id} className="rounded-2xl p-4" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-medium" style={{ color: '#F0F4F8' }}>
                  {game.home_team} × {game.away_team}
                </div>
                <div className="text-xs" style={{ color: '#7A8FA6' }}>
                  {new Date(game.game_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {game.is_finished && ' · ✓ Encerrado'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="20"
                  value={scores[game.id]?.home ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [game.id]: { ...prev[game.id], home: e.target.value } }))}
                  className="w-12 text-center rounded-lg p-2 text-sm font-bold"
                  style={{ background: '#1E2F45', color: '#F0F4F8', border: '1px solid #1E2F45' }}
                />
                <span style={{ color: '#7A8FA6' }}>×</span>
                <input
                  type="number" min="0" max="20"
                  value={scores[game.id]?.away ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [game.id]: { ...prev[game.id], away: e.target.value } }))}
                  className="w-12 text-center rounded-lg p-2 text-sm font-bold"
                  style={{ background: '#1E2F45', color: '#F0F4F8', border: '1px solid #1E2F45' }}
                />
                <button
                  onClick={() => handleSave(game.id)}
                  disabled={saving[game.id]}
                  className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
                >
                  {saving[game.id] ? '...' : 'Salvar'}
                </button>
              </div>
            </div>

            {feedback[game.id] && (
              <div className="mt-2 text-xs" style={{ color: feedback[game.id].ok ? '#00C853' : '#F44336' }}>
                {feedback[game.id].msg}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
