import { streamText, stepCountIs, convertToModelMessages, gateway } from 'ai';
import { chatTools } from '@/lib/ai/tools';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import {
  createChatSession,
  ensureSessionExists,
  logChatMessage,
} from '@/lib/db/chat-logs';

export const runtime = 'nodejs';
export const maxDuration = 30;

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
    const { messages, sessionId: existingSessionId, lastLoggedMessageIndex, deviceInfo } = await req.json();

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

    if (!sessionId) {
      isNewSession = true;
      sessionId = await createChatSession({
        userAgent: req.headers.get('user-agent') || undefined,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] ||
                   req.headers.get('x-real-ip') ||
                   undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    } else if (isNewSession === false) {
      // Client provided a session ID - ensure it exists in DB, create if not
      // This handles the case where client has a session ID but it's a new browser session
      await ensureSessionExists(sessionId, {
        userAgent: req.headers.get('user-agent') || undefined,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] ||
                   req.headers.get('x-real-ip') ||
                   undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    }

    // Log only NEW user messages (ones we haven't logged yet)
    // lastLoggedMessageIndex tells us where we left off
    const startIndex = typeof lastLoggedMessageIndex === 'number' ? lastLoggedMessageIndex + 1 : 0;
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user');

    // Only log the most recent user message if it's new
    if (sessionId && userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      const lastUserMessageIndex = messages.indexOf(lastUserMessage);

      // Only log if this message hasn't been logged yet
      if (lastUserMessageIndex >= startIndex || isNewSession) {
        // Extract text content from various AI SDK message formats
        const content = extractMessageContent(lastUserMessage);

        if (content) {
          await logChatMessage({
            sessionId,
            role: 'user',
            content,
          });
          console.log('[Chat Log] User message logged:', content.substring(0, 50));
        } else {
          console.warn('[Chat Log] Could not extract content from user message:', JSON.stringify(lastUserMessage));
        }
      }
    }

    // Track tool calls during the stream
    const toolCallsUsed: string[] = [];

    const result = streamText({
      model: gateway('xai/grok-4-fast-non-reasoning'),
      system: getSystemPrompt(),
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
        // Log the assistant's response after streaming completes
        if (sessionId && text) {
          const responseTime = Date.now() - startTime;
          await logChatMessage({
            sessionId,
            role: 'assistant',
            content: text,
            toolCalls: toolCallsUsed.length > 0 ? toolCallsUsed : undefined,
            responseTimeMs: responseTime,
          });
        }
      },
      onError: (error) => {
        console.error('Chat stream error:', error);
      },
    });

    // Include sessionId in the response headers for the client to track
    const response = result.toUIMessageStreamResponse();

    // Add session ID header so client can include it in future requests
    if (sessionId) {
      response.headers.set('X-Chat-Session-Id', sessionId);
    }
    // Track where we are in the message array for deduplication
    response.headers.set('X-Chat-Message-Index', String(messages.length - 1));

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Failed to process chat request', { status: 500 });
  }
}
