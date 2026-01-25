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

export type DigestCopy = {
  headline: string
  subheadline: string
  timeLabel: string
  features: Array<{
    icon: string
    title: string
    description: string
  }>
  previewItems: Array<{
    category: string
    value: string
    trend?: 'up' | 'down' | 'neutral'
  }>
  ctaPrimary: string
  ctaSecondary: string
  siteUrl: string
}

export type DigestPromoProps = {
  copy: DigestCopy
  theme: PromoTheme
}
