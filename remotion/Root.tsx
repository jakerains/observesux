import { Composition, Folder } from 'remotion'
import { Promo } from './Promo'
import { FPS, TOTAL_DURATION, VERTICAL_HEIGHT, VERTICAL_WIDTH, VIDEO_HEIGHT, VIDEO_WIDTH } from './constants'
import { defaultTheme } from './theme'
import type { PromoVideoProps } from './types'

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

export const RemotionRoot = () => {
  return (
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
  )
}
