import { staticFile } from 'remotion'

export const resolveAsset = (src?: string | null) => {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return staticFile(src)
}
