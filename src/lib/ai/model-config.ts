import { getSetting } from '@/lib/db/app-settings'

export type ModelContext = 'chat' | 'admin-chat' | 'digest' | 'council'

export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.6'

export const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'openai/gpt-5.4-mini', label: 'GPT-5.4 Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-5.4', label: 'GPT-5.4', provider: 'OpenAI' },
] as const

export const MODEL_CONTEXTS: { id: ModelContext; label: string; description: string }[] = [
  { id: 'chat', label: 'SUX Chat', description: 'Public-facing chat assistant' },
  { id: 'digest', label: 'Digest Generation', description: 'Daily digest writing' },
  { id: 'council', label: 'Council Recaps', description: 'Meeting recap generation' },
]

// In-memory cache to avoid a DB round-trip on every chat request.
// Model settings change rarely (only on admin save), so a 60s TTL is fine.
const _cache: Record<string, { value: string; ts: number }> = {}
const CACHE_TTL_MS = 60_000

/**
 * Get the active model for a given context.
 * Reads from the app_settings table with 60s in-memory cache.
 * Falls back to DEFAULT_MODEL on miss or error.
 */
export async function getActiveModel(context: ModelContext): Promise<string> {
  const cached = _cache[context]
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.value
  }

  try {
    const model = await getSetting<string>(`model:${context}`)
    if (model && typeof model === 'string' && model.trim().length > 0) {
      _cache[context] = { value: model, ts: Date.now() }
      return model
    }
  } catch (error) {
    console.warn(`[ModelConfig] Failed to read model for "${context}", using default:`, error)
  }

  _cache[context] = { value: DEFAULT_MODEL, ts: Date.now() }
  return DEFAULT_MODEL
}
