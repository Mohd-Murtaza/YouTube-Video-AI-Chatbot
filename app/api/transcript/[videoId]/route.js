import { NextResponse } from "next/server";
import { franc } from "franc";
import YTDlpWrap from "yt-dlp-wrap";

/* ---------- helpers ---------- */

// Detect language from text
function detectLanguage(text) {
  const lang = franc(text, { minLength: 20 });

  if (["hin", "urd"].includes(lang)) return "hi";
  if (lang === "eng") return "en";

  return "unknown";
}

// Normalize mixed Hindi / Urdu / Hinglish
function normalizeText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[۔]/g, ".")
    .trim();
}

// Check if two strings are similar (Levenshtein distance ratio)
function isSimilar(str1, str2, threshold = 0.9) {
  if (str1 === str2) return true;
  
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return true;
  
  // Simple similarity check: count matching characters
  const shorter = str1.length < str2.length ? str1 : str2;
  const longer = str1.length >= str2.length ? str1 : str2;
  
  // If length difference is too much, not similar
  if (longer.length > shorter.length * 1.2) return false;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter.substring(i, i + 3))) {
      matches += 3;
    }
  }
  
  const similarity = matches / maxLen;
  return similarity >= threshold;
}

/* ---------- Main Method: yt-dlp (most reliable) ---------- */
async function fetchViaYtDlp(videoId, retryCount = 0) {
  const MAX_RETRIES = 1;
  const RETRY_DELAY = 5000; // 5 seconds
  
  try {
    console.log("🎥 Trying yt-dlp for:", videoId, retryCount > 0 ? `(Retry ${retryCount}/${MAX_RETRIES})` : "");
    
    const ytDlp = new YTDlpWrap();
    const fs = require('fs');
    
    console.log("🔄 Downloading subtitles...");
    
    // Download subtitle to temp file
    const tempFile = `/tmp/yt-subtitle-${videoId}-${Date.now()}`;
    
    try {
      // Try Hindi first, then English as fallback
      let options = [
        `https://www.youtube.com/watch?v=${videoId}`,
        '--skip-download',
        '--write-auto-subs',
        '--sub-lang', 'hi',
        '--sub-format', 'vtt',
        '-o', tempFile,
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '--no-warnings',
        '--quiet'
      ];
      
      console.log("📝 Trying Hindi subtitles...");
      
      try {
        await ytDlp.execPromise(options);
        console.log("✅ Hindi download attempted");
      } catch (hiError) {
        console.log("⚠️ Hindi failed, trying English...");
        options[5] = 'en'; // Change sub-lang to 'en'
        await ytDlp.execPromise(options);
        console.log("✅ English download attempted");
      }
      
      console.log("✅ Subtitle download completed");
      
      // STEP 3: Find the downloaded file
      let subtitleFile = null;
      const possibleFiles = [
        `${tempFile}.hi.vtt`,
        `${tempFile}.en.vtt`,
        `${tempFile}.hi-IN.vtt`,
        `${tempFile}.en-US.vtt`,
        `${tempFile}.vtt`
      ];
      
      console.log("🔍 Looking for subtitle files...");
      
      for (const file of possibleFiles) {
        if (fs.existsSync(file)) {
          subtitleFile = file;
          console.log("✅ Found subtitle file:", file);
          break;
        }
      }
      
      if (!subtitleFile) {
        console.error("❌ Subtitle file not found in expected locations");
        console.error("🔍 Checking /tmp directory for any related files...");
        try {
          const tmpFiles = fs.readdirSync('/tmp').filter(f => f.includes(videoId.substring(0, 8)));
          console.log("📂 Files found in /tmp:", tmpFiles);
        } catch (e) {
          console.error("Could not list /tmp:", e.message);
        }
        throw new Error("Subtitle file not created - video may not have subtitles");
      }
      
      let text = fs.readFileSync(subtitleFile, 'utf-8');
      console.log("✅ Read", text.length, "characters from file");
      console.log("📝 First 200 chars:", text.substring(0, 200));
      
      // Parse VTT format - extract text with timestamps
      const lines = text.split('\n');
      const segments = [];
      let currentTimestamp = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip WEBVTT header and metadata
        if (!line || line.includes('WEBVTT') || line.includes('Kind:') || line.includes('Language:')) {
          continue;
        }
        
        // Check if line is a timestamp (format: 00:00:00.000 --> 00:00:05.000)
        if (line.includes('-->')) {
          const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
          if (timestampMatch) {
            currentTimestamp = {
              start: timestampMatch[1],
              end: timestampMatch[2]
            };
          }
          continue;
        }
        
        // Check if line is just a number (cue identifier)
        if (line.match(/^\d+$/)) {
          continue;
        }
        
        // This is actual text content
        if (currentTimestamp && line.length > 0) {
          const cleanText = line
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .trim();
          
          if (cleanText.length > 0) {
            segments.push({
              timestamp: currentTimestamp.start,
              text: cleanText
            });
          }
        }
      }
      
      console.log("📝 Total segments before deduplication:", segments.length);
      
      // Remove consecutive duplicate segments
      const uniqueSegments = [];
      let lastText = '';
      
      for (const segment of segments) {
        // Skip if exactly same as last text
        if (segment.text === lastText) {
          continue;
        }
        
        // Skip if very similar (90% similarity)
        if (lastText && isSimilar(segment.text, lastText, 0.9)) {
          continue;
        }
        
        uniqueSegments.push(segment);
        lastText = segment.text;
      }
      
      console.log("✅ Segments after deduplication:", uniqueSegments.length);
      
      // Create plain text version (for backward compatibility)
      text = uniqueSegments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();
      
      console.log("✅ Parsed text length:", text.length, "characters");
      
      // Clean up the file
      try {
        fs.unlinkSync(subtitleFile);
        console.log("🧹 Cleaned up temp file");
      } catch (e) {
        console.warn("⚠️ Could not delete temp file:", e.message);
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error("Empty subtitle file after parsing");
      }
      
      return {
        text: text.trim(),
        segments: uniqueSegments, // Array of {timestamp, text}
        source: "yt-dlp",
        language_hint: subtitleFile.includes('.hi.') ? "hi" : "en",
      };
      
    } catch (downloadError) {
      console.error("❌ Download failed:", downloadError.message);
      
      // Clean up any temp files even on error
      try {
        const fs = require('fs');
        const possibleFiles = [
          `${tempFile}.hi.vtt`,
          `${tempFile}.en.vtt`,
          `${tempFile}.hi-IN.vtt`,
          `${tempFile}.en-US.vtt`,
          `${tempFile}.vtt`
        ];
        possibleFiles.forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log("🧹 Cleaned up temp file on error:", file);
          }
        });
      } catch (cleanupError) {
        console.warn("⚠️ Could not cleanup temp files:", cleanupError.message);
      }
      
      // Check if it's a rate limit error
      if (downloadError.message.includes('429') || downloadError.message.includes('Too Many Requests')) {
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Rate limited. Waiting ${RETRY_DELAY/1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return fetchViaYtDlp(videoId, retryCount + 1);
        } else {
          throw new Error(`Rate limited after ${MAX_RETRIES} retries. Please try again later.`);
        }
      }
      
      throw downloadError;
    }
    
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    console.error("🔍 Error details:", error);
    throw error;
  }
}

