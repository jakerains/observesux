import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { fontFamilies } from '../fonts'
import type { PromoTheme } from '../theme'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  theme: PromoTheme
  compact?: boolean
}

export const SectionHeading = ({ eyebrow, title, subtitle, theme, compact }: SectionHeadingProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  })
  const offset = interpolate(entrance, [0, 1], [24, 0])
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{ transform: `translateY(${offset}px)`, opacity }}>
      {eyebrow ? (
        <div
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.36em',
            fontSize: 18,
            fontFamily: fontFamilies.body,
            color: theme.textMuted,
            marginBottom: 16,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: fontFamilies.display,
          fontSize: compact ? 68 : 86,
          fontWeight: 700,
          lineHeight: 1.05,
          marginBottom: 20,
          maxWidth: 1100,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            fontFamily: fontFamilies.body,
            fontSize: compact ? 22 : 28,
            lineHeight: 1.5,
            color: theme.textMuted,
            maxWidth: 960,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  )
}
