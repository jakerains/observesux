'use client'

import { useLayoutEffect } from 'react'

export function ForceDarkMode() {
  useLayoutEffect(() => {
    const root = document.documentElement

    const applyDark = () => {
      root.classList.add('dark')
      root.classList.remove('light')
      root.style.colorScheme = 'dark'
    }

    applyDark()

    const observer = new MutationObserver(() => {
      if (!root.classList.contains('dark') || root.classList.contains('light')) {
        applyDark()
      }
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] })

    return () => observer.disconnect()
  }, [])

  return null
}
