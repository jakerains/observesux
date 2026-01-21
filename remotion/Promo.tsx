import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import type { PromoVideoProps } from './types'
import { SCENE_DURATION, TRANSITION_DURATION } from './constants'
import { IntroScene } from './scenes/IntroScene'
import { FeaturesScene } from './scenes/FeaturesScene'
import { ChatScene } from './scenes/ChatScene'
import { CtaScene } from './scenes/CtaScene'

export const Promo = (props: PromoVideoProps) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <IntroScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <FeaturesScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <ChatScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-left' })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <CtaScene {...props} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
