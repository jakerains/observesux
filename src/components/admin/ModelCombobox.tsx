'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface OpenRouterModel {
  id: string
  name: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
  architecture: {
    modality: string
  }
}

interface ModelComboboxProps {
  value: string
  onChange: (modelId: string) => void
  className?: string
  size?: 'sm' | 'default'
}

// Popular models to show when no search query
const FEATURED_IDS = new Set([
  'anthropic/claude-sonnet-4.6',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-opus-4.6',
  'openai/gpt-5.4',
  'openai/gpt-5.4-mini',
  'openai/gpt-5.4-nano',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'x-ai/grok-4',
  'x-ai/grok-4-mini',
  'deepseek/deepseek-r1',
  'deepseek/deepseek-chat',
  'meta-llama/llama-4-scout',
  'meta-llama/llama-4-maverick',
  'mistralai/mistral-large',
  'mistralai/mistral-small-2603',
])

function formatPrice(pricePerToken: string): string {
  const price = parseFloat(pricePerToken) * 1_000_000
  if (price === 0) return 'Free'
  if (price < 0.01) return '<$0.01/M'
  if (price < 1) return `$${price.toFixed(2)}/M`
  return `$${price.toFixed(1)}/M`
}

function formatContext(ctx: number): string {
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M`
  if (ctx >= 1000) return `${Math.round(ctx / 1000)}k`
  return `${ctx}`
}

function getProvider(modelId: string): string {
  return modelId.split('/')[0] || 'unknown'
}

// Shared cache across component instances
let modelCache: OpenRouterModel[] | null = null
let fetchPromise: Promise<OpenRouterModel[]> | null = null

async function fetchModels(): Promise<OpenRouterModel[]> {
  if (modelCache) return modelCache
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/admin/models')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch models')
      return res.json()
    })
    .then((models: OpenRouterModel[]) => {
      modelCache = models
      fetchPromise = null
      return models
    })
    .catch((err) => {
      fetchPromise = null
      throw err
    })

  return fetchPromise
}

export function ModelCombobox({ value, onChange, className, size = 'default' }: ModelComboboxProps) {
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchModels()
      .then(setModels)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const selectedModel = useMemo(
    () => models.find((m) => m.id === value),
    [models, value]
  )

  // When no search: show featured models only.
  // When searching: filter all 348 models, cap at 30 results.
  const displayModels = useMemo(() => {
    if (!search.trim()) {
      return models.filter((m) => FEATURED_IDS.has(m.id))
    }
    const q = search.toLowerCase()
    return models
      .filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [models, search])

  // Group by provider
  const groupedModels = useMemo(() => {
    const groups: Record<string, OpenRouterModel[]> = {}
    for (const model of displayModels) {
      const provider = getProvider(model.id)
      if (!groups[provider]) groups[provider] = []
      groups[provider].push(model)
    }
    return groups
  }, [displayModels])

  const isSmall = size === 'sm'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between font-normal',
            isSmall ? 'h-8 text-xs px-2' : 'h-9 text-sm px-3',
            className
          )}
        >
          <span className="truncate">
            {selectedModel ? selectedModel.name : value || 'Select model...'}
          </span>
          <ChevronsUpDown className={cn('ml-2 shrink-0 opacity-50', isSmall ? 'h-3 w-3' : 'h-4 w-4')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search all 348 models..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading models...
              </div>
            )}
            {!loading && displayModels.length === 0 && (
              <CommandEmpty>No models found.</CommandEmpty>
            )}
            {!search.trim() && !loading && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                Popular models — type to search all
              </div>
            )}
            {search.trim() && displayModels.length === 30 && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                Showing first 30 results — refine your search
              </div>
            )}
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <CommandGroup key={provider} heading={provider}>
                {providerModels.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => {
                      onChange(model.id)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 mr-2',
                        value === model.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{model.name}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="truncate">{model.id}</span>
                        <span>·</span>
                        <span className="shrink-0">{formatContext(model.context_length)} ctx</span>
                        <span>·</span>
                        <span className="shrink-0">{formatPrice(model.pricing.prompt)} in</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
