'use client'

import { useState, useEffect } from 'react'
import {
  Map,
  Cloud,
  Camera,
  Radio,
  Newspaper
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  icon: React.ElementType
  label: string
  widgetId: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'map', icon: Map, label: 'Map', widgetId: 'map' },
  { id: 'weather', icon: Cloud, label: 'Weather', widgetId: 'weather' },
  { id: 'cameras', icon: Camera, label: 'Cameras', widgetId: 'cameras' },
  { id: 'scanner', icon: Radio, label: 'Scanner', widgetId: 'scanner' },
  { id: 'news', icon: Newspaper, label: 'News', widgetId: 'news' },
]

export function MobileNavigation() {
  const [activeSection, setActiveSection] = useState('map')

  // Detect which section is currently visible
  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map(item => {
        const element = document.querySelector(`[data-widget-id="${item.widgetId}"]`)
        if (element) {
          const rect = element.getBoundingClientRect()
          return { id: item.id, top: rect.top }
        }
        return null
      }).filter(Boolean)

      // Find the section closest to the top of the viewport
      const visible = sections.reduce((closest, section) => {
        if (!section) return closest
        if (!closest) return section
        const closestDistance = Math.abs(closest.top - 100)
        const sectionDistance = Math.abs(section.top - 100)
        return sectionDistance < closestDistance ? section : closest
      }, null as { id: string; top: number } | null)

      if (visible) {
        setActiveSection(visible.id)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (widgetId: string) => {
    const element = document.querySelector(`[data-widget-id="${widgetId}"]`)
    if (element) {
      const headerOffset = 70 // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <nav
      className={cn(
        // Only show on mobile (hidden on md and up)
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        // iOS-style glass effect
        "bg-background/80 backdrop-blur-xl border-t border-border/50",
        // Safe area padding for notched devices
        "pb-safe"
      )}
    >
      {/* Home indicator bar (iOS style) */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/20 rounded-full" />

      <div className="flex items-center justify-around px-2 pt-2 pb-4">
        {NAV_ITEMS.map(({ id, icon: Icon, label, widgetId }) => {
          const isActive = activeSection === id

          return (
            <button
              key={id}
              onClick={() => scrollToSection(widgetId)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 p-2 min-w-[60px] rounded-xl transition-all",
                "active:scale-95 active:bg-accent/50",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
