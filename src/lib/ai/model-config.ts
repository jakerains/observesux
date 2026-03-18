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
  { id: 'admin-chat', label: 'Admin Chat', description: 'Admin assistant with tools' },
  { id: 'digest', label: 'Digest Generation', description: 'Daily digest writing' },
  { id: 'council', label: 'Council Recaps', description: 'Meeting recap generation' },
]

/**
 * Get the active model for a given context.
 * Reads from the app_settings table, falls back to DEFAULT_MODEL.
 */
export async function getActiveModel(context: ModelContext): Promise<string> {
  try {
    const model = await getSetting<string>(`model:${context}`)
    if (model && typeof model === 'string' && model.trim().length > 0) {
      return model
    }
  } catch (error) {
    console.warn(`[ModelConfig] Failed to read model for "${context}", using default:`, error)
  }
  return DEFAULT_MODEL
}
