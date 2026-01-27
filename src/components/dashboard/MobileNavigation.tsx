'use client'

import { useState, useEffect } from 'react'
import {
  Map,
  Cloud,
  Camera,
  FileText
} from 'lucide-react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useChatSheet } from '@/lib/contexts/ChatContext'
import { track } from '@vercel/analytics'

interface NavItem {
  id: string
  icon?: React.ElementType
  customImage?: string
  label: string
  widgetId?: string
  action?: 'chat'
  href?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'weather', icon: Cloud, label: 'Weather', widgetId: 'weather' },
  { id: 'map', icon: Map, label: 'Map', widgetId: 'map' },
  { id: 'chat', customImage: '/sux.png', label: 'SUX', action: 'chat' },
  { id: 'cameras', icon: Camera, label: 'Cameras', widgetId: 'cameras' },
  { id: 'digest', icon: FileText, label: 'Digest', href: '/digest' },
]

export function MobileNavigation() {
  const [activeSection, setActiveSection] = useState('weather')
  const { openChat } = useChatSheet()
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on the digest page
  const isOnDigestPage = pathname === '/digest'

  useEffect(() => {
    // If on digest page, always show digest as active
    if (isOnDigestPage) {
      setActiveSection('digest')
      return
    }

    const handleScroll = () => {
      const scrollableItems = NAV_ITEMS.filter(item => item.widgetId)
      const sections = scrollableItems.map(item => {
        const element = document.querySelector(`[data-widget-id="${item.widgetId}"]`)
        if (element) {
          const rect = element.getBoundingClientRect()
          return { id: item.id, top: rect.top }
        }
        return null
      }).filter(Boolean)

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
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOnDigestPage])

  const handleNavClick = (item: NavItem) => {
    track('mobile_nav_clicked', { item: item.id, label: item.label })
    if (item.action === 'chat') {
      track('chat_opened', { source: 'mobile_nav' })
      openChat()
      return
    }
    if (item.href) {
      // If already on the href page, don't navigate
      if (pathname === item.href) return
      router.push(item.href)
      return
    }
    if (item.widgetId) {
      // If on a different page (like /digest), navigate to home with hash
      if (pathname !== '/') {
        router.push(`/#${item.widgetId}`)
        return
      }
      // On home page, scroll to the widget
      const element = document.querySelector(`[data-widget-id="${item.widgetId}"]`)
      if (element) {
        const headerOffset = 70
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      }
    }
  }

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50",
      "header-glass",
      "pb-safe"
    )}>
      {/* Home indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/10 rounded-full" />

      <div className="flex items-center justify-around px-2 pt-2 pb-4">
        {NAV_ITEMS.map((item) => {
          const { id, icon: Icon, customImage, label, action } = item
          const isActive = action !== 'chat' && activeSection === id

          return (
            <button
              key={id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 p-2 min-w-[60px] rounded-2xl",
                "smooth press-effect",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="p-1">
                {customImage ? (
                  <Image
                    src={customImage}
                    alt={label}
                    width={32}
                    height={32}
                    className="smooth"
                  />
                ) : Icon ? (
                  <Icon
                    className={cn(
                      "h-5 w-5 smooth",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                ) : null}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
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
