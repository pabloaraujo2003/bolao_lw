'use client'

import { useState } from 'react'
import { joinPool, saveSpecialAnswers } from '@/app/actions/special'

type Question = {
  id: string
  question: string
  options: string[]
  correct_answer: string | null
  points: number
  order_index: number
}

type Pool = {
  id: string
  name: string
  entry_fee: number
  is_open: boolean
  game: any
}

type AnswerEntry = { answer: string; points: number }

export function SpecialPoolClient({
  pool,
  questions,
  participation,
  answerMap,
  userId,
}: {
  pool: Pool
  questions: Question[]
  participation: { paid: boolean } | null
  answerMap: Record<string, AnswerEntry>
  userId: string
}) {
  const [joining, setJoining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(answerMap).map(([k, v]) => [k, v.answer]))
  )
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  const joined = !!participation
  const paid = participation?.paid ?? false
  const gameFinished = pool.game?.is_finished ?? false
  const canAnswer = pool.is_open && joined

  async function handleJoin() {
    setJoining(true)
    const res = await joinPool(pool.id)
    setJoining(false)
    if (res?.error) setFeedback({ ok: false, msg: res.error })
  }

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    const res = await saveSpecialAnswers(pool.id, answers)
    setSaving(false)
    if (res?.error) setFeedback({ ok: false, msg: res.error })
    else setFeedback({ ok: true, msg: 'Palpites salvos!' })
  }

  const totalPoints = questions.reduce((sum, q) => {
    const a = answerMap[q.id]
    return sum + (a?.points ?? 0)
  }, 0)

  const maxPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const allAnswered = canAnswer && questions.every((q) => answers[q.id])

  return (
    <div>
      {/* Header */}
      <div className="fade-1" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className={`badge ${pool.is_open ? 'badge-green' : 'badge-muted'}`}>
            {pool.is_open ? 'Aberto' : 'Encerrado'}
          </span>
          <span className="badge badge-amber">
            R$ {parseFloat(String(pool.entry_fee)).toFixed(2).replace('.', ',')}
          </span>
          {joined && (
            <span className={`badge ${paid ? 'badge-green' : 'badge-red'}`}>
              {paid ? '✓ Pago' : '⚠ Pagamento pendente'}
            </span>
          )}
        </div>
        <h1 className="display" style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          {pool.name}
        </h1>
        {pool.game && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.82rem', color: 'var(--muted)' }}>
            {pool.game.home_flag && <img src={pool.game.home_flag} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
            <span>{pool.game.home_team}</span>
            <span>×</span>
            <span>{pool.game.away_team}</span>
            {pool.game.away_flag && <img src={pool.game.away_flag} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
            <span>·</span>
            <span>{new Date(pool.game.game_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Join prompt */}
      {!joined && pool.is_open && (
        <div className="card fade-2" style={{
          padding: '24px', marginBottom: '1.5rem', textAlign: 'center',
          borderColor: 'rgba(0,229,153,.2)',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
            Participar deste mini-bolão
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '16px' }}>
            Cota: R$ {parseFloat(String(pool.entry_fee)).toFixed(2).replace('.', ',')} via Pix — o admin confirmará o pagamento.
          </div>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="btn btn-green"
            style={{ padding: '10px 28px' }}
          >
            {joining ? 'Entrando...' : 'Quero participar'}
          </button>
        </div>
      )}

      {/* Not joined + closed */}
      {!joined && !pool.is_open && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Este mini-bolão está encerrado.
        </div>
      )}

      {/* Score summary (if game finished) */}
      {gameFinished && joined && questions.some((q) => q.correct_answer) && (
        <div className="card fade-2" style={{ padding: '18px 22px', marginBottom: '1.5rem', borderColor: 'rgba(245,200,66,.2)' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Sua pontuação
          </div>
          <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--amber)' }}>
            {totalPoints} <span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 400 }}>/ {maxPoints} pts</span>
          </div>
        </div>
      )}

      {/* Questions */}
      {joined && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.map((q, i) => {
            const myAnswer = answers[q.id] ?? ''
            const savedAnswer = answerMap[q.id]
            const isCorrect = q.correct_answer && savedAnswer?.answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
            const isWrong = q.correct_answer && savedAnswer?.answer && !isCorrect

            return (
              <div key={q.id} className={`card fade-${Math.min(i + 3, 6)}`} style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text)' }}>
                    {i + 1}. {q.question}
                  </div>
                  <span style={{ fontSize: '.7rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {q.points} pts
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {q.options.map((opt) => {
                    const selected = myAnswer === opt
                    const isOptCorrect = q.correct_answer?.trim().toLowerCase() === opt.trim().toLowerCase()
                    let bg = 'var(--s2)'
                    let border = 'var(--border)'
                    let color = 'var(--text)'

                    if (q.correct_answer) {
                      if (isOptCorrect) { bg = 'rgba(0,229,153,.1)'; border = 'rgba(0,229,153,.4)'; color = 'var(--green)' }
                      else if (selected && !isOptCorrect) { bg = 'rgba(255,77,77,.08)'; border = 'rgba(255,77,77,.3)'; color = '#ff6b6b' }
                    } else if (selected) {
                      bg = 'rgba(0,229,153,.08)'; border = 'rgba(0,229,153,.3)'
                    }

                    return (
                      <label
                        key={opt}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', borderRadius: '10px',
                          background: bg, border: `1px solid ${border}`,
                          cursor: canAnswer ? 'pointer' : 'default',
                          transition: 'all .15s', color,
                        }}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={selected}
                          onChange={() => canAnswer && setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          disabled={!canAnswer}
                          style={{ accentColor: 'var(--green)' }}
                        />
                        <span style={{ fontSize: '.85rem', fontWeight: selected ? 600 : 400 }}>{opt}</span>
                        {isOptCorrect && q.correct_answer && (
                          <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: 'var(--green)', fontWeight: 600 }}>✓ Correto</span>
                        )}
                      </label>
                    )
                  })}
                </div>

                {q.correct_answer && savedAnswer && (
                  <div style={{ marginTop: '10px', fontSize: '.75rem', fontWeight: 500, color: isCorrect ? 'var(--green)' : '#ff6b6b' }}>
                    {isCorrect ? `✓ Correto · +${q.points} pts` : `✗ Errado · 0 pts`}
                  </div>
                )}
              </div>
            )
          })}

          {canAnswer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <button
                onClick={handleSave}
                disabled={saving || !allAnswered}
                className="btn btn-green"
                style={{ padding: '11px 28px' }}
              >
                {saving ? 'Salvando...' : 'Salvar palpites'}
              </button>
              {feedback && (
                <span style={{ fontSize: '.8rem', fontWeight: 500, color: feedback.ok ? 'var(--green)' : '#ff6b6b' }}>
                  {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
                </span>
              )}
              {!allAnswered && (
                <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Responda todas as perguntas</span>
              )}
            </div>
          )}
        </div>
      )}

      {joined && questions.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          As perguntas ainda não foram adicionadas. Aguarde o admin.
        </div>
      )}
    </div>
  )
}
