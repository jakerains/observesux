import React from 'react'
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import { SectionHeading } from '../components/SectionHeading'
import type { DigestPromoProps } from '../types'

const FeatureIcon = ({ icon, color }: { icon: string; color: string }) => {
  const iconMap: Record<string, React.JSX.Element> = {
    weather: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
    ),
    traffic: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path d="M19 17h2l-2-8H5L3 17h2M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0" />
      </svg>
    ),
    gas: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M7 10h4M21 16V8l-3-3v11" />
        <rect x="3" y="18" width="12" height="4" />
      </svg>
    ),
    alerts: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    air: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2" />
      </svg>
    ),
  }

  return iconMap[icon] || iconMap.weather
}

type FeatureCardProps = {
  icon: string
  title: string
  description: string
  index: number
  accent: string
  muted: string
  compact: boolean
}

const FeatureCard = ({ icon, title, description, index, accent, muted, compact }: FeatureCardProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const delay = index * 8

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  })

  const offset = interpolate(entrance, [0, 1], [40, 0])
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const iconBounce = spring({
    frame: frame - delay - 5,
    fps,
    config: { damping: 8, stiffness: 200 },
  })

  return (
    <div
      style={{
        flex: 1,
        padding: compact ? '24px 20px' : '32px 28px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        transform: `translateY(${offset}px)`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${accent}22 0%, ${accent}44 100%)`,
          display: 'grid',
          placeItems: 'center',
          transform: `scale(${iconBounce})`,
        }}
      >
        <FeatureIcon icon={icon} color={accent} />
      </div>
      <div>
        <div
          style={{
            fontFamily: fontFamilies.display,
            fontSize: compact ? 24 : 28,
            fontWeight: 700,
            marginBottom: 8,
            color: accent,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: fontFamilies.body,
            fontSize: compact ? 16 : 18,
            lineHeight: 1.5,
            color: muted,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

export const DigestFeaturesScene = ({ copy, theme }: DigestPromoProps) => {
  const { width, height } = useVideoConfig()
  const isVertical = height > width

  return (
    <SceneShell theme={theme}>
      <AbsoluteFill
        style={{
          padding: isVertical ? '100px 70px' : '90px 120px',
          gap: isVertical ? 32 : 44,
        }}
      >
        <SectionHeading
          eyebrow="Your Morning Briefing"
          title="Everything you need, one email."
          subtitle="Wake up to a friendly snapshot of what's happening in Siouxland."
          theme={theme}
          compact={isVertical}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isVertical ? '1fr' : 'repeat(3, 1fr)',
            gap: isVertical ? 16 : 24,
            marginTop: isVertical ? 20 : 30,
          }}
        >
          {copy.features.slice(0, 3).map((feature, index) => (
            <Sequence key={feature.title} from={index * 5} layout="none">
              <FeatureCard
                icon={feature.icon}
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
