import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Cache the models list for 1 hour in memory
let cachedModels: OpenRouterModel[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

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
    input_modalities: string[]
    output_modalities: string[]
  }
}

export async function GET() {
  try {
    const now = Date.now()

    if (cachedModels && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedModels, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const models: OpenRouterModel[] = (data.data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      context_length: m.context_length,
      pricing: {
        prompt: m.pricing?.prompt || '0',
        completion: m.pricing?.completion || '0',
      },
      architecture: {
        modality: m.architecture?.modality || 'text->text',
        input_modalities: m.architecture?.input_modalities || ['text'],
        output_modalities: m.architecture?.output_modalities || ['text'],
      },
    }))

    // Sort: popular providers first, then alphabetically
    const providerOrder = ['anthropic', 'openai', 'google', 'meta-llama', 'mistralai', 'x-ai', 'deepseek']
    models.sort((a, b) => {
      const aProvider = a.id.split('/')[0]
      const bProvider = b.id.split('/')[0]
      const aIdx = providerOrder.indexOf(aProvider)
      const bIdx = providerOrder.indexOf(bProvider)
      const aOrder = aIdx === -1 ? 999 : aIdx
      const bOrder = bIdx === -1 ? 999 : bIdx
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.name.localeCompare(b.name)
    })

    cachedModels = models
    cacheTimestamp = now

    return NextResponse.json(models, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=3600, max-age=0',
      },
    })
  } catch (error) {
    console.error('[Models API] Error:', error)

    // Return cached data if available even if stale
    if (cachedModels) {
      return NextResponse.json(cachedModels, {
        headers: { 'X-Cache': 'STALE' },
      })
    }

    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}
