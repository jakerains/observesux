import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Siouxland.Online - Your Community Dashboard'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Warm amber/wheat gradient matching the Midwest theme
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 30%, #fde68a 70%, #fcd34d 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Subtle dot pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(180, 83, 9, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            display: 'flex',
          }}
        />

        {/* Warm glow accents */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(ellipse at 20% 30%, rgba(251, 191, 36, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(245, 158, 11, 0.2) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Icon row - warm themed */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {/* Weather icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(217, 119, 6, 0.35)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </div>

            {/* Camera icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #78716c 0%, #57534e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(87, 83, 78, 0.35)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="m22 8-6 4 6 4V8Z" />
                <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
              </svg>
            </div>

            {/* News/Digest icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(120, 53, 15, 0.35)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
              </svg>
            </div>

            {/* Map/Location icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#78350f',
              marginBottom: '12px',
              display: 'flex',
              letterSpacing: '-2px',
            }}
          >
            Siouxland.Online
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '32px',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            Your Community Dashboard
          </div>

          {/* Location line with live indicator */}
          <div
            style={{
              fontSize: '22px',
              color: '#a16207',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '8px',
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '9999px',
                backgroundColor: '#22c55e',
                display: 'flex',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
              }}
            />
            Live updates for Sioux City &amp; the Siouxland region
          </div>

          {/* Features row */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '48px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Weather', 'Traffic Cameras', 'Local News', 'AI Digest', 'River Levels'].map((feature) => (
              <div
                key={feature}
                style={{
                  fontSize: '16px',
                  color: '#78350f',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  border: '2px solid rgba(120, 53, 15, 0.2)',
                  background: 'rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  fontWeight: '500',
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#b45309',
            fontSize: '18px',
            fontWeight: '500',
          }}
        >
          <span>siouxland.online</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
