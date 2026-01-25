'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { getCurrentEdition, editionLabels, type Digest, type DigestEdition } from '@/lib/digest/types'

interface DigestGeneratorProps {
  onDigestGenerated: (digest: Digest) => void
  edition?: DigestEdition | 'auto'
  disabled?: boolean
}

export function DigestGenerator({
  onDigestGenerated,
  edition = 'auto',
  disabled
}: DigestGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Resolve 'auto' to actual edition
  const resolvedEdition = edition === 'auto' ? getCurrentEdition() : edition

  const generateDigest = async () => {
    setStatus('loading')
    setError(null)

    try {
      const response = await fetch('/api/user/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edition: resolvedEdition })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate digest')
      }

      const data = await response.json()

      if (data.success && data.digest) {
        onDigestGenerated(data.digest)
        setStatus('idle')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setStatus('error')
    }
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Generation Failed</span>
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={generateDigest}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={generateDigest}
      disabled={disabled || status === 'loading'}
      size="lg"
      className="gap-2 w-full sm:w-auto"
    >
      {status === 'loading' ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating {editionLabels[resolvedEdition]}...
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5" />
          Generate {editionLabels[resolvedEdition]}
        </>
      )}
    </Button>
  )
}
