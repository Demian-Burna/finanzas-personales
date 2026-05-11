import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '600px',
        height: '180px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          background: '#1a6bff',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 64 64">
          <line x1="13" y1="49" x2="51" y2="49" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="14,44 24,36 34,38 44,26 52,18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="44" r="2.5" fill="white" />
          <circle cx="34" cy="38" r="2.5" fill="white" />
          <circle cx="44" cy="26" r="2.5" fill="white" />
          <circle cx="52" cy="18" r="2.5" fill="white" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '34px', fontWeight: 700, color: '#0f0f0f', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          Finanzas
        </span>
        <span style={{ fontSize: '34px', fontWeight: 700, color: '#0f0f0f', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          Personales
        </span>
      </div>
    </div>,
    { width: 600, height: 180 },
  )
}
