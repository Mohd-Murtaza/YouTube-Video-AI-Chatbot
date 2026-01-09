import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Chat from '@/models/Chat';
import { authMiddleware } from '@/lib/auth/middleware';

// GET /api/history - Get all video history for logged-in user
export async function GET(req) {
  try {
    await connectDB();

    const { user, error } = await authMiddleware(req);
    if (error) return error;

    // Get all chats for this user, sorted by most recent
    const chats = await Chat.find({ userId: user.id })
      .select('videoId videoTitle videoThumbnail messageCount lastMessageAt messages')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Format response with last message preview
    const history = chats.map(chat => ({
      videoId: chat.videoId,
      videoTitle: chat.videoTitle,
      videoThumbnail: chat.videoThumbnail,
      messageCount: chat.messageCount,
      lastMessageAt: chat.lastMessageAt,
      lastMessage: chat.messages[chat.messages.length - 1]?.content?.substring(0, 100) || 'No messages',
      lastMessageRole: chat.messages[chat.messages.length - 1]?.role || 'user'
    }));

    return NextResponse.json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: error.message },
      { status: 500 }
    );
  }
}
