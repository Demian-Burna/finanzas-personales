import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Renders at 2× the natural SVG size (320×64 → 640×128) so it's crisp on retina
// and matches the logo proportions exactly.
export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '640px',
        height: '128px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        padding: '0 32px',
      }}
    >
      {/* Icon — matches logo-icono.svg at 2× */}
      <div
        style={{
          width: '128px',
          height: '128px',
          background: '#1a6bff',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="88" height="88" viewBox="0 0 64 64">
          <line x1="13" y1="49" x2="51" y2="49" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="14,44 24,36 34,38 44,26 52,18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="44" r="2.5" fill="white" />
          <circle cx="34" cy="38" r="2.5" fill="white" />
          <circle cx="44" cy="26" r="2.5" fill="white" />
          <circle cx="52" cy="18" r="2.5" fill="white" />
        </svg>
      </div>

      {/* Text — matches logo.svg at 2× (font-size 20 → 40) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        <span style={{ fontSize: '40px', fontWeight: 700, color: '#0f0f0f', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
          Finanzas
        </span>
        <span style={{ fontSize: '40px', fontWeight: 700, color: '#0f0f0f', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
          Personales
        </span>
      </div>
    </div>,
    { width: 640, height: 128 },
  )
}
