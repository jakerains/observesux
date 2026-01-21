import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import type { PromoVideoProps } from '../types'

export const CtaScene = ({ copy, theme }: PromoVideoProps) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const isVertical = height > width
  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  })
  const offset = interpolate(entrance, [0, 1], [30, 0])
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <SceneShell theme={theme}>
      <AbsoluteFill
        style={{
          padding: isVertical ? '120px 90px' : '120px 140px',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        <div style={{ transform: `translateY(${offset}px)`, opacity }}>
          <div
            style={{
              fontFamily: fontFamilies.body,
              fontSize: 18,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: theme.textMuted,
              marginBottom: 20,
            }}
          >
            Stay Connected
          </div>
          <div
            style={{
              fontFamily: fontFamilies.display,
              fontSize: isVertical ? 76 : 92,
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: 22,
            }}
          >
            {copy.ctaPrimary}
          </div>
          <div
            style={{
              fontFamily: fontFamilies.body,
              fontSize: isVertical ? 24 : 28,
              lineHeight: 1.6,
              color: theme.textMuted,
              maxWidth: isVertical ? 720 : 860,
            }}
          >
            {copy.ctaSecondary}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {[copy.siteUrl, 'Daily alerts', 'Live updates'].map((label, index) => {
            const delay = index * 6
            const chipIn = spring({
              frame: frame - delay,
              fps,
              config: { damping: 200 },
            })
            const translate = interpolate(chipIn, [0, 1], [20, 0])
            const chipOpacity = interpolate(frame - delay, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
            return (
              <div
                key={label}
                style={{
                  padding: '14px 26px',
                  borderRadius: 999,
                  border: `1px solid ${theme.accent}`,
                  fontFamily: fontFamilies.body,
                  fontWeight: 600,
                  fontSize: 20,
                  background: theme.accentSoft,
                  transform: `translateY(${translate}px)`,
                  opacity: chipOpacity,
                }}
              >
                {label}
              </div>
            )
          })}
        </div>
      </AbsoluteFill>
    </SceneShell>
  )
}
