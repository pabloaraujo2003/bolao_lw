'use client'

import { useState, useEffect } from 'react'
import { addQuestion, deleteQuestion, setCorrectAnswer, syncSpecialResults, toggleParticipantPayment, updateSpecialPool } from '@/app/actions/special'

const METRIC_LABELS: Record<string, string> = {
  score: 'Placar final (auto)',
  half_score: 'Placar intervalo (auto)',
  total_goals: 'Total de gols (auto)',
  first_scorer: 'Primeiro a marcar (auto)',
  goal_first_half: 'Gol no 1º tempo (auto)',
  first_goal_minute: 'Minuto do 1º gol (auto)',
  top_scorer: 'Artilheiro da partida (auto)',
}

const METRIC_TEMPLATES: Record<string, { question: string; options: string }> = {
  score:            { question: 'Qual será o placar final?', options: '' },
  half_score:       { question: 'Qual será o placar no intervalo?', options: '' },
  total_goals:      { question: 'Quantos gols no total?', options: '0\n1\n2\n3\n4\n5 ou mais' },
  first_scorer:     { question: 'Quem fará o primeiro gol?', options: '' },
  goal_first_half:  { question: 'Haverá gol no primeiro tempo?', options: 'Sim\nNão' },
  first_goal_minute:{ question: 'Em qual intervalo sairá o primeiro gol?', options: '1-15\n16-30\n31-45\n46-60\n61-75\n76-90\n90+' },
  top_scorer:       { question: 'Quem será o artilheiro da partida?', options: '' },
}

