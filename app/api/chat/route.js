import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import connectDB from "@/lib/db/mongodb";
import Transcript from "@/models/Transcript";

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

    // Fetch transcript from MongoDB with timestamps
    const transcriptDoc = await Transcript.findOne({ videoId })
      .select('videoTitle channelTitle description segments transcript')
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

    // Create optimized prompt for Groq
    const systemPrompt = `You are a helpful AI assistant that answers questions about YouTube videos based on their transcripts.

VIDEO INFORMATION:
Title: ${transcriptDoc.videoTitle}
Channel: ${transcriptDoc.channelTitle}
Description: ${transcriptDoc.description || 'Not available'}

TRANSCRIPT WITH TIMESTAMPS:
${transcriptWithTimestamps.substring(0, 15000)}${transcriptWithTimestamps.length > 15000 ? '\n...(transcript continues)' : ''}

INSTRUCTIONS:
1. Answer questions based ONLY on the transcript content
2. When mentioning events, ALWAYS include the timestamp (e.g., "At 00:05:32, Aisha went inside the mall")
3. Be conversational and helpful
4. If information is not in the transcript, say so politely
5. For time-based questions (when/what time), provide exact timestamps
6. You can reference multiple timestamps if relevant

EXAMPLE RESPONSES:
- "At 00:02:15, the speaker mentions that..."
- "Between 00:05:00 and 00:06:30, you can see..."
- "This topic is discussed at 00:03:45"`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
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

    return NextResponse.json({
      answer,
      videoId,
      videoTitle: transcriptDoc.videoTitle,
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error.message },
      { status: 500 }
    );
  }
}
