'use client'

import { useState, useEffect } from 'react'
import {
  Map,
  Cloud,
  Camera,
  MessageSquare,
  Newspaper
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatSheet } from '@/lib/contexts/ChatContext'

interface NavItem {
  id: string
  icon: React.ElementType
  label: string
  widgetId?: string // Optional - chat doesn't scroll to a widget
  action?: 'chat' // Special action type
}

const NAV_ITEMS: NavItem[] = [
  { id: 'map', icon: Map, label: 'Map', widgetId: 'map' },
  { id: 'weather', icon: Cloud, label: 'Weather', widgetId: 'weather' },
  { id: 'chat', icon: MessageSquare, label: 'Chat', action: 'chat' },
  { id: 'cameras', icon: Camera, label: 'Cameras', widgetId: 'cameras' },
  { id: 'news', icon: Newspaper, label: 'News', widgetId: 'news' },
]

// Feature flag - only show chat if enabled
const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true'

export function MobileNavigation() {
  const [activeSection, setActiveSection] = useState('map')
  const { openChat } = useChatSheet()

  // Filter nav items based on feature flags
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.action === 'chat' && !CHAT_ENABLED) return false
    return true
  })

  // Detect which section is currently visible (only for scroll-based items)
  useEffect(() => {
    const handleScroll = () => {
      const scrollableItems = visibleNavItems.filter(item => item.widgetId)
      const sections = scrollableItems.map(item => {
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
  }, [visibleNavItems])

  const handleNavClick = (item: NavItem) => {
    if (item.action === 'chat') {
      openChat()
      return
    }
    if (item.widgetId) {
      scrollToSection(item.widgetId)
    }
  }

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
        {visibleNavItems.map((item) => {
          const { id, icon: Icon, label, action } = item
          // Chat button is never "active" in the scroll sense
          const isActive = action !== 'chat' && activeSection === id

          return (
            <button
              key={id}
              onClick={() => handleNavClick(item)}
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
