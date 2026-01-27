'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Lightbulb, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUGGESTION_CATEGORIES, type SuggestionCategory } from '@/types'
import { track } from '@vercel/analytics'

interface SuggestionModalProps {
  trigger?: React.ReactNode
}

export function SuggestionModal({ trigger }: SuggestionModalProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<SuggestionCategory>('feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setCategory('feature')
    setTitle('')
    setDescription('')
    setEmail('')
    setError('')
    setSuccess(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setTimeout(resetForm, 300)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate
    if (!title.trim()) {
      setError('Please enter a title')
      setLoading(false)
      return
    }
    if (!description.trim()) {
      setError('Please enter a description')
      setLoading(false)
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          email: email.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit suggestion')
      }

      setSuccess(true)
      track('suggestion_submitted', { category })
      // Close after showing success message
      setTimeout(() => {
        setOpen(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit suggestion')
    } finally {
      setLoading(false)
    }
  }

  const categoryInfo = SUGGESTION_CATEGORIES.find(c => c.value === category)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Lightbulb className="h-5 w-5" />
            <span className="sr-only">Submit suggestion</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Submit a Suggestion
          </DialogTitle>
          <DialogDescription>
            Have an idea for a new feature, found a bug, or want to request content? Let us know!
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-medium text-lg">Thank you!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your suggestion has been submitted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors text-left",
                      category === cat.value ? "border-primary" : "border-muted"
                    )}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={`Brief ${categoryInfo?.label.toLowerCase()} title...`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/200
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground text-xs">(optional, for follow-up)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Submit button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Suggestion'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
