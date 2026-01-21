import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import { resolveAsset } from '../utils'
import type { PromoVideoProps } from '../types'

export const IntroScene = ({ copy, theme }: PromoVideoProps) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const isVertical = height > width
  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  })
  const shift = interpolate(entrance, [0, 1], [36, 0])
  const opacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const logoScale = interpolate(entrance, [0, 1], [0.9, 1])
  const logoSrc = resolveAsset(copy.logoSrc)
  const padding = isVertical ? '140px 90px' : '120px 140px'
  const logoSize = isVertical ? 170 : 140
  const logoInner = isVertical ? 132 : 110

  return (
    <SceneShell theme={theme}>
      <AbsoluteFill
        style={{
          padding,
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: isVertical ? 'flex-start' : 'center',
            flexDirection: isVertical ? 'column' : 'row',
            gap: isVertical ? 18 : 24,
            marginBottom: 36,
          }}
        >
          {logoSrc ? (
            <div
              style={{
                width: logoSize,
                height: logoSize,
                borderRadius: 36,
                background: theme.backgroundAlt,
                border: `2px solid ${theme.accent}`,
                display: 'grid',
                placeItems: 'center',
                transform: `scale(${logoScale})`,
                opacity,
              }}
            >
              <Img
                src={logoSrc}
                style={{ width: logoInner, height: logoInner, objectFit: 'contain' }}
              />
            </div>
          ) : null}
          <div
            style={{
              fontFamily: fontFamilies.body,
              fontSize: 18,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: theme.textMuted,
              opacity,
            }}
          >
            {copy.introNote}
          </div>
        </div>
        <div style={{ transform: `translateY(${shift}px)`, opacity }}>
          <div
            style={{
              fontFamily: fontFamilies.display,
              fontSize: isVertical ? 96 : 110,
              fontWeight: 700,
              lineHeight: 1.02,
              marginBottom: 24,
              maxWidth: 1100,
            }}
          >
            {copy.brandName}
          </div>
          <div
            style={{
              fontFamily: fontFamilies.body,
              fontSize: isVertical ? 28 : 34,
              lineHeight: 1.5,
              color: theme.textMuted,
              maxWidth: isVertical ? 760 : 900,
            }}
          >
            {copy.tagline}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: isVertical ? 'wrap' : 'nowrap',
              marginTop: 42,
            }}
          >
            {['Local', 'Chatty', 'Instant'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '14px 22px',
                borderRadius: 999,
                border: `1px solid ${theme.accent}`,
                color: theme.textPrimary,
                fontFamily: fontFamilies.body,
                fontWeight: 600,
                fontSize: 20,
                background: theme.accentSoft,
              }}
            >
                {label}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  )
}
