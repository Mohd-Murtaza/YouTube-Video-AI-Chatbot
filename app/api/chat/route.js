import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import connectDB from "@/lib/db/mongodb";
import Transcript from "@/models/Transcript";
import Chat from '@/models/Chat';
import { authMiddleware } from '@/lib/auth/middleware';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    const { message, videoId, videoData } = await req.json();

    if (!message || !videoId) {
      return NextResponse.json(
        { error: "Message and videoId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get authenticated user
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    // Fetch transcript from MongoDB with timestamps
    const transcriptDoc = await Transcript.findOne({ videoId })
      .select('videoTitle channelTitle description thumbnail segments transcript')
      .lean();

    if (!transcriptDoc) {
      return NextResponse.json(
        { error: "Transcript not found. Please load the video first." },
        { status: 404 }
      );
    }

    // Build transcript with timestamps for LLM context
    const transcriptWithTimestamps = transcriptDoc.segments
      .map(seg => `[${seg.timestamp}] ${seg.text}`)
      .join('\n');

    // Get or create chat history for this user + video
    let chatDoc = await Chat.findOne({ userId: user.id, videoId });
    
    // Get last 10 messages for conversation context
    const conversationHistory = chatDoc?.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Create optimized prompt for Groq
    const systemPrompt = `You are a helpful AI assistant that answers questions about YouTube videos based on their content.

VIDEO INFORMATION:
Title: ${transcriptDoc.videoTitle}
Channel: ${transcriptDoc.channelTitle}
Description: ${transcriptDoc.description || 'Not available'}

VIDEO CONTENT WITH TIMESTAMPS:${transcriptWithTimestamps.substring(0, 15000)}${transcriptWithTimestamps.length > 15000 ? '\n...(content continues)' : ''}

CRITICAL INSTRUCTIONS:
1. Answer questions ONLY using the video content provided above
2. When mentioning any event, statement, or topic, ALWAYS include the EXACT timestamp in HH:MM:SS format
3. NEVER use the word "transcript" - always say "video" (e.g., "in the video", "the video shows", "mentioned in the video")
4. Be conversational, clear, and helpful in your responses
5. Do NOT guess, assume, or add external knowledge not present in the content
6. If information is missing, politely say: "This information is not covered in the video"
7. For time-based questions (when/what time), provide precise timestamps
8. If multiple moments are relevant, list them with their timestamps
9. Format timestamps as clickable references: "At 00:02:15" or "Between 00:05:00 and 00:06:30"

RESPONSE STYLE:
- Natural and conversational tone
- Always reference the video, never the transcript
- Include timestamps for every claim or reference
- Be specific and accurate

EXAMPLE RESPONSES:
✅ "At 00:02:15, the speaker mentions that..."
✅ "This is explained in the video at 00:03:45"
✅ "Between 00:05:00 and 00:06:30, the topic is discussed..."
✅ "The video shows at 00:01:20..."
❌ "According to the transcript..." (NEVER use this)
❌ "The transcript shows..." (NEVER use this)`;

    // Call Groq API with conversation history
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    const answer = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Save chat history
    if (!chatDoc) {
      chatDoc = new Chat({
        userId: user.id,
        videoId,
        videoTitle: transcriptDoc.videoTitle || videoData?.title || 'YouTube Video',
        videoThumbnail: transcriptDoc.thumbnail || videoData?.thumbnail || '',
        messages: []
      });
    }

    // Add messages
    chatDoc.messages.push({ role: 'user', content: message, timestamp: new Date() });
    chatDoc.messages.push({ role: 'assistant', content: answer, timestamp: new Date() });
    chatDoc.messageCount = chatDoc.messages.length;
    chatDoc.lastMessageAt = new Date();
    
    await chatDoc.save();

    return NextResponse.json({
      answer,
      videoId,
      videoTitle: transcriptDoc.videoTitle,
      messageCount: chatDoc.messages.length,
      chatId: chatDoc._id
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error.message },
      { status: 500 }
    );
  }
}
