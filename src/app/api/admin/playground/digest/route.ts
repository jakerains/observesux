import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { isAdminWithUser } from '@/lib/auth/server'
import { aggregateAllData } from '@/lib/digest/fetcher-steps'
import { getDigestSystemPrompt, buildDigestPrompt } from '@/lib/digest/system-prompt'
import type { DigestEdition } from '@/lib/digest/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const { isAdmin } = await isAdminWithUser()
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { model: modelId, edition = 'morning' } = body as { model: string; edition?: DigestEdition }

    if (!modelId) {
      return new Response(JSON.stringify({ error: 'model required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    console.log(`[Playground/Digest] Aggregating data for ${edition} edition...`)
    const digestData = await aggregateAllData(edition)

    const systemPrompt = getDigestSystemPrompt(edition)
    const userPrompt = buildDigestPrompt(digestData, edition)

    console.log(`[Playground/Digest] Generating with model: ${modelId}`)

    const result = streamText({
      model: openrouter(modelId),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 4000,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[Playground/Digest] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
