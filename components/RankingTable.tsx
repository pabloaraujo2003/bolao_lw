import type { RankingRow } from '@/lib/types'

function medal(pos: number) {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `${pos}º`
}

export function RankingTable({ rows, currentUserId }: { rows: RankingRow[]; currentUserId?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#162233', border: '1px solid #1E2F45' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#1E2F45', color: '#7A8FA6' }}>
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">Participante</th>
            <th className="px-4 py-3 text-right font-medium">Pontos</th>
            <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Exatos</th>
            <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Resultados</th>
            <th className="px-4 py-3 text-right font-medium hidden md:table-cell">Palpites</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isMe = row.user_id === currentUserId
            return (
              <tr
                key={row.user_id}
                style={{
                  borderTop: '1px solid #1E2F45',
                  background: isMe ? '#1E2F45' : 'transparent',
                }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#7A8FA6' }}>{medal(i + 1)}</td>
                <td className="px-4 py-3 font-medium" style={{ color: isMe ? '#FFD700' : '#F0F4F8' }}>
                  {row.name} {isMe && <span className="text-xs ml-1" style={{ color: '#7A8FA6' }}>(você)</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: '#FFD700' }}>{row.total_points}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: '#00C853' }}>{row.exact_scores}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: '#7A8FA6' }}>{row.correct_results}</td>
                <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: '#7A8FA6' }}>{row.predictions_count}</td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center" style={{ color: '#7A8FA6' }}>
                Ranking vazio — os pontos aparecerão após os primeiros jogos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
