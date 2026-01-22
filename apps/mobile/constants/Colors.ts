/**
 * ObserveSUX color constants for light and dark themes
 */

export const Colors = {
  light: {
    text: '#11181C',
    textMuted: '#687076',
    background: '#FFFFFF',
    card: '#F4F4F5',
    cardForeground: '#11181C',
    tint: '#0ea5e9',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0ea5e9',
    border: '#E4E4E7',
    destructive: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  dark: {
    text: '#FAFAFA',
    textMuted: '#A3A3A3',
    background: '#0A0A0A',
    card: '#171717',
    cardForeground: '#FAFAFA',
    tint: '#0ea5e9',
    icon: '#A3A3A3',
    tabIconDefault: '#A3A3A3',
    tabIconSelected: '#0ea5e9',
    border: '#262626',
    destructive: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
};

// Status indicator colors
export const StatusColors = {
  live: '#22c55e',
  stale: '#f59e0b',
  error: '#ef4444',
  loading: '#a3a3a3',
};

// Flood stage colors
export const FloodStageColors = {
  normal: '#22c55e',
  action: '#eab308',
  minor: '#f59e0b',
  moderate: '#ef4444',
  major: '#dc2626',
};

// AQI colors
export const AQIColors = {
  Good: '#00e400',
  Moderate: '#ffff00',
  'Unhealthy for Sensitive Groups': '#ff7e00',
  Unhealthy: '#ff0000',
  'Very Unhealthy': '#8f3f97',
  Hazardous: '#7e0023',
};

// Alert severity colors
export const AlertSeverityColors = {
  Extreme: '#dc2626',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
};
