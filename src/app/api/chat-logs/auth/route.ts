import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chat-logs/auth
 * Verify password for chat logs access
 */
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.CHAT_LOGS_PASSWORD;

    if (!correctPassword) {
      // If no password is set, deny access
      return NextResponse.json(
        { error: 'Chat logs access not configured' },
        { status: 503 }
      );
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
