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
      className="px-3 py-1 rounded-full text-xs font-bold disabled:opacity-60 transition-colors"
      style={{
        background: isPaid ? '#00C853' + '33' : '#F44336' + '33',
        color: isPaid ? '#00C853' : '#F44336',
        border: `1px solid ${isPaid ? '#00C853' : '#F44336'}`,
      }}
    >
      {loading ? '...' : isPaid ? '✓ Pago' : '✗ Pendente'}
    </button>
  )
}