/* ---------- API ---------- */
export async function GET(request, { params }) {
  const { videoId } = await params;

  console.log("\n" + "=".repeat(60));
  console.log("🎬 NEW TRANSCRIPT REQUEST");
  console.log("📹 Video ID:", videoId);
  console.log("🔗 YouTube URL: https://www.youtube.com/watch?v=" + videoId);
  console.log("=".repeat(60) + "\n");

  if (!videoId) {
    console.error("❌ No video ID provided");
    return NextResponse.json(
      { error: "Video ID missing" },
      { status: 400 }
    );
  }

  try {
    // Use yt-dlp directly
    console.log("🔄 Fetching transcript using yt-dlp...\n");
    let result = await fetchViaYtDlp(videoId);

    console.log("\n🔄 Processing text...");
    let normalized = normalizeText(result.text);
    let language = result.language_hint || detectLanguage(normalized);
    console.log("✅ Language detected:", language);
    console.log("✅ Final transcript length:", normalized.length, "characters");
    console.log("\n" + "=".repeat(60));
    console.log("✅ SUCCESS - Returning transcript");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      videoId,
      transcript: normalized,
      segments: result.segments, // Timestamped segments
      language,
      source: result.source,
    });

  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ TRANSCRIPT FETCH FAILED");
    console.error("=".repeat(60) + "\n");
    console.error("📛 Error:", error.message);
    console.error("🔍 Full error:", error);
    console.error("\n" + "=".repeat(60) + "\n");

    return NextResponse.json(
      {
        error: "Transcript not available",
        details: error.message,
        videoId: videoId
      },
      { status: 404 }
    );
  }
}
