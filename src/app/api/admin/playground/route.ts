import { streamText, stepCountIs, convertToModelMessages } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { chatTools } from '@/lib/ai/tools'
import { getSystemPrompt } from '@/lib/ai/system-prompt'
import { isAdminWithUser } from '@/lib/auth/server'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const { messages: incomingMessages, model: modelId } = body

    if (!Array.isArray(incomingMessages) || !modelId) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages and model required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Normalize messages (same pattern as chat route)
    const normalizedMessages = incomingMessages.map((message) => {
      if (!message || typeof message !== 'object') return message
      if (Array.isArray(message.parts)) return message
      if (typeof message.content === 'string') {
        return { ...message, parts: [{ type: 'text', text: message.content }] }
      }
      if (Array.isArray(message.content)) {
        return { ...message, parts: message.content }
      }
      return { ...message, parts: [] }
    })

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    console.log(`[Playground] Using model: ${modelId}`)

    const modelMessages = await convertToModelMessages(normalizedMessages)

    const result = streamText({
      model: openrouter(modelId),
      system: getSystemPrompt(),
      messages: modelMessages,
      tools: chatTools,
      stopWhen: stepCountIs(5),
      onError: (error) => {
        console.error('[Playground] Stream error:', error)
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[Playground] API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
