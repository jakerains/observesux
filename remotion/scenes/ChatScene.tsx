import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { fontFamilies } from '../fonts'
import { SceneShell } from '../components/SceneShell'
import { resolveAsset } from '../utils'
import type { PromoVideoProps } from '../types'

type BubbleProps = {
  align: 'left' | 'right'
  label: string
  text: string
  accent: string
  background: string
  textColor: string
  offset: number
  frame: number
  fps: number
  maxWidth: number
}

const Bubble = ({ align, label, text, accent, background, textColor, offset, frame, fps, maxWidth }: BubbleProps) => {
  const entrance = spring({
    frame: frame - offset,
    fps,
    config: { damping: 200 },
  })
  const translateY = interpolate(entrance, [0, 1], [24, 0])
  const opacity = interpolate(frame - offset, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
        maxWidth,
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: fontFamilies.body,
          fontSize: 14,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          padding: '18px 22px',
          borderRadius: 22,
          background,
          color: textColor,
          fontFamily: fontFamilies.body,
          fontSize: 20,
          lineHeight: 1.5,
          boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

const TypingBubble = ({ frame, accent }: { frame: number; accent: string }) => {
  const dots = new Array(3).fill(0)

  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: 22,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        width: 120,
      }}
    >
      {dots.map((_, index) => {
        const phase = frame / 6 + index * 0.8
        const lift = Math.sin(phase) * 6
        const opacity = interpolate(Math.sin(phase), [-1, 1], [0.3, 1])
        return (
          <div
            key={`dot-${index}`}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: accent,
              transform: `translateY(${lift}px)`,
              opacity,
            }}
          />
        )
      })}
    </div>
  )
}

