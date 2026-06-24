'use client'

import { useState } from 'react'

export default function AdminJogosPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleImport() {
    setLoading(true)
    setResult(null)
    const res = await fetch('/api/admin/import-games', { method: 'POST' })
    const json = await res.json()
    setLoading(false)
    if (json.error) setResult({ ok: false, msg: json.error })
    else setResult({ ok: true, msg: `${json.imported} jogos importados com sucesso!` })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold" style={{ color: '#F0F4F8' }}>Jogos da Copa 2026</h2>
        <button
          onClick={handleImport}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #FFD700, #C9A800)', color: '#0D1B2A' }}
        >
          {loading ? 'Importando...' : '⬇ Importar da API-Football'}
        </button>
      </div>

      {result && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-sm"
          style={{
            background: result.ok ? '#00C853' + '22' : '#F44336' + '22',
            border: `1px solid ${result.ok ? '#00C853' : '#F44336'}`,
            color: result.ok ? '#00C853' : '#F44336',
          }}
        >
          {result.msg}
        </div>
      )}

      <GamesList />
    </div>
  )
}

function GamesList() {
  const [games, setGames] = useState<any[] | null>(null)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/games')
    const json = await res.json()
    setGames(json.games ?? [])
    setLoaded(true)
  }

  if (!loaded) {
    return (
      <button
        onClick={load}
        className="px-4 py-2 rounded-xl text-sm"
        style={{ background: '#162233', color: '#7A8FA6', border: '1px solid #1E2F45' }}
      >
        Carregar lista de jogos
      </button>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#1E2F45', color: '#7A8FA6' }}>
            <th className="px-4 py-3 text-left">Jogo</th>
            <th className="px-4 py-3 text-left hidden sm:table-cell">Fase</th>
            <th className="px-4 py-3 text-left">Data</th>
            <th className="px-4 py-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {games?.map((g) => (
            <tr key={g.id} style={{ borderTop: '1px solid #1E2F45' }}>
              <td className="px-4 py-3" style={{ color: '#F0F4F8' }}>
                {g.home_team} × {g.away_team}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell" style={{ color: '#7A8FA6' }}>
                {g.stage}{g.group_name ? ` · ${g.group_name}` : ''}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: '#7A8FA6' }}>
                {new Date(g.game_date).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className="px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: g.is_finished ? '#00C853' + '33' : '#1E2F45',
                    color: g.is_finished ? '#00C853' : '#7A8FA6',
                  }}
                >
                  {g.is_finished ? 'Encerrado' : 'Agendado'}
                </span>
              </td>
            </tr>
          ))}
          {games?.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center" style={{ color: '#7A8FA6' }}>
                Nenhum jogo importado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
