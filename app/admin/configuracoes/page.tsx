'use client'

import { useState, useEffect } from 'react'
import { updateSettings } from '@/app/actions/admin'

const fields = [
  { key: 'pool_name', label: 'Nome do bolão', type: 'text' },
  { key: 'entry_fee', label: 'Cota de entrada (R$)', type: 'number' },
  { key: 'prize_1st_pct', label: '% 1º lugar', type: 'number' },
  { key: 'prize_2nd_pct', label: '% 2º lugar', type: 'number' },
  { key: 'prize_3rd_pct', label: '% 3º lugar', type: 'number' },
  { key: 'pix_key', label: 'Chave Pix', type: 'text' },
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
    else setFeedback({ ok: true, msg: 'Configurações salvas!' })
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: '#F0F4F8' }}>Configurações do Bolão</h2>

      {feedback && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{
            background: feedback.ok ? '#00C853' + '22' : '#F44336' + '22',
            border: `1px solid ${feedback.ok ? '#00C853' : '#F44336'}`,
            color: feedback.ok ? '#00C853' : '#F44336',
          }}
        >
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1" style={{ color: '#7A8FA6' }}>{f.label}</label>
            <input
              name={f.key}
              type={f.type}
              defaultValue={settings[f.key] ?? ''}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#1E2F45', color: '#F0F4F8', border: '1px solid #1E2F45' }}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
        >
          {loading ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
