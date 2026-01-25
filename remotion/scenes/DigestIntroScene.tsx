import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence, Img, staticFile } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import type { DigestPromoProps } from '../types'

const SunIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)

const MailIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 6l9 6 9-6" />
  </svg>
)

export const DigestIntroScene = ({ copy, theme }: DigestPromoProps) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const isVertical = height > width

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  })

  const sunRotation = interpolate(frame, [0, 150], [0, 360])
  const iconScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  })

  const titleShift = interpolate(entrance, [0, 1], [50, 0])
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const timeBadgeScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 100 },
  })

  // Background screenshot fade
  const bgOpacity = interpolate(frame, [0, 40], [0, 0.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const screenshotSrc = isVertical
    ? staticFile('screenshots/dashboard-mobile.png')
    : staticFile('screenshots/dashboard-full.png')

  return (
    <SceneShell theme={theme}>
      {/* Background screenshot with blur */}
      <AbsoluteFill
        style={{
          opacity: bgOpacity,
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      >
        <Img
          src={screenshotSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      {/* Gradient overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${theme.background}90 0%, ${theme.background} 70%)`,
        }}
      />

      <AbsoluteFill
        style={{
          padding: isVertical ? '140px 80px' : '100px 140px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: isVertical ? 28 : 32,
          }}
        >
          {/* Logo and icons */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              opacity,
            }}
          >
            {/* Siouxland Online Logo */}
            <div
              style={{
                width: isVertical ? 80 : 100,
                height: isVertical ? 80 : 100,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'grid',
                placeItems: 'center',
                transform: `scale(${iconScale})`,
                overflow: 'hidden',
              }}
            >
              <Img
                src={staticFile('siouxlandonlineicon.png')}
                style={{
                  width: '80%',
                  height: '80%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Plus sign */}
            <div
              style={{
                fontFamily: fontFamilies.display,
                fontSize: 40,
                color: theme.textMuted,
                opacity: 0.5,
              }}
            >
              +
            </div>

            {/* Mail icon */}
            <div
              style={{
                width: isVertical ? 80 : 100,
                height: isVertical ? 80 : 100,
                borderRadius: 20,
                background: `linear-gradient(135deg, ${theme.accent}30 0%, ${theme.highlight}30 100%)`,
                border: `2px solid ${theme.accent}50`,
                display: 'grid',
                placeItems: 'center',
                transform: `scale(${iconScale})`,
              }}
            >
              <MailIcon size={isVertical ? 40 : 48} color={theme.accent} />
            </div>
          </div>

          {/* Time badge */}
          <Sequence from={15} layout="none">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 28px',
                borderRadius: 999,
                background: theme.accentSoft,
                border: `2px solid ${theme.accent}`,
                transform: `scale(${timeBadgeScale})`,
              }}
            >
              <div
                style={{
                  transform: `rotate(${sunRotation}deg)`,
                }}
              >
                <SunIcon size={20} color={theme.accent} />
              </div>
              <span
                style={{
                  fontFamily: fontFamilies.body,
                  fontSize: isVertical ? 20 : 24,
                  fontWeight: 700,
                  color: theme.accent,
                  letterSpacing: '0.05em',
                }}
              >
                {copy.timeLabel}
              </span>
            </div>
          </Sequence>

          {/* Main headline */}
          <div
            style={{
              transform: `translateY(${titleShift}px)`,
              opacity,
            }}
          >
            <div
              style={{
                fontFamily: fontFamilies.display,
                fontSize: isVertical ? 72 : 96,
                fontWeight: 700,
                lineHeight: 1.05,
                marginBottom: 20,
                background: `linear-gradient(135deg, ${theme.textPrimary} 0%, ${theme.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {copy.headline}
            </div>
            <div
              style={{
                fontFamily: fontFamilies.body,
                fontSize: isVertical ? 26 : 32,
                lineHeight: 1.5,
                color: theme.textMuted,
                maxWidth: isVertical ? 700 : 900,
              }}
            >
              {copy.subheadline}
            </div>
          </div>

          {/* Feature pills */}
          <Sequence from={40} layout="none">
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: 16,
              }}
            >
              {['Weather', 'Gas Prices', 'Alerts', 'Traffic'].map((label, i) => {
                const pillEntrance = spring({
                  frame: frame - 40 - i * 5,
                  fps,
                  config: { damping: 200 },
                })
                const pillOpacity = interpolate(frame - 40 - i * 5, [0, 15], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })
                const pillY = interpolate(pillEntrance, [0, 1], [20, 0])

                return (
                  <div
                    key={label}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      fontFamily: fontFamilies.body,
                      fontSize: 16,
                      fontWeight: 500,
                      color: theme.textMuted,
                      transform: `translateY(${pillY}px)`,
                      opacity: pillOpacity,
                    }}
                  >
                    {label}
                  </div>
                )
              })}
            </div>
          </Sequence>
        </div>
      </AbsoluteFill>
    </SceneShell>
  )
}
