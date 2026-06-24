'use client'

import { useState } from 'react'
import { savePrediction } from '@/app/actions/predictions'
import type { GameWithPrediction } from '@/lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function isGameOpen(game: { game_date: string; is_finished: boolean }) {
  if (game.is_finished) return false
  const cutoff = new Date(game.game_date).getTime() - 30 * 60 * 1000
  return Date.now() < cutoff
}

export function GameCard({ game }: { game: GameWithPrediction }) {
  const open = isGameOpen(game)
  const pred = game.prediction

  const [home, setHome] = useState(pred?.predicted_home?.toString() ?? '')
  const [away, setAway] = useState(pred?.predicted_away?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleSave() {
    const h = parseInt(home)
    const a = parseInt(away)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setFeedback({ ok: false, msg: 'Placar inválido' })
      return
    }
    setLoading(true)
    setFeedback(null)
    const res = await savePrediction(game.id, h, a)
    setLoading(false)
    if (res?.error) setFeedback({ ok: false, msg: res.error })
    else setFeedback({ ok: true, msg: 'Palpite salvo!' })
  }

  const inputStyle: React.CSSProperties = {
    width: '3rem', textAlign: 'center', background: '#0D1B2A', color: '#F0F4F8',
    border: '1px solid #1E2F45', borderRadius: '8px', padding: '6px 0', fontSize: '1.1rem', fontWeight: 700,
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
      {/* Header: stage + date */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1E2F45', color: '#7A8FA6' }}>
          {game.stage}{game.group_name ? ` · ${game.group_name}` : ''}
        </span>
        <span className="text-xs" style={{ color: '#7A8FA6' }}>{formatDate(game.game_date)}</span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Home */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {game.home_flag && <img src={game.home_flag} alt={game.home_team} className="w-8 h-8 object-contain" />}
          <span className="text-xs font-medium text-center" style={{ color: '#F0F4F8' }}>{game.home_team}</span>
        </div>

        {/* Score / inputs */}
        <div className="flex items-center gap-2">
          {game.is_finished ? (
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold" style={{ color: '#FFD700' }}>{game.home_score}</span>
              <span style={{ color: '#7A8FA6' }}>×</span>
              <span className="text-2xl font-bold" style={{ color: '#FFD700' }}>{game.away_score}</span>
            </div>
          ) : open ? (
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="20" value={home} onChange={(e) => setHome(e.target.value)} style={inputStyle} />
              <span style={{ color: '#7A8FA6' }}>×</span>
              <input type="number" min="0" max="20" value={away} onChange={(e) => setAway(e.target.value)} style={inputStyle} />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#7A8FA6' }}>
              {pred ? `${pred.predicted_home} × ${pred.predicted_away}` : '— × —'}
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {game.away_flag && <img src={game.away_flag} alt={game.away_team} className="w-8 h-8 object-contain" />}
          <span className="text-xs font-medium text-center" style={{ color: '#F0F4F8' }}>{game.away_team}</span>
        </div>
      </div>

      {/* Bottom row: palpite info + save button */}
      <div className="flex items-center justify-between">
        <div className="text-xs" style={{ color: '#7A8FA6' }}>
          {game.is_finished && pred && (
            <span
              className="px-2 py-1 rounded-full font-bold"
              style={{
                background: pred.points === 3 ? '#00C853' : pred.points === 1 ? '#FFD700' : '#1E2F45',
                color: pred.points === 3 ? '#fff' : pred.points === 1 ? '#0D1B2A' : '#7A8FA6',
              }}
            >
              {pred.points === 3 ? '✓ Exato — 3 pts' : pred.points === 1 ? '✓ Resultado — 1 pt' : '✗ 0 pts'}
            </span>
          )}
          {!game.is_finished && !open && (
            <span className="px-2 py-1 rounded-full" style={{ background: '#1E2F45', color: '#7A8FA6' }}>
              🔒 Encerrado
            </span>
          )}
          {feedback && (
            <span
              className="px-2 py-1 rounded-full ml-1"
              style={{ background: feedback.ok ? '#00C853' : '#F44336', color: '#fff' }}
            >
              {feedback.msg}
            </span>
          )}
        </div>

        {open && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
          >
            {loading ? 'Salvando...' : pred ? 'Atualizar' : 'Salvar'}
          </button>
        )}
      </div>
    </div>
  )
}
