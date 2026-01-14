import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import connectDB from "@/lib/db/mongodb";
import Transcript from "@/models/Transcript";
import Chat from '@/models/Chat';
import { authMiddleware } from '@/lib/auth/middleware';
import { embedQuery } from "@/lib/rag/embeddings";
import { searchRelevantChunks } from "@/lib/rag/pinecone";

console.log("🚀 ~ process.env.GROQ_API_KEY:", process.env.GROQ_API_KEY)
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

    // Fetch transcript metadata from MongoDB
    const transcriptDoc = await Transcript.findOne({ videoId })
      .select('videoTitle channelTitle description thumbnail segments transcript isPineconeIndexed language')
      .lean();

    if (!transcriptDoc) {
      return NextResponse.json(
        { error: "Transcript not found. Please load the video first." },
        { status: 404 }
      );
    }

    // 🔗 RAG RETRIEVAL CHAIN (Phase 5): Embed Query → Search → Build Context
    let videoContext = '';
    let usedRAG = false;
    
    if (transcriptDoc.isPineconeIndexed) {
      try {
        console.log('\n🔗 === RAG RETRIEVAL CHAIN START ===');
        
        // Step 1: Embed user query
        console.log('🔢 Step 1/3: Embedding query...');
        const queryEmbedding = await embedQuery(message);
        
        // Step 2: Search Pinecone for relevant chunks
        console.log('🔍 Step 2/3: Searching Pinecone...');
        const relevantChunks = await searchRelevantChunks(queryEmbedding, videoId, 3);
        
        // Step 3: Build context from relevant chunks
        console.log(`📝 Step 3/3: Building context from ${relevantChunks.length} chunks...`);
        
        if (relevantChunks.length > 0) {
          // Sort by timestamp for chronological order
          const sortedChunks = relevantChunks.sort((a, b) => 
            a.timestamp.localeCompare(b.timestamp)
          );
          
          videoContext = sortedChunks
            .map(chunk => `[${chunk.timestamp}] ${chunk.text}`)
            .join('\n\n');
          
          usedRAG = true;
          console.log(`✅ RAG retrieval complete - Context: ${videoContext.length} chars`);
        } else {
          console.warn('⚠️ No relevant chunks found, falling back to full transcript');
          // Fallback to full transcript
          videoContext = transcriptDoc.segments
            .map(seg => `[${seg.timestamp}] ${seg.text}`)
            .join('\n')
            .substring(0, 15000);
        }
        
        console.log('🔗 === RAG RETRIEVAL CHAIN END ===\n');
        
      } catch (ragError) {
        console.error('⚠️ RAG retrieval failed, falling back to full transcript:', ragError.message);
        // Fallback to full transcript
        videoContext = transcriptDoc.segments
          .map(seg => `[${seg.timestamp}] ${seg.text}`)
          .join('\n')
          .substring(0, 15000);
      }
    } else {
      // Video not indexed yet - use full transcript
      console.log('📝 Using full transcript (not indexed in Pinecone yet)');
      videoContext = transcriptDoc.segments
        .map(seg => `[${seg.timestamp}] ${seg.text}`)
        .join('\n')
        .substring(0, 15000);
    }

    // Get or create chat history for this user + video
    let chatDoc = await Chat.findOne({ userId: user.id, videoId });
    
    // Get last 5 messages for conversation context (reduced from 10 for token optimization)
    const conversationHistory = chatDoc?.messages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Create optimized prompt for Groq
    const systemPrompt = `You are a helpful AI assistant that answers questions about YouTube videos based on their content.

VIDEO INFORMATION:
Title: ${transcriptDoc.videoTitle}
Channel: ${transcriptDoc.channelTitle}
Description: ${transcriptDoc.description || 'Not available'}

VIDEO CONTENT WITH TIMESTAMPS:
${videoContext}${videoContext.length > 14000 ? '\n...(content continues)' : ''}

CRITICAL INSTRUCTIONS (FOLLOW STRICTLY):
1. The video content may be in Hindi, English, or mixed (Hinglish). UNDERSTAND the content regardless of language.

2. LANGUAGE + SCRIPT MATCHING (VERY IMPORTANT):
   - You MUST match BOTH the language AND the script of the user's question.
   - If the user uses ONLY English alphabets (a–z, A–Z), you MUST respond ONLY using English alphabets.
     → Even for Hindi or Hinglish answers, use Roman script ONLY.
   - DO NOT use Devanagari script unless the user explicitly uses Devanagari.
   - Examples:
     • User: "kya is video me AI agents ke baare me bataya gaya hai?"
       → Answer MUST be Hinglish in Roman script.
     • User: "क्या इस वीडियो में AI एजेंट्स के बारे में बताया गया है?"
       → Answer MUST be in Devanagari.
     • User: "What is explained in this video?"
       → Answer MUST be in English.

3. When mentioning any event, statement, or topic, ALWAYS include the EXACT timestamp in HH:MM:SS format.

4. NEVER use the word "transcript".
   - Always say "video" (e.g., "in the video", "the video explains", "mentioned in the video").

5. Answer questions ONLY using the video content provided above.
   - DO NOT guess, infer, or add external knowledge.
   - If the answer requires information not explicitly mentioned in the video, clearly say it is not covered.

6. If information is missing:
   - Roman Hinglish: "Yeh information video me cover nahi hui hai."
   - English: "This specific information is not covered in the video."
   - Devanagari Hindi: "यह जानकारी वीडियो में कवर नहीं की गई है।"

7. For Hindi/Hinglish content:
   - Focus on the MEANING and concepts.
   - Do NOT do literal word-by-word translation.

8. For technical questions:
   - Extract and explain ONLY what is explained in the video.
   - Be precise and factual.

9. If multiple moments are relevant:
   - List them clearly with their timestamps in chronological order.

RESPONSE STYLE:
- Natural and conversational
- Clear and structured
- Always reference the video
- Include timestamps for every claim
- Be accurate and concise

GOOD EXAMPLES:
✅ "Haan, is video me AI agents ke baare me baat ki gayi hai. 00:48:39 par video me bataya gaya hai ki agents multiple calls ko kaise handle karte hain."
✅ "At 00:03:45, the video explains how the temperature parameter affects randomness."
✅ "00:49:18 par video me agent aur tools ko import karne ka process dikhaya gaya hai."

BAD EXAMPLES:
❌ "According to the transcript..."
❌ Mixing Roman question with Devanagari answer
❌ Guessing beyond the video content
❌ Missing timestamps`;


    // Log context being sent to Groq
    console.log('\n📤 === CONTEXT SENT TO GROQ ===');
    console.log(`📊 Context length: ${videoContext.length} chars`);
    console.log(`📝 First 500 chars: ${videoContext.substring(0, 500)}...`);
    console.log(`💬 User query: "${message}"`);
    console.log(`🔄 RAG used: ${usedRAG ? 'YES' : 'NO (full transcript)'}`);
    console.log('================================\n');

    // Groq models with fallback (free tier optimized)
    const GROQ_MODELS = [
      { name: 'llama-3.3-70b-versatile', maxTokens: 1024, maxContextChars: 12000 },     // Best quality, can handle more context
      { name: 'llama-3.1-8b-instant', maxTokens: 800, maxContextChars: 8000 },          // Fast, needs smaller context
      { name: 'mixtral-8x7b-32768', maxTokens: 1024, maxContextChars: 10000 },          // Backup
    ];

    let completion;
    let lastError;

    // Try models with fallback
    for (const model of GROQ_MODELS) {
      try {
        console.log(`🤖 Trying model: ${model.name}`);
        
        // Adjust context size for smaller models
        let adjustedContext = videoContext;
        if (videoContext.length > model.maxContextChars) {
          adjustedContext = videoContext.substring(0, model.maxContextChars);
          console.log(`✂️ Context truncated: ${videoContext.length} → ${adjustedContext.length} chars for ${model.name}`);
        }

        // Create adjusted prompt with model-specific context
        const adjustedPrompt = `You are a helpful AI assistant that answers questions about YouTube videos based on their content.

VIDEO INFORMATION:
Title: ${transcriptDoc.videoTitle}
Channel: ${transcriptDoc.channelTitle}
Description: ${transcriptDoc.description ? transcriptDoc.description.substring(0, 200) : 'Not available'}

VIDEO CONTENT WITH TIMESTAMPS:
${adjustedContext}${adjustedContext.length < videoContext.length ? '\n...(content truncated for this model)' : ''}

CRITICAL INSTRUCTIONS (FOLLOW STRICTLY):
1. The video content may be in Hindi, English, or mixed (Hinglish). UNDERSTAND the content regardless of language.

2. LANGUAGE + SCRIPT MATCHING (VERY IMPORTANT):
   - You MUST match BOTH the language AND the script of the user's question.
   - If the user uses ONLY English alphabets (a–z, A–Z), you MUST respond ONLY using English alphabets.
     → Even for Hindi or Hinglish answers, use Roman script ONLY.
   - DO NOT use Devanagari script unless the user explicitly uses Devanagari.

3. When mentioning any event, statement, or topic, ALWAYS include the EXACT timestamp in HH:MM:SS format.

4. NEVER use the word "transcript" - always say "video".

5. Answer questions ONLY using the video content provided above - do NOT guess or add external knowledge.

6. If information is missing:
   - Roman Hinglish: "Yeh information video me cover nahi hui hai."
   - English: "This specific information is not covered in the video."

7. Focus on the MEANING and concepts - do NOT do literal translations.

8. Be conversational, clear, and include timestamps for every claim.`;
        
        completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: adjustedPrompt,
            },
            ...conversationHistory,
            {
              role: "user",
              content: message,
            },
          ],
          model: model.name,
          temperature: 0.7,
          max_tokens: model.maxTokens,
          top_p: 1,
        });

        console.log(`✅ Success with model: ${model.name}`);
        break; // Success, exit loop

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Model ${model.name} failed:`, error.message);
        
        // If rate limit, try next model
        if (error.status === 429) {
          console.log(`🔄 Rate limit hit, trying next model...`);
          continue;
        }
        
        // For other errors, stop trying
        throw error;
      }
    }

    // If all models failed
    if (!completion) {
      throw new Error(`All models failed. Last error: ${lastError?.message}`);
    }

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