export const ChatScene = ({ copy, theme }: PromoVideoProps) => {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const isVertical = height > width
  const entrance = spring({
    frame,
    fps,
    config: { damping: 160 },
  })
  const panelOffset = interpolate(entrance, [0, 1], [80, 0])
  const panelTilt = interpolate(entrance, [0, 1], [-10, -4])
  const float = Math.sin(frame / 14) * (isVertical ? 2 : 4)
  const logoSrc = resolveAsset(copy.logoSrc)
  const typingOpacity = interpolate(
    frame,
    isVertical ? [18, 32, 58, 74] : [20, 36, 70, 86],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )
  const responseStart = isVertical ? 48 : 55
  const responseEnd = isVertical ? 102 : 120
  const panel2Start = isVertical ? 110 : 0
  const panel2Entrance = spring({
    frame: frame - panel2Start,
    fps,
    config: { damping: 200 },
  })
  const panel2Offset = interpolate(panel2Entrance, [0, 1], [26, 0])
  const panel2Opacity = interpolate(frame - panel2Start, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const bubbleWidth = isVertical ? 760 : 520
  const panelScale = isVertical ? 1.08 : 1
  const panelPadding = isVertical ? '36px 34px 38px' : '28px 28px 30px'
  const panelMaxWidth = isVertical ? 920 : undefined

  const responseText = 'Light rain after 4pm - grab a compact umbrella and keep the jacket handy.'
  const responseProgress = interpolate(frame, [responseStart, responseEnd], [0, responseText.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const responseSlice = responseText.slice(0, Math.floor(responseProgress))

  const primaryPanel = (
    <div
      style={{
        position: 'relative',
        transform: isVertical
          ? `translateY(${panelOffset + float}px) rotate(${panelTilt * 0.4}deg) scale(${panelScale})`
          : `perspective(1200px) translateY(${panelOffset + float}px) rotateZ(${panelTilt}deg) rotateY(-6deg)`,
        maxWidth: panelMaxWidth,
        margin: isVertical ? '0 auto' : undefined,
        width: isVertical ? '100%' : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -30,
          borderRadius: 36,
          border: '1px solid rgba(255,255,255,0.08)',
          transform: 'rotate(6deg)',
          background: 'rgba(20, 20, 26, 0.55)',
        }}
      />
      <div
        style={{
          position: 'relative',
          borderRadius: 36,
          padding: panelPadding,
          background: 'rgba(24, 24, 30, 0.94)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 70px rgba(4, 8, 20, 0.45)',
          transform: 'rotate(-2deg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: isVertical ? 76 : 68,
              height: isVertical ? 76 : 68,
              borderRadius: 22,
              background: theme.backgroundAlt,
              border: `2px solid ${theme.accent}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {logoSrc ? (
              <Img
                src={logoSrc}
                style={{ width: isVertical ? 56 : 48, height: isVertical ? 56 : 48, objectFit: 'contain' }}
              />
            ) : null}
          </div>
          <div>
            <div
              style={{
                fontFamily: fontFamilies.display,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              SUX Chat
            </div>
            <div
              style={{
                fontFamily: fontFamilies.body,
                fontSize: 16,
                color: theme.textMuted,
              }}
            >
              Live Siouxland answers
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            transform: 'rotate(2deg)',
          }}
        >
          <Bubble
            align="right"
            label="You"
            text="Do I need an umbrella today?"
            accent={theme.highlight}
            background="rgba(255,255,255,0.08)"
            textColor={theme.textPrimary}
            offset={10}
            frame={frame}
            fps={fps}
            maxWidth={bubbleWidth}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              opacity: typingOpacity,
            }}
          >
            <div
              style={{
                fontFamily: fontFamilies.body,
                fontSize: 14,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: theme.textMuted,
              }}
            >
              SUX is typing...
            </div>
            <TypingBubble frame={frame - 30} accent={theme.accent} />
          </div>
          <Bubble
            align="left"
            label="SUX"
            text={responseSlice}
            accent={theme.accent}
            background={theme.accentSoft}
            textColor={theme.textPrimary}
            offset={50}
            frame={frame}
            fps={fps}
            maxWidth={bubbleWidth}
          />
        </div>
      </div>
    </div>
  )

  const secondaryPanel = isVertical ? (
    <div
      style={{
        position: 'relative',
        margin: '0 auto',
        maxWidth: 880,
        width: '100%',
        opacity: panel2Opacity,
        transform: `translateY(${panel2Offset}px) scale(0.98)`,
      }}
    >
      <div
        style={{
          borderRadius: 28,
          padding: '24px 26px',
          background: theme.backgroundAlt,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.28)',
        }}
      >
        <div
          style={{
            fontFamily: fontFamilies.body,
            fontSize: 14,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: theme.textMuted,
            marginBottom: 12,
          }}
        >
          Another example
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.06)',
              fontFamily: fontFamilies.body,
              fontSize: 18,
              color: theme.textPrimary,
            }}
          >
            Are the roads slick near downtown?
          </div>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 18,
              background: theme.accentSoft,
              fontFamily: fontFamilies.body,
              fontSize: 18,
              color: theme.textPrimary,
            }}
          >
            Temperatures are above freezing. Main routes look clear with light traffic.
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <SceneShell theme={theme}>
      <AbsoluteFill
        style={{
          padding: isVertical ? '120px 90px' : '110px 140px',
          display: isVertical ? 'flex' : 'grid',
          flexDirection: isVertical ? 'column' : undefined,
          gridTemplateColumns: isVertical ? undefined : '1fr 1.1fr',
          gap: isVertical ? 40 : 60,
          alignItems: isVertical ? 'stretch' : 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: fontFamilies.body,
              fontSize: 18,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: theme.textMuted,
              marginBottom: 18,
            }}
          >
            Live Chat
          </div>
          <div
            style={{
              fontFamily: fontFamilies.display,
              fontSize: isVertical ? 72 : 88,
              fontWeight: 700,
              lineHeight: 1.08,
              marginBottom: 20,
            }}
          >
            {copy.streamTitle}
          </div>
          <div
            style={{
              fontFamily: fontFamilies.body,
              fontSize: isVertical ? 22 : 26,
              lineHeight: 1.6,
              color: theme.textMuted,
              maxWidth: isVertical ? 640 : 520,
            }}
          >
            {copy.streamSubtitle}
          </div>
        </div>
        {isVertical ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {primaryPanel}
            {secondaryPanel}
          </div>
        ) : (
          primaryPanel
        )}
      </AbsoluteFill>
    </SceneShell>
  )
}
