import { NextResponse } from "next/server";
import { spawn } from "child_process";

/* ---------- Main Method: Python youtube-transcript-api (WORKING) ---------- */

async function fetchTranscriptPython(videoId) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['-c', `
import json
import os
from youtube_transcript_api import YouTubeTranscriptApi

def try_fetch_transcript(video_id, proxy_list):
    """Try fetching transcript with multiple proxy fallback"""
    from youtube_transcript_api._transcripts import TranscriptListFetcher
    last_error = None
    
    # Try without proxy first (works locally)
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        transcript = get_transcript(transcript_list)
        return format_transcript(transcript)
    except Exception as e:
        last_error = e
        print(f"No proxy attempt failed: {str(e)[:100]}", file=__import__('sys').stderr)
    
    # Try each proxy in the list
    for i, proxy_url in enumerate(proxy_list):
        if not proxy_url:
            continue
        try:
            print(f"Trying proxy {i+1}/{len(proxy_list)}: {proxy_url[:30]}...", file=__import__('sys').stderr)
            proxies = {'https': proxy_url, 'http': proxy_url}
            fetcher = TranscriptListFetcher(proxies=proxies)
            api = YouTubeTranscriptApi(transcript_list_fetcher=fetcher)
            transcript_list = api.list(video_id)
            transcript = get_transcript(transcript_list)
            return format_transcript(transcript, proxy_used=f"proxy_{i+1}")
        except Exception as e:
            last_error = e
            print(f"Proxy {i+1} failed: {str(e)[:100]}", file=__import__('sys').stderr)
            continue
    
    # All proxies failed
    raise last_error

def get_transcript(transcript_list):
    """Get Hindi or English transcript"""
    try:
        return transcript_list.find_transcript(['hi', 'en'])
    except:
        return transcript_list.find_generated_transcript(['hi', 'en'])

def format_transcript(transcript, proxy_used=None):
    """Format transcript data with timestamps"""
    data = transcript.fetch()
    
    # Format segments with timestamps
    segments = []
    for item in data:
        start = item.start if hasattr(item, 'start') else item['start']
        text = item.text if hasattr(item, 'text') else item['text']
        
        hours = int(start // 3600)
        minutes = int((start % 3600) // 60)
        seconds = int(start % 60)
        milliseconds = int((start % 1) * 1000)
        timestamp = f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"
        segments.append({
            "timestamp": timestamp,
            "text": text.strip()
        })
    
    # Full text
    full_text = ' '.join([item.text if hasattr(item, 'text') else item['text'] for item in data])
    
    result = {
        "transcript": full_text,
        "segments": segments,
        "language": transcript.language_code,
        "source": "youtube-transcript-api"
    }
    
    if proxy_used:
        result["proxy_used"] = proxy_used
    
    return result

try:
    # Get proxy list from environment (comma-separated)
    proxy_env = os.environ.get('YOUTUBE_PROXY', '')
    proxy_list = [p.strip() for p in proxy_env.split(',') if p.strip()]
    
    result = try_fetch_transcript('${videoId}', proxy_list)
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
