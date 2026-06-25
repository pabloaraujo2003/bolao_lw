'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'react-qr-code'

type Props = {
  pixPayload: string
  pixKey: string
  amount: string
}

export function PixQrCard({ pixPayload, pixKey, amount }: Props) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for HTTP or permission denied
      try {
        const ta = document.createElement('textarea')
        ta.value = pixKey
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), 2000)
      } catch {
        // copy unavailable — silent fail, user can copy manually
      }
    }
  }

  return (
    <div
      className="rounded-2xl p-6 flex flex-col items-center gap-4"
      style={{ background: '#1E2F45' }}
    >
      <p className="text-sm font-medium" style={{ color: '#7A8FA6' }}>
        Pagamento pendente
      </p>

      <div className="rounded-xl p-3 bg-white">
        <QRCode
          value={pixPayload}
          size={200}
          bgColor="#FFFFFF"
          fgColor="#0D1B2A"
          title={`QR code para pagamento Pix de R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}`}
        />
      </div>

      <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>
        R$ {isNaN(parseFloat(amount)) ? amount : parseFloat(amount).toFixed(2).replace('.', ',')}
      </p>

      <p className="text-xs text-center" style={{ color: '#7A8FA6' }}>
        Escaneie o QR ou copie a chave no app do seu banco
      </p>

      <button
        onClick={handleCopy}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-colors min-h-[44px]"
        style={{
          background: copied ? '#00C853' : '#162233',
          color: copied ? '#0D1B2A' : '#F0F4F8',
          border: '1px solid #1E2F45',
        }}
      >
        {copied ? 'Copiado ✓' : 'Copiar chave Pix'}
      </button>
    </div>
  )
}
