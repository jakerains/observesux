/**
 * Siouxland Online brand color palette
 * Matches the web app's dark brown / amber theme (converted from OKLCH)
 */

export const Brand = {
  /** Deep brown — main screen background */
  background: '#120905',
  /** Medium brown — card / widget background */
  card: '#1f130c',
  /** Slightly lighter brown — secondary surfaces, stat items */
  secondary: '#2b1f16',
  /** Warm dark brown — tab bar / sidebar */
  tabBar: '#170d08',
  /** Amber — primary accent, replaces systemBlue for icons and highlights */
  amber: '#e69c3a',
  /** Muted warm gray — tertiary labels and muted text */
  muted: '#8b7e6d',
  /** Warm off-white — foreground / primary text */
  foreground: '#ece3d6',
  /** Dark amber — accent surfaces, pressed states */
  accent: '#3d2919',
  /** Separator line color */
  separator: 'rgba(255,255,255,0.08)',
} as const;
