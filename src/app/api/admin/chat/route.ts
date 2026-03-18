import { streamText, stepCountIs, convertToModelMessages, safeValidateUIMessages, pruneMessages } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { adminChatTools } from '@/lib/ai/admin-tools'
import { getAdminSystemPrompt, type CanvasContent } from '@/lib/ai/admin-system-prompt'
import { isAdminWithUser, getCurrentUser } from '@/lib/auth/server'
import { getUserProfile } from '@/lib/db/profiles'
import type { UserContext } from '@/lib/ai/system-prompt'
import { getActiveModel } from '@/lib/ai/model-config'

export const runtime = 'nodejs'
export const maxDuration = 60

// Extract text content from various AI SDK message formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessageContent(message: any): string {
  if (typeof message.content === 'string') return message.content
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter((p: { type?: string }) => p.type === 'text')
      .map((p: { text?: string }) => p.text || '')
      .filter(Boolean)
    if (textParts.length > 0) return textParts.join('\n')
  }
  if (message.content && Array.isArray(message.content)) {
    const textParts = message.content
      .filter((p: { type?: string }) => p.type === 'text')
      .map((p: { text?: string }) => p.text || '')
      .filter(Boolean)
    if (textParts.length > 0) return textParts.join('\n')
  }
  if (typeof message.text === 'string') return message.text
  return ''
}

export async function POST(req: Request) {
  try {
    // Admin auth check
    const { isAdmin: isAdminUser, userId } = await isAdminWithUser()
    if (!isAdminUser || !userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const user = await getCurrentUser()

    const body = await req.json()
    const { messages: incomingMessages, canvasContent, modelOverride } = body ?? {}

    if (!Array.isArray(incomingMessages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Normalize messages to AI SDK UI message format
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

    // Validate and sanitize tool parts
    const validToolNames = new Set(Object.keys(adminChatTools))
    const toolSchemas = Object.fromEntries(
      Object.entries(adminChatTools).map(([name, t]) => [name, { inputSchema: t.inputSchema }])
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const msg of normalizedMessages as any[]) {
      if (msg.parts && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.type?.startsWith('tool-')) {
            const rawToolName = part.type.slice(5)
            if (!validToolNames.has(rawToolName)) {
              for (const validName of validToolNames) {
                if (rawToolName.startsWith(validName)) {
                  part.type = `tool-${validName}`
                  break
                }
              }
            }
            if (part.toolCallId && typeof part.toolCallId === 'string') {
              const cleanId = part.toolCallId.replace(/[^a-zA-Z0-9_-]/g, '')
              if (cleanId !== part.toolCallId) {
                part.toolCallId = cleanId
              }
            }
          }
        }
      }
    }

    const validation = await safeValidateUIMessages({
      messages: normalizedMessages,
      tools: toolSchemas as Parameters<typeof safeValidateUIMessages>[0]['tools'],
    })

    if (!validation.success) {
      console.error('[Admin Chat] Message validation failed:', validation.error)
      return new Response(JSON.stringify({ error: validation.error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const messages = validation.data

    // Get user context for personalized prompt
    let userContext: UserContext | undefined
    try {
      const profile = await getUserProfile(userId)
      userContext = {
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        email: user?.email,
      }
    } catch {
      console.warn('[Admin Chat] Profile fetch failed (non-fatal)')
    }

    // Parse canvas content if provided
    let parsedCanvas: CanvasContent | undefined
    if (canvasContent && typeof canvasContent === 'object') {
      parsedCanvas = {
        contentType: canvasContent.contentType || 'free-form',
        title: canvasContent.title || '',
        body: canvasContent.body || '',
      }
    }

    const MODEL_ID = modelOverride || await getActiveModel('admin-chat')
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const modelMessages = await convertToModelMessages(messages)
    const prunedMessages = pruneMessages({
      messages: modelMessages,
      toolCalls: 'before-last-message',
      emptyMessages: 'remove',
    })

    console.log('[Admin Chat] Messages:', prunedMessages.length, '| Canvas:', parsedCanvas ? 'yes' : 'no')

    const result = streamText({
      model: openrouter(MODEL_ID),
      system: getAdminSystemPrompt(userContext, parsedCanvas),
      messages: prunedMessages,
      tools: adminChatTools,
      stopWhen: stepCountIs(5),
      onError: (error) => {
        console.error('[Admin Chat] Stream error:', error)
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[Admin Chat] API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
