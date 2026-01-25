/**
 * Siouxland Online color system
 * Matching the web app's OKLCH-based design
 */

export const Colors = {
  light: {
    // Core
    text: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    card: '#ffffff',
    cardBorder: '#e2e8f0',

    // Brand
    primary: '#0f172a',
    primaryForeground: '#ffffff',

    // Accent
    accent: '#3b82f6',
    accentForeground: '#ffffff',

    // Status
    success: '#22c55e',
    successBackground: '#dcfce7',
    warning: '#f59e0b',
    warningBackground: '#fef3c7',
    error: '#ef4444',
    errorBackground: '#fee2e2',
    info: '#3b82f6',
    infoBackground: '#dbeafe',

    // UI
    tint: '#0f172a',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#0f172a',
    separator: '#e2e8f0',

    // Live/Stale indicators
    live: '#22c55e',
    stale: '#f59e0b',
    offline: '#ef4444',
  },
  dark: {
    // Core
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    card: '#1e293b',
    cardBorder: '#334155',

    // Brand
    primary: '#f8fafc',
    primaryForeground: '#0f172a',

    // Accent
    accent: '#60a5fa',
    accentForeground: '#0f172a',

    // Status
    success: '#4ade80',
    successBackground: '#14532d',
    warning: '#fbbf24',
    warningBackground: '#78350f',
    error: '#f87171',
    errorBackground: '#7f1d1d',
    info: '#60a5fa',
    infoBackground: '#1e3a5f',

    // UI
    tint: '#f8fafc',
    tabIconDefault: '#64748b',
    tabIconSelected: '#f8fafc',
    separator: '#334155',

    // Live/Stale indicators
    live: '#4ade80',
    stale: '#fbbf24',
    offline: '#f87171',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
