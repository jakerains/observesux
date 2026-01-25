import { Composition, Folder } from 'remotion'
import { Promo } from './Promo'
import { DigestPromo } from './DigestPromo'
import { FPS, TOTAL_DURATION, VERTICAL_HEIGHT, VERTICAL_WIDTH, VIDEO_HEIGHT, VIDEO_WIDTH } from './constants'
import { defaultTheme } from './theme'
import type { PromoVideoProps, DigestPromoProps } from './types'

const defaultProps = {
  copy: {
    brandName: 'SUX',
    tagline: 'Your playful Siouxland chat agent for instant local answers.',
    introNote: 'Chat with SUX',
    features: [
      {
        title: 'Ask Anything Local',
        description: 'Weather, traffic, events, or city services - just type it.',
      },
      {
        title: 'Live, Not Laggy',
        description: 'Fresh data for forecasts, air quality, river levels, and more.',
      },
      {
        title: 'SUX Stays On-Topic',
        description: 'Friendly guardrails keep the chat focused on Siouxland.',
      },
    ],
    streamTitle: 'Chat. Tap. Smile. Done.',
    streamSubtitle: 'Ask SUX a quick question and get a local answer in seconds.',
    ctaPrimary: 'Start a SUX chat.',
    ctaSecondary: 'Open Siouxland.online and tap SUX for instant local help.',
    siteUrl: 'Siouxland.online',
    logoSrc: 'sux.png',
  },
  theme: defaultTheme,
} satisfies PromoVideoProps

const digestProps = {
  copy: {
    headline: 'Siouxland Digest',
    subheadline: 'Your friendly morning snapshot of everything happening in Siouxland.',
    timeLabel: '6:15 AM Daily',
    features: [
      {
        icon: 'weather',
        title: 'Weather Forecast',
        description: "Today's conditions, highs, lows, and what to expect this week.",
      },
      {
        icon: 'gas',
        title: 'Gas Prices',
        description: 'Current prices and best deals at stations near you.',
      },
      {
        icon: 'alerts',
        title: 'Active Alerts',
        description: 'Weather warnings, road closures, and community notices.',
      },
    ],
    previewItems: [
      { category: 'Temperature', value: '72°F', trend: 'up' },
      { category: 'Air Quality', value: 'Good', trend: 'neutral' },
      { category: 'Gas Average', value: '$2.89', trend: 'down' },
      { category: 'River Level', value: '18.2 ft', trend: 'neutral' },
    ],
    ctaPrimary: 'Never miss a morning.',
    ctaSecondary: 'Get Siouxland essentials delivered to your inbox every day at 6:15 AM.',
    siteUrl: 'Siouxland.online',
  },
  theme: defaultTheme,
} satisfies DigestPromoProps

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="Marketing">
        <Composition
          id="SiouxlandOnlinePromo"
          component={Promo}
          durationInFrames={TOTAL_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          defaultProps={defaultProps}
        />
        <Composition
          id="SUXPromoVertical"
          component={Promo}
          durationInFrames={TOTAL_DURATION}
          fps={FPS}
          width={VERTICAL_WIDTH}
          height={VERTICAL_HEIGHT}
          defaultProps={defaultProps}
        />
      </Folder>
      <Folder name="Digest">
        <Composition
          id="DigestPromo"
          component={DigestPromo}
          durationInFrames={TOTAL_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          defaultProps={digestProps}
        />
        <Composition
          id="DigestPromoVertical"
          component={DigestPromo}
          durationInFrames={TOTAL_DURATION}
          fps={FPS}
          width={VERTICAL_WIDTH}
          height={VERTICAL_HEIGHT}
          defaultProps={digestProps}
        />
      </Folder>
    </>
  )
}
