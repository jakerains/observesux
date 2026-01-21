import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import { SectionHeading } from '../components/SectionHeading'
import type { PromoVideoProps } from '../types'

type FeatureCardProps = {
  title: string
  description: string
  index: number
  accent: string
  muted: string
  compact: boolean
}

const FeatureCard = ({ title, description, index, accent, muted, compact }: FeatureCardProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const delay = index * 6
  const rotation = index % 2 === 0 ? -2 : 2
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  })
  const offset = interpolate(entrance, [0, 1], [28, 0])
  const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        flex: 1,
        padding: compact ? '22px 24px' : '28px 30px',
        borderRadius: 28,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        transform: `translateY(${offset}px) rotate(${compact ? 0 : rotation}deg)`,
        opacity,
        minHeight: compact ? 180 : 220,
      }}
    >
      <div
        style={{
          fontFamily: fontFamilies.display,
          fontSize: compact ? 28 : 34,
          fontWeight: 700,
          marginBottom: 16,
          color: accent,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: fontFamilies.body,
          fontSize: compact ? 18 : 20,
          lineHeight: 1.5,
          color: muted,
        }}
      >
        {description}
      </div>
    </div>
  )
}

export const FeaturesScene = ({ copy, theme }: PromoVideoProps) => {
  const { fps, width, height } = useVideoConfig()
  const isVertical = height > width

  return (
    <SceneShell theme={theme}>
      <AbsoluteFill
        style={{
          padding: isVertical ? '120px 90px' : '110px 140px',
          gap: isVertical ? 40 : 52,
        }}
      >
        <SectionHeading
          eyebrow="Playful & Local"
          title="SUX keeps Siouxland at your fingertips."
          subtitle="Fast replies, friendly vibes, and the local data you actually need."
          theme={theme}
          compact={isVertical}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            gap: 24,
          }}
        >
          {copy.features.map((feature, index) => (
            <Sequence key={feature.title} from={index * 3} layout="none">
              <FeatureCard
                title={feature.title}
                description={feature.description}
                index={index}
                accent={theme.accent}
                muted={theme.textMuted}
                compact={isVertical}
              />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>
    </SceneShell>
  )
}
