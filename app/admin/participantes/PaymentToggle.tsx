'use client'

import { useState } from 'react'
import { togglePayment } from '@/app/actions/admin'

export function PaymentToggle({ userId, paid }: { userId: string; paid: boolean }) {
  const [isPaid, setIsPaid] = useState(paid)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await togglePayment(userId, !isPaid)
    if (!res?.error) setIsPaid((p) => !p)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: '5px 14px', borderRadius: '99px',
        fontSize: '.72rem', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? .6 : 1,
        transition: 'all .15s',
        background: isPaid ? 'var(--green-dim)' : 'var(--red-dim)',
        color: isPaid ? 'var(--green)' : 'var(--red)',
        border: `1px solid ${isPaid ? 'rgba(0,229,153,.3)' : 'rgba(255,77,77,.3)'}`,
      }}
    >
      {loading ? '···' : isPaid ? '✓ Pago' : '✗ Pendente'}
    </button>
  )
}
