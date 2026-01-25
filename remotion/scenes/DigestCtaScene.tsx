import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import type { DigestPromoProps } from '../types'

const BellIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="18" cy="4" r="3" fill={color} stroke="none" />
  </svg>
)

const CheckIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

export const DigestCtaScene = ({ copy, theme }: DigestPromoProps) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const isVertical = height > width

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  })

  const titleOffset = interpolate(entrance, [0, 1], [40, 0])
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const bellWiggle = interpolate(
    frame % 30,
    [0, 5, 10, 15, 20, 25, 30],
    [0, -8, 8, -5, 5, -2, 0]
  )

  const buttonScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 150 },
  })

  const buttonGlow = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.6, 0.3]
  )

  const benefits = ['Free forever', 'No spam', 'Unsubscribe anytime']

  return (
    <SceneShell theme={theme}>
      <AbsoluteFill
        style={{
          padding: isVertical ? '120px 70px' : '100px 140px',
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
            gap: isVertical ? 28 : 36,
            maxWidth: 1000,
          }}
        >
          {/* Animated bell icon */}
          <div
            style={{
              transform: `rotate(${bellWiggle}deg)`,
              opacity,
            }}
          >
            <BellIcon size={isVertical ? 72 : 88} color={theme.accent} />
          </div>

          {/* Main headline */}
          <div
            style={{
              transform: `translateY(${titleOffset}px)`,
              opacity,
            }}
          >
            <div
              style={{
                fontFamily: fontFamilies.display,
                fontSize: isVertical ? 64 : 84,
                fontWeight: 700,
                lineHeight: 1.08,
                marginBottom: 18,
              }}
            >
              {copy.ctaPrimary}
            </div>
            <div
              style={{
                fontFamily: fontFamilies.body,
                fontSize: isVertical ? 22 : 28,
                lineHeight: 1.5,
                color: theme.textMuted,
                maxWidth: isVertical ? 600 : 800,
                margin: '0 auto',
              }}
            >
              {copy.ctaSecondary}
            </div>
          </div>

          {/* CTA Button */}
          <Sequence from={20} layout="none">
            <div
              style={{
                position: 'relative',
                transform: `scale(${buttonScale})`,
              }}
            >
              {/* Glow effect */}
              <div
                style={{
                  position: 'absolute',
                  inset: -8,
                  background: theme.accent,
                  borderRadius: 999,
                  filter: 'blur(20px)',
                  opacity: buttonGlow,
                }}
              />
              <div
                style={{
                  position: 'relative',
                  padding: isVertical ? '20px 48px' : '24px 64px',
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.highlight} 100%)`,
                  fontFamily: fontFamilies.body,
                  fontSize: isVertical ? 22 : 26,
                  fontWeight: 700,
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 6l9 6 9-6" />
                </svg>
                Subscribe Free
              </div>
            </div>
          </Sequence>

          {/* Benefits list */}
          <div
            style={{
              display: 'flex',
              gap: isVertical ? 16 : 28,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            {benefits.map((benefit, index) => {
              const delay = 35 + index * 8
              const benefitEntrance = spring({
                frame: frame - delay,
                fps,
                config: { damping: 200 },
              })
              const benefitOpacity = interpolate(frame - delay, [0, 12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
              const benefitOffset = interpolate(benefitEntrance, [0, 1], [20, 0])

              return (
                <div
                  key={benefit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transform: `translateY(${benefitOffset}px)`,
                    opacity: benefitOpacity,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: `${theme.highlight}33`,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <CheckIcon size={14} color={theme.highlight} />
                  </div>
                  <span
                    style={{
                      fontFamily: fontFamilies.body,
                      fontSize: isVertical ? 16 : 18,
                      color: theme.textMuted,
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Site URL */}
          <Sequence from={60} layout="none">
            <div
              style={{
                marginTop: isVertical ? 20 : 28,
                padding: '14px 28px',
                borderRadius: 999,
                border: `1px solid ${theme.accent}55`,
                background: theme.accentSoft,
              }}
            >
              <span
                style={{
                  fontFamily: fontFamilies.body,
                  fontSize: isVertical ? 18 : 22,
                  fontWeight: 600,
                  color: theme.textPrimary,
                }}
              >
                {copy.siteUrl}
              </span>
            </div>
          </Sequence>
        </div>
      </AbsoluteFill>
    </SceneShell>
  )
}
