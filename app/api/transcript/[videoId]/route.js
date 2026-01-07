import { NextResponse } from "next/server";
import YTDlpWrap from "yt-dlp-wrap";

/* ---------- helpers ---------- */

// Normalize mixed Hindi / Urdu / Hinglish
function normalizeText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[۔]/g, ".")
    .trim();
}

// Check if two strings are similar
function isSimilar(str1, str2, threshold = 0.9) {
  if (str1 === str2) return true;

  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return true;

  const shorter = str1.length < str2.length ? str1 : str2;
  const longer = str1.length >= str2.length ? str1 : str2;

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

/* ---------- Main Method: yt-dlp ---------- */

async function fetchViaYtDlp(videoId, retryCount = 0) {
  const MAX_RETRIES = 1;
  const RETRY_DELAY = 5000;

  try {
    console.log(
      "🎥 Trying yt-dlp for:",
      videoId,
      retryCount > 0 ? `(Retry ${retryCount}/${MAX_RETRIES})` : ""
    );

    const ytDlp = new YTDlpWrap();
    const fs = require("fs");

    console.log("🔄 Downloading subtitles...");

    const tempFile = `/tmp/yt-subtitle-${videoId}-${Date.now()}`;

    try {
      console.log("📝 Trying Hindi subtitles...");

      const hiOptions = [
        `https://www.youtube.com/watch?v=${videoId}`,
        "--skip-download",
        "--write-auto-subs",
        "--sub-lang",
        "hi",
        "--sub-format",
        "vtt",
        "-o",
        tempFile,
        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "--no-warnings",
        "--quiet",
      ];

      try {
        await ytDlp.execPromise(hiOptions);
      } catch {
        console.log("⚠️ Hindi failed, trying English...");
        
        const enOptions = [
          `https://www.youtube.com/watch?v=${videoId}`,
          "--skip-download",
          "--write-auto-subs",
          "--sub-lang",
          "en",
          "--sub-format",
          "vtt",
          "-o",
          tempFile,
          "--user-agent",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "--no-warnings",
          "--quiet",
        ];
        
        await ytDlp.execPromise(enOptions);
      }

      const possibleFiles = [
        `${tempFile}.hi.vtt`,
        `${tempFile}.en.vtt`,
        `${tempFile}.hi-IN.vtt`,
        `${tempFile}.en-US.vtt`,
        `${tempFile}.vtt`,
      ];

      let subtitleFile = null;

      for (const file of possibleFiles) {
        if (fs.existsSync(file)) {
          subtitleFile = file;
          break;
        }
      }

      if (!subtitleFile) {
        throw new Error("Subtitle file not created");
      }

      let text = fs.readFileSync(subtitleFile, "utf-8");

      // Parse VTT with timestamps
      const lines = text.split("\n");
      const segments = [];
      let currentTimestamp = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (
          !line ||
          line.includes("WEBVTT") ||
          line.includes("Kind:") ||
          line.includes("Language:")
        ) {
          continue;
        }

        // Extract timestamp
        if (line.includes("-->")) {
          const timestampMatch = line.match(
            /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/
          );
          if (timestampMatch) {
            currentTimestamp = timestampMatch[1];
          }
          continue;
        }

        // Skip line numbers
        if (line.match(/^\d+$/)) {
          continue;
        }

        // Extract text with timestamp
        if (currentTimestamp && line.length > 0) {
          const cleanText = line
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .trim();

          if (cleanText.length > 0) {
            segments.push({
              timestamp: currentTimestamp,
              text: cleanText,
            });
          }
        }
      }

      // Remove duplicates
      const uniqueSegments = [];
      let lastText = "";

      for (const segment of segments) {
        if (segment.text === lastText) continue;
        if (lastText && isSimilar(segment.text, lastText)) continue;

        uniqueSegments.push(segment);
        lastText = segment.text;
      }

      text = uniqueSegments
        .map((s) => s.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      fs.unlinkSync(subtitleFile);

      return {
        text,
        segments: uniqueSegments,
        source: "yt-dlp",
        language_hint: subtitleFile.includes(".hi.") ? "hi" : "en",
      };
    } catch (err) {
      if (
        err.message.includes("429") ||
        err.message.includes("Too Many Requests")
      ) {
        if (retryCount < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY));
          return fetchViaYtDlp(videoId, retryCount + 1);
        }
      }
      throw err;
    }
  } catch (error) {
    console.error("❌ FAILED:", error);
    throw error;
  }
}

/* ---------- API ---------- */

export async function GET(request, { params }) {
  const { videoId } =await params;

  if (!videoId) {
    return NextResponse.json(
      { error: "Video ID missing" },
      { status: 400 }
    );
  }

  try {
    const result = await fetchViaYtDlp(videoId);

    const normalized = normalizeText(result.text);

    return NextResponse.json({
      videoId,
      transcript: normalized,
      segments: result.segments,
      language: result.language_hint || "unknown",
      source: result.source,
    });
  } catch (error) {
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