export default function AdminPoolDetail({ params }: { params: Promise<{ id: string }> }) {
  const [poolId, setPoolId] = useState('')
  const [pool, setPool] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])

  const [qForm, setQForm] = useState({ question: '', options: '', metric_type: '', points: '2' })
  const [addingQ, setAddingQ] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; msg: string } | null>(null)
  const [savingPool, setSavingPool] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setPoolId(id)
      load(id)
    })
  }, [])

  function load(id: string) {
    fetch(`/api/admin/special-pools/${id}`).then((r) => r.json()).then((j) => {
      setPool(j.pool)
      setQuestions(j.questions ?? [])
      setParticipants(j.participants ?? [])
    })
  }

  function applyTemplate(metric: string) {
    const t = METRIC_TEMPLATES[metric]
    if (t) setQForm((p) => ({ ...p, question: t.question, options: t.options, metric_type: metric }))
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    setAddingQ(true)
    const fd = new FormData()
    fd.append('question', qForm.question)
    fd.append('options', qForm.options)
    fd.append('metric_type', qForm.metric_type)
    fd.append('points', qForm.points)
    await addQuestion(poolId, fd)
    setAddingQ(false)
    setQForm({ question: '', options: '', metric_type: '', points: '2' })
    load(poolId)
  }

  async function handleDelete(qId: string) {
    await deleteQuestion(qId, poolId)
    load(poolId)
  }

  async function handleSetAnswer(qId: string, answer: string) {
    await setCorrectAnswer(qId, poolId, answer)
    load(poolId)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    const res = await syncSpecialResults(poolId)
    setSyncing(false)
    if (res?.error) setSyncMsg({ ok: false, msg: res.error })
    else setSyncMsg({ ok: true, msg: `${res.updated} resposta(s) preenchida(s) automaticamente` })
    load(poolId)
  }

  async function handleSavePool(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingPool(true)
    const fd = new FormData(e.currentTarget)
    await updateSpecialPool(poolId, fd)
    setSavingPool(false)
    load(poolId)
  }

  async function handleTogglePaid(userId: string, paid: boolean) {
    await toggleParticipantPayment(userId, poolId, paid)
    load(poolId)
  }

  if (!pool) return <div style={{ color: 'var(--muted)', padding: '2rem' }}>Carregando...</div>

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="display" style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '.2rem' }}>{pool.name}</h2>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Gerenciar perguntas, participantes e resultado</p>
      </div>

      {/* Pool settings */}
      <form onSubmit={handleSavePool} className="card" style={{ padding: '20px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Configurações</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Nome</label>
            <input name="name" defaultValue={pool.name} required style={{ padding: '8px 12px', fontSize: '.88rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)', width: '220px' }} />
          </div>
          <div>
            <label style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Cota (R$)</label>
            <input name="entry_fee" type="number" step="0.01" defaultValue={pool.entry_fee} required style={{ padding: '8px 12px', fontSize: '.88rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)', width: '90px' }} />
          </div>
          <div>
            <label style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Status</label>
            <select name="is_open" defaultValue={pool.is_open ? 'true' : 'false'} style={{ padding: '8px 12px', fontSize: '.88rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option value="true">Aberto</option>
              <option value="false">Encerrado</option>
            </select>
          </div>
          <button type="submit" disabled={savingPool} className="btn" style={{ padding: '8px 18px', fontSize: '.8rem', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {savingPool ? '...' : 'Salvar'}
          </button>
        </div>
      </form>

      {/* Sync results */}
      {pool.game && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)' }}>Buscar resultados da API</div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Preenche automaticamente as respostas corretas com dados da football-data.org</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <button onClick={handleSync} disabled={syncing} className="btn btn-green" style={{ padding: '8px 18px', fontSize: '.8rem' }}>
              {syncing ? 'Buscando...' : '↻ Sincronizar resultado'}
            </button>
            {syncMsg && <span style={{ fontSize: '.72rem', color: syncMsg.ok ? 'var(--green)' : '#ff6b6b' }}>{syncMsg.ok ? '✓ ' : '✗ '}{syncMsg.msg}</span>}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="card" style={{ padding: '20px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Perguntas · {questions.length}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {questions.length === 0 && <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Nenhuma pergunta ainda.</div>}
          {questions.map((q: any, i: number) => (
            <div key={q.id} style={{ padding: '12px 14px', background: 'var(--s2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    {i + 1}. {q.question}
                    <span style={{ fontSize: '.65rem', color: 'var(--muted)', fontWeight: 400, marginLeft: '8px' }}>
                      {q.points} pts {q.metric_type ? `· ${METRIC_LABELS[q.metric_type] ?? q.metric_type}` : '· manual'}
                    </span>
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                    Opções: {(q.options as string[]).join(', ')}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Resposta correta:</span>
                    {q.correct_answer
                      ? <span className="badge badge-green" style={{ fontSize: '.65rem' }}>{q.correct_answer}</span>
                      : <span className="badge badge-muted" style={{ fontSize: '.65rem' }}>Não definida</span>
                    }
                    <select
                      defaultValue=""
                      onChange={(e) => e.target.value && handleSetAnswer(q.id, e.target.value)}
                      style={{ fontSize: '.72rem', padding: '3px 6px', borderRadius: '6px', background: 'var(--s1)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      <option value="">Definir manualmente...</option>
                      {(q.options as string[]).map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => handleDelete(q.id)} style={{ fontSize: '.7rem', color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add question form */}
        <form onSubmit={handleAddQuestion}>
          <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Adicionar pergunta</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Template (preenche automático)</label>
              <select value={qForm.metric_type} onChange={(e) => { setQForm((p) => ({ ...p, metric_type: e.target.value })); applyTemplate(e.target.value) }}
                style={{ width: '100%', padding: '8px 12px', fontSize: '.85rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <option value="">— Pergunta manual —</option>
                {Object.entries(METRIC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Pergunta</label>
              <input value={qForm.question} onChange={(e) => setQForm((p) => ({ ...p, question: e.target.value }))} required placeholder="Ex: Quem fará o primeiro gol?" style={{ width: '100%', padding: '8px 12px', fontSize: '.85rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Opções (uma por linha)</label>
              <textarea value={qForm.options} onChange={(e) => setQForm((p) => ({ ...p, options: e.target.value }))} required rows={4} placeholder="Sim&#10;Não" style={{ width: '100%', padding: '8px 12px', fontSize: '.85rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)', resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Pontos</label>
              <input type="number" min="1" value={qForm.points} onChange={(e) => setQForm((p) => ({ ...p, points: e.target.value }))} required style={{ width: '80px', padding: '8px 12px', fontSize: '.88rem', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <button type="submit" disabled={addingQ} className="btn btn-green" style={{ padding: '9px 20px', alignSelf: 'flex-start' }}>
              {addingQ ? 'Adicionando...' : '+ Adicionar pergunta'}
            </button>
          </div>
        </form>
      </div>

      {/* Participants */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Participantes · {participants.length} ({participants.filter((p: any) => p.paid).length} pagos)
        </div>
        {participants.length === 0 && <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Nenhum participante ainda.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {participants.map((p: any) => (
            <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--s2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--text)' }}>{p.profile?.name ?? '—'}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{p.total_points ?? 0} pts · {p.answers_count ?? 0} respostas</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${p.paid ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '.65rem' }}>
                  {p.paid ? '✓ Pago' : '✗ Pendente'}
                </span>
                <button
                  onClick={() => handleTogglePaid(p.user_id, !p.paid)}
                  style={{ fontSize: '.7rem', padding: '4px 10px', borderRadius: '6px', background: 'var(--s1)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  {p.paid ? 'Desfazer' : 'Confirmar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
