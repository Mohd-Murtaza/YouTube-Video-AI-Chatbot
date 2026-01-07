import { NextResponse } from "next/server";

/**
 * Server-side config endpoint
 * Exposes safe environment variables to client
 */
export async function GET() {
  return NextResponse.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    youtubeApiKey: process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  });
}
