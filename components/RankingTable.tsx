'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PredictionHistoryByUser, PredictionHistoryRow, RankingRow } from '@/lib/types'

const podium: Record<number, { num: string; row: string; border: string }> = {
  1: { num: 'var(--amber)',      row: 'rgba(245,200,66,.06)',   border: 'rgba(245,200,66,.18)' },
  2: { num: '#C8D6E5',           row: 'rgba(200,214,229,.04)',  border: 'rgba(200,214,229,.12)' },
  3: { num: '#CD8E5A',           row: 'rgba(205,142,90,.04)',   border: 'rgba(205,142,90,.12)' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pointsLabel(points: number) {
  if (points === 5) return 'Exato'
  if (points === 3) return 'Empate'
  if (points === 1) return 'Resultado'
  return '0 pts'
}

function resultText(game: PredictionHistoryRow['game']) {
  if (!game.is_finished || game.home_score === null || game.away_score === null) return 'Aguardando resultado'
  return `${game.home_score}-${game.away_score}`
}

export function RankingTable({
  rows,
  currentUserId,
  predictionHistory,
}: {
  rows: RankingRow[]
  currentUserId?: string
  predictionHistory?: PredictionHistoryByUser
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const selectedRow = useMemo(
    () => rows.find((row) => row.user_id === selectedUserId) ?? null,
    [rows, selectedUserId]
  )
  const selectedPredictions = selectedUserId ? predictionHistory?.[selectedUserId] ?? [] : []

  useEffect(() => {
    if (!selectedRow) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedUserId(null)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedRow])

  if (rows.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        Ranking vazio — os pontos aparecerão após os primeiros jogos.
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.8rem minmax(0, 1fr) 3.6rem 3.8rem 3.8rem',
          padding: '6px 16px',
          color: 'var(--muted)',
          fontSize: '.65rem',
          fontWeight: 600,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
        }}>
          <span>#</span>
          <span>Participante</span>
          <span style={{ textAlign: 'right' }}>Pts</span>
          <span style={{ textAlign: 'right' }}>Exatos</span>
          <span style={{ textAlign: 'right' }}>Result.</span>
        </div>

        {rows.map((row, i) => {
          const pos = i + 1
          const isMe = row.user_id === currentUserId
          const p = podium[pos]
          return (
            <button
              type="button"
              key={row.user_id}
              onClick={() => setSelectedUserId(row.user_id)}
              aria-label={`Ver palpites de ${row.name}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.8rem minmax(0, 1fr) 3.6rem 3.8rem 3.8rem',
                alignItems: 'center',
                width: '100%',
                padding: '13px 16px',
                borderRadius: '11px',
                background: isMe ? 'rgba(0,229,153,.06)' : p ? p.row : 'var(--s1)',
                border: `1px solid ${isMe ? 'rgba(0,229,153,.2)' : p ? p.border : 'var(--border)'}`,
                transition: 'border-color .2s',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              {/* Position */}
              <span className="mono" style={{
                fontSize: pos <= 3 ? '1rem' : '.8rem',
                fontWeight: 700,
                color: isMe ? 'var(--green)' : p ? p.num : 'var(--muted)',
              }}>
                {String(pos).padStart(2, '0')}
              </span>

              {/* Name */}
              <span style={{
                minWidth: 0,
                textAlign: 'left',
                fontSize: '.88rem',
                fontWeight: isMe ? 600 : 500,
                color: isMe ? 'var(--green)' : 'var(--text)',
                textDecoration: 'underline',
                textDecorationColor: 'var(--border-strong)',
                textUnderlineOffset: '3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {row.name}
                {isMe && (
                  <span style={{ marginLeft: '6px', fontSize: '.65rem', color: 'var(--muted)', fontWeight: 400 }}>
                    (você)
                  </span>
                )}
              </span>

              {/* Points */}
              <span className="mono" style={{
                textAlign: 'right',
                fontSize: pos <= 3 ? '1rem' : '.88rem',
                fontWeight: 700,
                color: isMe ? 'var(--green)' : p ? p.num : 'var(--text)',
              }}>
                {row.total_points}
              </span>

              {/* Exact */}
              <span style={{ textAlign: 'right', fontSize: '.82rem', color: 'var(--green)', fontWeight: 500 }}>
                {row.exact_scores}
              </span>

              {/* Results */}
              <span style={{ textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)' }}>
                {row.correct_results}
              </span>
            </button>
          )
        })}
      </div>

      {typeof document !== 'undefined' && selectedRow && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="prediction-history-title"
          onClick={() => setSelectedUserId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
            background: 'rgba(4,8,13,.76)',
            backdropFilter: 'blur(12px)',
            overscrollBehavior: 'contain',
          }}
        >
          <div
            className="card"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(720px, 100%)',
              maxHeight: 'min(82dvh, 720px)',
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 70px rgba(0,0,0,.48)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '18px 20px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div>
                <div className="section-label" style={{ marginBottom: '6px' }}>Palpites encerrados</div>
                <h2 id="prediction-history-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                  {selectedRow.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                aria-label="Fechar"
                className="btn btn-ghost"
                style={{ width: '40px', minHeight: '40px', padding: 0, fontSize: '1.15rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              padding: '10px',
            }}>
              {selectedPredictions.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>
                  Nenhum palpite com prazo encerrado ainda.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPredictions.map((prediction) => {
                    const game = prediction.game

                    return (
                      <div
                        key={`${prediction.user_id}-${prediction.game_id}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) auto',
                          gap: '14px',
                          alignItems: 'center',
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'var(--s2)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px', flexWrap: 'wrap' }}>
                            <span className="badge badge-muted">{game.stage}{game.group_name ? ` · ${game.group_name}` : ''}</span>
                            <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{formatDate(game.game_date)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            {game.home_flag && <img src={game.home_flag} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} />}
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.88rem', fontWeight: 600 }}>
                              {game.home_team}
                            </span>
                            <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>x</span>
                            {game.away_flag && <img src={game.away_flag} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} />}
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.88rem', fontWeight: 600 }}>
                              {game.away_team}
                            </span>
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto auto',
                          gap: '10px',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}>
                          <div>
                            <div style={{ marginBottom: '4px', fontSize: '.62rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                              Palpite
                            </div>
                            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                              {prediction.predicted_home}-{prediction.predicted_away}
                            </div>
                          </div>

                          <div>
                            <div style={{ marginBottom: '4px', fontSize: '.62rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                              Resultado
                            </div>
                            <div className="mono" style={{
                              fontSize: game.is_finished ? '1.15rem' : '.78rem',
                              fontWeight: 700,
                              color: game.is_finished ? 'var(--amber)' : 'var(--muted)',
                              whiteSpace: 'nowrap',
                            }}>
                              {resultText(game)}
                            </div>
                          </div>

                          <div className={`badge ${prediction.points === 5 ? 'badge-green' : prediction.points >= 1 ? 'badge-amber' : 'badge-muted'}`} style={{ gridColumn: '1 / -1', justifySelf: 'center', marginTop: '2px' }}>
                            {pointsLabel(prediction.points)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
