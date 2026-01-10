import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Transcript from "@/models/Transcript";
import { fetchVideoDetails } from "@/lib/youtube";
import { formatTimestamp } from "@/lib/utils/formatters";

export async function GET(req, { params }) {
  const { videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }

  try {
    await connectDB();

    // Step 1: Check MongoDB first (optimized query)
    let transcript = await Transcript.findOne({ videoId })
      .select('videoId videoTitle channelTitle description transcript segments language source isPineconeIndexed accessCount')
      .lean();

    if (transcript) {
      // Update access tracking (non-blocking)
      Transcript.findByIdAndUpdate(
        transcript._id,
        { 
          $inc: { accessCount: 1 },
          $set: { lastAccessedAt: new Date() }
        }
      ).exec();

      console.log(`✅ Transcript fetched from MongoDB (cache hit) - ${videoId}`);
      
      return NextResponse.json({
        videoId: transcript.videoId,
        videoTitle: transcript.videoTitle,
        channelTitle: transcript.channelTitle,
        description: transcript.description,
        transcript: transcript.transcript,
        segments: transcript.segments,
        language: transcript.language,
        source: transcript.source,
        cached: true,
        isPineconeIndexed: transcript.isPineconeIndexed,
      });
    }

    // Step 2: Fetch from external API
    console.log(`⏳ Transcript not in cache, fetching from API - ${videoId}`);
    
    const transcriptApiUrl = process.env.TRANSCRIPT_API_URL;
    const res = await fetch(
      `${transcriptApiUrl}?videoId=${videoId}&language=en&free_trial=1`,
      {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        },
        signal: AbortSignal.timeout(20000) // 20 second timeout
      }
    );

    if (!res.ok) {
      console.error(`❌ API returned status ${res.status} for ${videoId}`);
      
      // Check if it's a captions not available error
      const errorData = await res.json().catch(() => ({}));
      
      if (res.status === 500 || res.status === 404) {
        return NextResponse.json(
          { 
            error: "no_captions",
            message: "Captions are not available for this video. Please try another video with subtitles enabled.",
            videoId 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: "Transcript fetch failed", status: res.status, videoId },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log(`📦 API response received for ${videoId}, segments: ${data.transcript?.length || 0}`);

    if (!data.success || !data.transcript || data.transcript.length === 0) {
      return NextResponse.json(
        { 
          error: "no_captions",
          message: "No captions available for this video. The video may not have subtitles or they may be disabled.",
          videoId 
        },
        { status: 404 }
      );
    }

    // Step 3: Fetch video metadata
    let videoMetadata = null;
    try {
      console.log(`📡 Fetching video metadata for ${videoId}...`);
      videoMetadata = await fetchVideoDetails(videoId);
      console.log(`✅ Video metadata fetched: ${videoMetadata?.title || 'Unknown'}`);
    } catch (err) {
      console.warn(`⚠️ Could not fetch video metadata for ${videoId}:`, err.message);
    }

    // Step 4: Format segments with timestamps
    const segments = data.transcript.map(seg => ({
      text: seg.text.trim(),
      offset: seg.offset,
      duration: seg.duration,
      timestamp: formatTimestamp(seg.offset),
    }));

    const fullText = segments.map(seg => seg.text).join(" ");

    // Step 5: Save to MongoDB
    console.log(`💾 Saving transcript to MongoDB for ${videoId}...`);
    const newTranscript = new Transcript({
      videoId,
      videoTitle: videoMetadata?.title || 'YouTube Video',
      channelTitle: videoMetadata?.channelTitle || 'Unknown Channel',
      description: videoMetadata?.description || '',
      thumbnail: videoMetadata?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: videoMetadata?.duration || '',
      viewCount: videoMetadata?.viewCount || '0',
      publishedAt: videoMetadata?.publishedAt,
      transcript: fullText,
      segments: segments,
      language: data.language || 'en',
      source: 'youtubetranscripts.app',
      accessCount: 1,
      lastAccessedAt: new Date(),
    });

    await newTranscript.save();
    console.log(`✅ Transcript saved to MongoDB - ${videoId}`);

    return NextResponse.json({
      videoId,
      videoTitle: newTranscript.videoTitle,
      channelTitle: newTranscript.channelTitle,
      description: newTranscript.description,
      transcript: fullText,
      segments: segments,
      language: newTranscript.language,
      source: newTranscript.source,
      cached: false,
      isPineconeIndexed: false,
    });

  } catch (err) {
    console.error(`❌ Transcript API Error for ${videoId}:`, err);
    console.error('Error stack:', err.stack);
    return NextResponse.json(
      { error: "Server error", details: err.message, videoId },
      { status: 500 }
    );
  }
}
