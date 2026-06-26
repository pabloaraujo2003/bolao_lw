'use client'

import { useState } from 'react'
import { savePrediction } from '@/app/actions/predictions'
import type { GameWithPrediction } from '@/lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function isGameOpen(game: { game_date: string; is_finished: boolean }) {
  if (game.is_finished) return false
  return Date.now() < new Date(game.game_date).getTime() - 30 * 60 * 1000
}

export function GameCard({ game, index = 0 }: { game: GameWithPrediction; index?: number }) {
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
    else setFeedback({ ok: true, msg: 'Salvo!' })
  }

  const fadeClass = `fade-${Math.min(index + 1, 6)}`

  return (
    <div
      className={`card ${fadeClass}`}
      style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Green top stripe for open games */}
      {open && (
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--green), transparent)',
          borderRadius: '0 0 4px 4px',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span className="badge badge-muted">
          {game.stage}{game.group_name ? ` · ${game.group_name}` : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {open && <span className="live-dot" />}
          <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{formatDate(game.game_date)}</span>
        </div>
      </div>

      {/* Match row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        {/* Home team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
          {game.home_flag
            ? <img src={game.home_flag} alt={game.home_team} style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
            : <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--s3)' }} />
          }
          <span style={{
            fontSize: '.7rem', fontWeight: 600, color: 'var(--text)',
            textAlign: 'center', lineHeight: 1.25, maxWidth: '5rem',
          }}>
            {game.home_team}
          </span>
        </div>

        {/* Center: score / inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '96px', justifyContent: 'center' }}>
          {game.is_finished ? (
            <>
              <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--amber)' }}>
                {game.home_score}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '.85rem', fontWeight: 300 }}>–</span>
              <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--amber)' }}>
                {game.away_score}
              </span>
            </>
          ) : open ? (
            <>
              <input
                type="number" min="0" max="20"
                value={home}
                onChange={(e) => setHome(e.target.value)}
                className="score-box"
              />
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>–</span>
              <input
                type="number" min="0" max="20"
                value={away}
                onChange={(e) => setAway(e.target.value)}
                className="score-box"
              />
            </>
          ) : (
            <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--muted)' }}>
              {pred ? `${pred.predicted_home}–${pred.predicted_away}` : '?–?'}
            </span>
          )}
        </div>

        {/* Away team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
          {game.away_flag
            ? <img src={game.away_flag} alt={game.away_team} style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
            : <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--s3)' }} />
          }
          <span style={{
            fontSize: '.7rem', fontWeight: 600, color: 'var(--text)',
            textAlign: 'center', lineHeight: 1.25, maxWidth: '5rem',
          }}>
            {game.away_team}
          </span>
        </div>
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {game.is_finished && pred && (
            <span className={`badge ${pred.points === 5 ? 'badge-green' : pred.points >= 1 ? 'badge-amber' : 'badge-muted'}`}>
              {pred.points === 5 ? '✓ Exato · 5 pts' : pred.points === 3 ? '✓ Empate · 3 pts' : pred.points === 1 ? '✓ Vitória · 1 pt' : '✗ 0 pts'}
            </span>
          )}
          {!game.is_finished && !open && (
            <span className="badge badge-muted">🔒 Encerrado</span>
          )}
          {feedback && (
            <span className={`badge ${feedback.ok ? 'badge-green' : 'badge-red'}`}>
              {feedback.msg}
            </span>
          )}
        </div>

        {open && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-green"
            style={{ padding: '7px 16px', fontSize: '.78rem' }}
          >
            {loading ? '...' : pred ? 'Atualizar' : 'Salvar'}
          </button>
        )}
      </div>
    </div>
  )
}
