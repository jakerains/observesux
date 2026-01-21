import { AbsoluteFill } from 'remotion'
import type { ReactNode } from 'react'
import type { PromoTheme } from '../theme'

type SceneShellProps = {
  theme: PromoTheme
  children: ReactNode
}

export const SceneShell = ({ theme, children }: SceneShellProps) => {
  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        color: theme.textPrimary,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  )
}
