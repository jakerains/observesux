'use client'

import { useState, useCallback } from 'react'
import { Share2, Check, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  url: string
  title: string
  text?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'icon'
}

export function ShareButton({ url, title, text, className, variant = 'outline', size = 'sm' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    // Use native share sheet if available (mobile + some desktop)
    if (navigator.share) {
      try {
        await navigator.share({ url, title, text })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Last resort: prompt with the URL
      window.prompt('Copy this link:', url)
    }
  }, [url, title, text])

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-1.5', className)}
      onClick={handleShare}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          Share
        </>
      )}
    </Button>
  )
}
