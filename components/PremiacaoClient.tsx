'use client'

import { useState } from 'react'
import { PixQrCard } from './PixQrCard'
import type { RankingRow } from '@/lib/types'

type PixOption = {
  id: string
  label: string
  subtitle?: string
  amount: string
  paid: boolean
  pixPayload: string
}

type Prize = {
  pos: string
  label: string
  pct: number
  value: number
  color: string
  dim: string
  border: string
}

type Props = {
  pixKey: string
  pixOptions: PixOption[]
  ranking: RankingRow[]
  totalPool: number
  totalPaid: number
  prizes: Prize[]
  isLoggedIn: boolean
}

export function PremiacaoClient({ pixKey, pixOptions, ranking, totalPool, totalPaid, prizes, isLoggedIn }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = pixOptions.find((o) => o.id === selectedId) ?? null

  return (
    <div>
      {/* Header */}
      <div className="fade-1" style={{ marginBottom: '1.75rem' }}>
        <h1 className="display" style={{ fontSize: '2.5rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          Premiação
        </h1>
        <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Distribuição do prêmio e situação de pagamento</p>
      </div>

      {/* Payment section */}
      {isLoggedIn && pixOptions.length > 0 && (
        <div className="fade-2" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px',
          }}>
            Selecione para pagar
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {pixOptions.map((opt) => {
              const isSelected = selectedId === opt.id
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedId(isSelected ? null : opt.id)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(0,229,153,.06)' : 'var(--card)',
                    border: `1px solid ${isSelected ? 'rgba(0,229,153,.35)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'border-color .15s, background .15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                      {opt.label}
                    </div>
                    {opt.subtitle && (
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>
                        {opt.subtitle}
                      </div>
                    )}
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                      Cota · R$ {parseFloat(opt.amount).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span
                      className={`badge ${opt.paid ? 'badge-green' : 'badge-red'}`}
                      style={{ fontSize: '.68rem' }}
                    >
                      {opt.paid ? '✓ Pago' : 'Pendente'}
                    </span>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--green)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.55rem', color: '#0D1B2A',
                      transition: 'all .15s', flexShrink: 0,
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* QR or confirmation for selected option */}
          {selected && (
            selected.paid ? (
              <div className="card" style={{
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px',
                borderColor: 'rgba(0,229,153,.25)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(0,229,153,.15)', border: '1px solid rgba(0,229,153,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>✓</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#00E599', fontSize: '.95rem' }}>Pagamento confirmado</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Sua inscrição em <strong style={{ color: 'var(--text)' }}>{selected.label}</strong> está confirmada.
                  </div>
                </div>
              </div>
            ) : (
              <PixQrCard
                pixPayload={selected.pixPayload}
                pixKey={pixKey}
                amount={selected.amount}
              />
            )
          )}

          {!selected && (
            <div style={{
              padding: '18px', borderRadius: '12px', border: '1px dashed var(--border)',
              textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem',
            }}>
              Selecione uma opção acima para gerar o QR code Pix
            </div>
          )}
        </div>
      )}

      {!isLoggedIn && (
        <div className="card fade-2" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
            Faça login para ver as opções de pagamento.
          </p>
        </div>
      )}

      {/* Total + distribution */}
      <div className="fade-4 card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px',
          }}>
            Total arrecadado · Bolão Principal
          </div>
          <div className="display text-amber" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '4px' }}>
            R$ {totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
            {totalPaid} participante{totalPaid !== 1 ? 's' : ''} pago{totalPaid !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {prizes.map((p, i) => (
            <div key={p.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: '11px',
              background: p.dim, border: `1px solid ${p.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="mono display" style={{ fontSize: '1.5rem', color: p.color }}>
                  {p.pos}
                </span>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text)' }}>{p.label}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{p.pct}% do total</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontWeight: 700, color: p.color, fontSize: '1rem' }}>
                  R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {ranking[i] && (
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {(ranking[i] as RankingRow).name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
