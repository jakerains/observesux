import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { SCENE_DURATION, TRANSITION_DURATION } from './constants'
import { DigestIntroScene } from './scenes/DigestIntroScene'
import { DigestFeaturesScene } from './scenes/DigestFeaturesScene'
import { DigestPreviewScene } from './scenes/DigestPreviewScene'
import { DigestCtaScene } from './scenes/DigestCtaScene'
import type { DigestPromoProps } from './types'

export const DigestPromo = (props: DigestPromoProps) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <DigestIntroScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <DigestFeaturesScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <DigestPreviewScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-left' })}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
        <DigestCtaScene {...props} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
