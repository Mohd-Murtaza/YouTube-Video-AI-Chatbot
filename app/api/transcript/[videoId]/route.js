import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { videoId } =await params;

  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `?videoId=${videoId}&language=en&free_trial=1`,
      {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Transcript fetch failed" },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (!data.success || !data.transcript || data.transcript.length === 0) {
      return NextResponse.json(
        { error: "No transcript available", videoId },
        { status: 404 }
      );
    }

    const fullText = data.transcript.map(seg => seg.text.trim()).join(" ");

    return NextResponse.json({
      videoId,
      transcript: fullText,
      language: data.language,
      source: "youtubetranscripts.app"
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
