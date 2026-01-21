import { loadFont as loadDisplay } from '@remotion/google-fonts/SpaceGrotesk'
import { loadFont as loadBody } from '@remotion/google-fonts/Manrope'

const display = loadDisplay('normal', {
  weights: ['500', '700'],
  subsets: ['latin'],
})

const body = loadBody('normal', {
  weights: ['400', '600', '700'],
  subsets: ['latin'],
})

export const fontFamilies = {
  display: display.fontFamily,
  body: body.fontFamily,
}
