'use client'

import { useState, useEffect } from 'react'
import { updateSettings } from '@/app/actions/admin'

const fields = [
  { key: 'pool_name', label: 'Nome do bolão', type: 'text', placeholder: 'Bolão da Copa 2026' },
  { key: 'entry_fee', label: 'Cota de entrada (R$)', type: 'number', placeholder: '50' },
  { key: 'pix_key', label: 'Chave Pix', type: 'text', placeholder: 'email@exemplo.com' },
  { key: 'prize_1st_pct', label: '% 1º lugar', type: 'number', placeholder: '60' },
  { key: 'prize_2nd_pct', label: '% 2º lugar', type: 'number', placeholder: '30' },
  { key: 'prize_3rd_pct', label: '% 3º lugar', type: 'number', placeholder: '10' },
]

export default function AdminConfiguracoesPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((json) => setSettings(json.settings ?? {}))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    const res = await updateSettings(fd)
    setLoading(false)
    if (res?.error) setFeedback({ ok: false, msg: res.error as string })
    else setFeedback({ ok: true, msg: 'Configurações salvas com sucesso!' })
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="display" style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '.2rem' }}>Configurações</h2>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Parâmetros gerais do bolão</p>
      </div>

      {feedback && (
        <div style={{
          marginBottom: '1.25rem', padding: '12px 16px', borderRadius: '11px',
          background: feedback.ok ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${feedback.ok ? 'rgba(0,229,153,.25)' : 'rgba(255,77,77,.25)'}`,
          color: feedback.ok ? 'var(--green)' : 'var(--red)',
          fontSize: '.82rem', fontWeight: 500,
        }}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
        </div>
      )}

      <div className="card fade-2" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* First row: 2 cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {fields.slice(0, 2).map((f) => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '7px', fontWeight: 500 }}>
                  {f.label}
                </label>
                <input
                  name={f.key}
                  type={f.type}
                  defaultValue={settings[f.key] ?? ''}
                  placeholder={f.placeholder}
                  className="field"
                />
              </div>
            ))}
          </div>

          {/* Pix full width */}
          <div>
            <label style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '7px', fontWeight: 500 }}>
              {fields[2].label}
            </label>
            <input
              name={fields[2].key}
              type={fields[2].type}
              defaultValue={settings[fields[2].key] ?? ''}
              placeholder={fields[2].placeholder}
              className="field"
            />
          </div>

          {/* Prizes separator */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Distribuição do prêmio
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {fields.slice(3).map((f, i) => {
                const colors = ['var(--amber)', '#C8D6E5', '#CD8E5A']
                return (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '.72rem', color: colors[i], letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '7px', fontWeight: 600 }}>
                      {f.label}
                    </label>
                    <input
                      name={f.key}
                      type={f.type}
                      defaultValue={settings[f.key] ?? ''}
                      placeholder={f.placeholder}
                      className="field"
                      style={{ textAlign: 'center' }}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '8px' }}>
              A soma deve ser 100%.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-green"
            style={{ padding: '13px', fontSize: '.88rem', width: '100%', marginTop: '4px' }}
          >
            {loading ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>
      </div>
    </div>
  )
}
