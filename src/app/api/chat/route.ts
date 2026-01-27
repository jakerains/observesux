import { streamText, stepCountIs, convertToModelMessages, safeValidateUIMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { chatTools } from '@/lib/ai/tools';
import { getSystemPrompt, type UserContext } from '@/lib/ai/system-prompt';
import {
  createChatSession,
  ensureSessionExists,
  logChatMessage,
} from '@/lib/db/chat-logs';
import { getCurrentUser } from '@/lib/auth/server';
import { getUserProfile } from '@/lib/db/profiles';

export const runtime = 'nodejs';
export const maxDuration = 30;

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Extract text content from various AI SDK message formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessageContent(message: any): string {
  // 1. Direct string content
  if (typeof message.content === 'string') {
    return message.content;
  }

  // 2. AI SDK UIMessage format with 'parts' array
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter((p: { type?: string }) => p.type === 'text')
      .map((p: { text?: string }) => p.text || '')
      .filter(Boolean);
    if (textParts.length > 0) return textParts.join('\n');

    // Fallback: try without type filtering
    const anyText = message.parts
      .map((p: { text?: string }) => p.text || '')
      .filter(Boolean);
    if (anyText.length > 0) return anyText.join('\n');
  }

  // 3. Content array format (older SDK versions)
  if (message.content && Array.isArray(message.content)) {
    const textParts = message.content
      .filter((p: { type?: string }) => p.type === 'text')
      .map((p: { text?: string }) => p.text || '')
      .filter(Boolean);
    if (textParts.length > 0) return textParts.join('\n');
  }

  // 4. Direct text property
  if (typeof message.text === 'string') {
    return message.text;
  }

  // 5. Last resort: stringify and look for text
  const str = JSON.stringify(message);
  const textMatch = str.match(/"text"\s*:\s*"([^"]+)"/);
  if (textMatch) {
    return textMatch[1];
  }

  return '';
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { messages: incomingMessages, sessionId: existingSessionId, lastLoggedMessageIndex, deviceInfo } = body ?? {};

    if (!Array.isArray(incomingMessages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages must be an array' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('[Chat] Incoming messages summary:', {
      count: incomingMessages.length,
      sample: incomingMessages.slice(0, 2).map((message) => ({
        role: message?.role,
        hasParts: Array.isArray(message?.parts),
        hasContent: typeof message?.content === 'string' || Array.isArray(message?.content),
        keys: message && typeof message === 'object' ? Object.keys(message) : null,
      })),
    });

    // Normalize incoming messages to AI SDK UI message format (parts array).
    const normalizedMessages = incomingMessages.map((message) => {
      if (!message || typeof message !== 'object') return message;
      if (Array.isArray(message.parts)) return message;
      if (typeof message.content === 'string') {
        return { ...message, parts: [{ type: 'text', text: message.content }] };
      }
      if (Array.isArray(message.content)) {
        return { ...message, parts: message.content };
      }
      return { ...message, parts: [] };
    });

    const validation = await safeValidateUIMessages({
      messages: normalizedMessages,
      // Cast to satisfy TypeScript's strict variance checking
      // The tools have compatible runtime behavior, but Record<string, never> vs unknown doesn't unify
      tools: chatTools as Parameters<typeof safeValidateUIMessages>[0]['tools'],
    });

    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.message }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    const messages = validation.data;

    // Get current user if logged in (for chat logging and personalization)
    // Non-fatal: chat works without personalization
    let userId: string | undefined;
    let userContext: UserContext | undefined;
    try {
      const user = await getCurrentUser();
      userId = user?.id;

      // Fetch user profile for personalized system prompt
      if (userId) {
        const profile = await getUserProfile(userId);
        userContext = {
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          email: user?.email,
        };
      }
    } catch (authError) {
      console.warn('[Chat] Auth/profile fetch failed (non-fatal):', authError);
    }

    // Get or create session ID
    // Client may provide a UUID - validate it's a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let sessionId = existingSessionId && uuidRegex.test(existingSessionId) ? existingSessionId : null;
    let isNewSession = false;

    // Build metadata object with device info if provided
    const metadata: Record<string, unknown> = {};
    if (deviceInfo) {
      metadata.deviceType = deviceInfo.deviceType;
      metadata.viewportWidth = deviceInfo.viewportWidth;
      metadata.viewportHeight = deviceInfo.viewportHeight;
      metadata.isTouchDevice = deviceInfo.isTouchDevice;
    }

    // Database session management - non-fatal (chat works without logging)
    try {
      if (!sessionId) {
        isNewSession = true;
        sessionId = await createChatSession({
          userId,
          userAgent: req.headers.get('user-agent') || undefined,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
      } else if (isNewSession === false) {
        // Client provided a session ID - ensure it exists in DB, create if not
        await ensureSessionExists(sessionId, {
          userId,
          userAgent: req.headers.get('user-agent') || undefined,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
      }
    } catch (sessionError) {
      console.warn('[Chat] Session management failed (non-fatal):', sessionError);
      sessionId = null; // Clear session ID so we don't try to log messages
    }

    // Log user message - non-fatal
    const startIndex = typeof lastLoggedMessageIndex === 'number' ? lastLoggedMessageIndex + 1 : 0;
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user');

    if (sessionId && userMessages.length > 0) {
      try {
        const lastUserMessage = userMessages[userMessages.length - 1];
        const lastUserMessageIndex = messages.indexOf(lastUserMessage);

        if (lastUserMessageIndex >= startIndex || isNewSession) {
          const content = extractMessageContent(lastUserMessage);

          if (content) {
            await logChatMessage({
              sessionId,
              role: 'user',
              content,
            });
            console.log('[Chat Log] User message logged:', content.substring(0, 50));
          }
        }
      } catch (logError) {
        console.warn('[Chat] Message logging failed (non-fatal):', logError);
      }
    }

    // Track tool calls during the stream
    const toolCallsUsed: string[] = [];

    const MODEL_ID = 'anthropic/claude-sonnet-4.5';
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    console.log(`[Chat] Using model: ${MODEL_ID}`);
    const result = streamText({
      model: openrouter(MODEL_ID),
      system: getSystemPrompt(userContext),
      messages: await convertToModelMessages(messages),
      tools: chatTools,
      stopWhen: stepCountIs(5),
      onStepFinish: ({ toolCalls }) => {
        // Track each tool that was called
        if (toolCalls) {
          for (const call of toolCalls) {
            if (!toolCallsUsed.includes(call.toolName)) {
              toolCallsUsed.push(call.toolName);
            }
          }
        }
      },
      onFinish: async ({ text }) => {
        // Log the assistant's response after streaming completes - non-fatal
        if (sessionId && text) {
          try {
            const responseTime = Date.now() - startTime;
            await logChatMessage({
              sessionId,
              role: 'assistant',
              content: text,
              toolCalls: toolCallsUsed.length > 0 ? toolCallsUsed : undefined,
              responseTimeMs: responseTime,
            });
          } catch (logError) {
            console.warn('[Chat] Response logging failed (non-fatal):', logError);
          }
        }
      },
      onError: (error) => {
        console.error('Chat stream error:', error);
      },
    });

    // Include sessionId in the response headers for the client to track
    const response = result.toUIMessageStreamResponse();

    // Add CORS headers for mobile app
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }

    // Add session ID header so client can include it in future requests
    if (sessionId) {
      response.headers.set('X-Chat-Session-Id', sessionId);
    }
    // Track where we are in the message array for deduplication
    response.headers.set('X-Chat-Message-Index', String(messages.length - 1));

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}
