import { streamText, stepCountIs, convertToModelMessages, gateway } from 'ai';
import { chatTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Feature flag check
const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true';

export async function POST(req: Request) {
  // Check feature flag
  if (!CHAT_ENABLED) {
    return new Response('Chat feature is disabled', { status: 403 });
  }

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: gateway('moonshotai/kimi-k2-0905'),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: chatTools,
      stopWhen: stepCountIs(5),
      providerOptions: {
        gateway: {
          only: ['groq'],
        },
      },
      onError: (error) => {
        console.error('Chat stream error:', error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Failed to process chat request', { status: 500 });
  }
}
