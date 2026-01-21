import type { PromoTheme } from './theme'

export type PromoCopy = {
  brandName: string
  tagline: string
  introNote: string
  features: Array<{
    title: string
    description: string
  }>
  streamTitle: string
  streamSubtitle: string
  ctaPrimary: string
  ctaSecondary: string
  siteUrl: string
  logoSrc?: string
}

export type PromoVideoProps = {
  copy: PromoCopy
  theme: PromoTheme
}
