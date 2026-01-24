'use client'

import { useState, useEffect } from 'react'
import { X, Bell, Zap, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    setIsIOS(iOS)

    // Check if user previously dismissed the prompt
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true)
        return
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null)
      setShowPrompt(false)
    })

    // Fallback: Show prompt after delay
    const fallbackTimer = setTimeout(() => {
      if (!standalone) {
        setShowPrompt(true)
      }
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isStandalone || dismissed || !showPrompt) return null

  const features = [
    { icon: Bell, text: 'Real-time alerts' },
    { icon: Zap, text: 'Instant access' },
    { icon: Wifi, text: 'Works offline' },
  ]

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        <div className="relative p-5">
          {/* Logo and Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl shadow-lg ring-1 ring-slate-200 p-0.5 bg-white">
              <img
                src="/siouxlandonlineicon_black.png"
                alt="Siouxland Online"
                width={56}
                height={56}
                className="rounded-[10px] w-14 h-14 object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Siouxland Online</h3>
              <p className="text-sm text-slate-500">Install the app</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex gap-4 mb-5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-slate-100">
                  <Icon className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <span className="text-xs text-slate-600">{text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 text-center">
                Tap <span className="text-slate-900 font-medium">Share</span> then{' '}
                <span className="text-slate-900 font-medium">&quot;Add to Home Screen&quot;</span>
              </p>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                Got it
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-lg border-0"
              >
                Install Now
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                Later
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 text-center">
                Click the <span className="text-slate-900 font-medium">install icon</span> in your address bar
              </p>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                Got it
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
