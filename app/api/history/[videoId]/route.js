import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Chat from '@/models/Chat';
import { authMiddleware } from '@/lib/auth/middleware';

// GET /api/history/[videoId] - Get full chat history for specific video
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { user, error } = await authMiddleware(req);
    if (error) return error;

    const { videoId } = await params;

    // Get chat for this user + video
    const chat = await Chat.findOne({ userId: user.id, videoId })
      .select('videoId videoTitle videoThumbnail messages messageCount lastMessageAt')
      .lean();

    if (!chat) {
      return NextResponse.json({
        success: true,
        videoId,
        messages: [],
        messageCount: 0,
        exists: false
      });
    }

    return NextResponse.json({
      success: true,
      videoId: chat.videoId,
      videoTitle: chat.videoTitle,
      videoThumbnail: chat.videoThumbnail,
      messages: chat.messages,
      messageCount: chat.messageCount,
      lastMessageAt: chat.lastMessageAt,
      exists: true
    });

  } catch (error) {
    console.error('History [videoId] API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/history/[videoId] - Delete chat history for specific video
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { user, error } = await authMiddleware(req);
    if (error) return error;

    const { videoId } = params;

    const result = await Chat.deleteOne({ userId: user.id, videoId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history deleted',
      videoId
    });

  } catch (error) {
    console.error('Delete History API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete history', details: error.message },
      { status: 500 }
    );
  }
}
