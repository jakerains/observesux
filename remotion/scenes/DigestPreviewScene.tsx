import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import type { DigestPromoProps } from '../types'

export const DigestPreviewScene = ({ theme }: DigestPromoProps) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const isVertical = height > width

  const deviceEntrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  })

  const deviceScale = interpolate(deviceEntrance, [0, 1], [0.9, 1])
  const deviceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Floating glow animation
  const glowPulse = interpolate(frame % 90, [0, 45, 90], [0.3, 0.6, 0.3])

  // Screenshot scroll animation (subtle pan down)
  const scrollY = interpolate(frame, [20, 120], [0, isVertical ? 100 : 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Badge entrance
  const badgeEntrance = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 120 },
  })

  const screenshotSrc = isVertical
    ? staticFile('screenshots/dashboard-mobile.png')
    : staticFile('screenshots/dashboard-full.png')

  return (
    <SceneShell theme={theme}>
      <AbsoluteFill
        style={{
          padding: isVertical ? '80px 40px' : '60px 100px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Section title */}
        <Sequence from={0} layout="none">
          <div
            style={{
              position: 'absolute',
              top: isVertical ? 100 : 70,
              left: 0,
              right: 0,
              textAlign: 'center',
              opacity: deviceOpacity,
            }}
          >
            <div
              style={{
                fontFamily: fontFamilies.body,
                fontSize: 16,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: theme.textMuted,
                marginBottom: 12,
              }}
            >
              Powered by Live Data
            </div>
            <div
              style={{
                fontFamily: fontFamilies.display,
                fontSize: isVertical ? 42 : 52,
                fontWeight: 700,
                color: theme.textPrimary,
              }}
            >
              Your Dashboard, Delivered
            </div>
          </div>
        </Sequence>

        {/* Device frame with screenshot */}
        <div
          style={{
            position: 'relative',
            transform: `scale(${deviceScale})`,
            opacity: deviceOpacity,
            marginTop: isVertical ? 120 : 80,
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: 'absolute',
              inset: -40,
              background: `radial-gradient(ellipse at center, ${theme.accent}40 0%, transparent 70%)`,
              filter: 'blur(40px)',
              opacity: glowPulse,
              borderRadius: 60,
            }}
          />

          {/* Browser/phone frame */}
          <div
            style={{
              position: 'relative',
              width: isVertical ? 380 : 1000,
              height: isVertical ? 700 : 580,
              background: '#1a1a20',
              borderRadius: isVertical ? 40 : 16,
              padding: isVertical ? 12 : 8,
              boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Browser chrome (desktop only) */}
            {!isVertical && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    marginLeft: 16,
                    padding: '6px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6,
                    fontFamily: fontFamilies.body,
                    fontSize: 13,
                    color: theme.textMuted,
                  }}
                >
                  siouxland.online
                </div>
              </div>
            )}

            {/* Phone notch (mobile only) */}
            {isVertical && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 120,
                  height: 28,
                  background: '#000',
                  borderRadius: 20,
                  zIndex: 10,
                }}
              />
            )}

            {/* Screenshot container with overflow hidden */}
            <div
              style={{
                width: '100%',
                height: isVertical ? '100%' : 'calc(100% - 44px)',
                overflow: 'hidden',
                borderRadius: isVertical ? 32 : 8,
                background: '#0f0f12',
              }}
            >
              <Img
                src={screenshotSrc}
                style={{
                  width: '100%',
                  height: 'auto',
                  transform: `translateY(-${scrollY}px)`,
                }}
              />
            </div>
          </div>

          {/* "Live" badge */}
          <Sequence from={30} layout="none">
            <div
              style={{
                position: 'absolute',
                top: isVertical ? 80 : 20,
                right: isVertical ? -10 : -20,
                transform: `scale(${badgeEntrance})`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: theme.highlight,
                borderRadius: 999,
                boxShadow: '0 8px 24px rgba(132, 204, 22, 0.4)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#fff',
                  animation: 'none',
                }}
              />
              <span
                style={{
                  fontFamily: fontFamilies.body,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Live Data
              </span>
            </div>
          </Sequence>
        </div>
      </AbsoluteFill>
    </SceneShell>
  )
}
