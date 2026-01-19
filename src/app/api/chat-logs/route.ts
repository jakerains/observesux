import { NextRequest, NextResponse } from 'next/server';
import {
  getRecentSessions,
  getChatAnalytics,
  searchMessages,
} from '@/lib/db/chat-logs';

/**
 * GET /api/chat-logs
 *
 * Query params:
 * - limit: number (default 50)
 * - offset: number (default 0)
 * - includeMessages: boolean (default false)
 * - search: string (optional - search message content)
 * - analytics: boolean (if true, returns analytics instead of sessions)
 * - days: number (for analytics, default 30)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Check if requesting analytics
    if (searchParams.get('analytics') === 'true') {
      const days = parseInt(searchParams.get('days') || '30', 10);
      const analytics = await getChatAnalytics({ days });

      if (!analytics) {
        return NextResponse.json(
          { error: 'Database not configured or analytics unavailable' },
          { status: 503 }
        );
      }

      return NextResponse.json(analytics);
    }

    // Check if searching messages
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const role = searchParams.get('role') as 'user' | 'assistant' | undefined;
      const results = await searchMessages(searchQuery, { limit, role });
      return NextResponse.json({ messages: results });
    }

    // Default: return recent sessions
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeMessages = searchParams.get('includeMessages') === 'true';

    const sessions = await getRecentSessions({ limit, offset, includeMessages });

    return NextResponse.json({
      sessions,
      pagination: {
        limit,
        offset,
        hasMore: sessions.length === limit,
      },
    });
  } catch (error) {
    console.error('Chat logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat logs' },
      { status: 500 }
    );
  }
}
