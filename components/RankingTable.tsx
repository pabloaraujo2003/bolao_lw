import type { RankingRow } from '@/lib/types'

const podium: Record<number, { num: string; row: string; border: string }> = {
  1: { num: 'var(--amber)',      row: 'rgba(245,200,66,.06)',   border: 'rgba(245,200,66,.18)' },
  2: { num: '#C8D6E5',           row: 'rgba(200,214,229,.04)',  border: 'rgba(200,214,229,.12)' },
  3: { num: '#CD8E5A',           row: 'rgba(205,142,90,.04)',   border: 'rgba(205,142,90,.12)' },
}

export function RankingTable({ rows, currentUserId }: { rows: RankingRow[]; currentUserId?: string }) {
  if (rows.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
        Ranking vazio — os pontos aparecerão após os primeiros jogos.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2.8rem 1fr 3.6rem 3.8rem 3.8rem',
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
          <div
            key={row.user_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2.8rem 1fr 3.6rem 3.8rem 3.8rem',
              alignItems: 'center',
              padding: '13px 16px',
              borderRadius: '11px',
              background: isMe ? 'rgba(0,229,153,.06)' : p ? p.row : 'var(--s1)',
              border: `1px solid ${isMe ? 'rgba(0,229,153,.2)' : p ? p.border : 'var(--border)'}`,
              transition: 'border-color .2s',
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
              fontSize: '.88rem',
              fontWeight: isMe ? 600 : 500,
              color: isMe ? 'var(--green)' : 'var(--text)',
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
          </div>
        )
      })}
    </div>
  )
}
