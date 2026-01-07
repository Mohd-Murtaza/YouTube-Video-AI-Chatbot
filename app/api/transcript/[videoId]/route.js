import { NextResponse } from "next/server";
import { spawn } from "child_process";

/* ---------- Main Method: Python youtube-transcript-api (WORKING) ---------- */

async function fetchTranscriptPython(videoId) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['-c', `
import json
from youtube_transcript_api import YouTubeTranscriptApi

try:
    # Create API instance and list transcripts
    api = YouTubeTranscriptApi()
    transcript_list = api.list('${videoId}')
    
    # Find Hindi or English transcript
    try:
        transcript = transcript_list.find_transcript(['hi', 'en'])
    except:
        transcript = transcript_list.find_generated_transcript(['hi', 'en'])
    
    # Fetch transcript data
    data = transcript.fetch()
    
    # Format segments with timestamps
    segments = []
    for item in data:
        start = item.start
        hours = int(start // 3600)
        minutes = int((start % 3600) // 60)
        seconds = int(start % 60)
        milliseconds = int((start % 1) * 1000)
        timestamp = f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"
        segments.append({
            "timestamp": timestamp,
            "text": item.text.strip()
        })
    
    # Full text
    full_text = ' '.join([item.text for item in data])
    
    result = {
        "transcript": full_text,
        "segments": segments,
        "language": transcript.language_code,
        "source": "youtube-transcript-api"
    }
    
    print(json.dumps(result))
except Exception as e:
    import traceback
    print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))
`]);

    let dataString = '';
    let errorString = '';

    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorString || 'Python script failed'));
        return;
      }

      try {
        const result = JSON.parse(dataString);
        if (result.error) {
          console.error("Python error:", result.error);
          if (result.traceback) {
            console.error("Traceback:", result.traceback);
          }
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      } catch (e) {
        reject(new Error('Failed to parse Python output: ' + dataString));
      }
    });
  });
}

/* ---------- API ---------- */

export async function GET(request, { params }) {
  const { videoId } = await params;

  console.log("\n" + "=".repeat(60));
  console.log("🎬 NEW TRANSCRIPT REQUEST");
  console.log("📹 Video ID:", videoId);
  console.log("=".repeat(60) + "\n");

  if (!videoId) {
    return NextResponse.json(
      { error: "Video ID missing" },
      { status: 400 }
    );
  }

  try {
    console.log("🔄 Fetching transcript via Python...");
    const result = await fetchTranscriptPython(videoId);

    console.log("✅ Transcript fetched:", result.segments.length, "segments");
    console.log("✅ Language:", result.language);

    return NextResponse.json({
      videoId,
      transcript: result.transcript,
      segments: result.segments,
      language: result.language,
      source: result.source,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    return NextResponse.json(
      {
        error: "Transcript not available",
        details: error.message,
        videoId,
      },
      { status: 404 }
    );
  }
}
