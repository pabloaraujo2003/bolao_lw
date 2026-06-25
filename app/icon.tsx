import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#04080D',
          borderRadius: 7,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #00E599',
        }}
      >
        <div
          style={{
            fontFamily: 'sans-serif',
            fontWeight: 900,
            fontSize: 13,
            color: '#00E599',
            lineHeight: 1,
            letterSpacing: '-0.5px',
          }}
        >
          B26
        </div>
      </div>
    ),
    { ...size }
  )
}
