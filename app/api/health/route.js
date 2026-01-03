import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { getPineconeClient } from '@/lib/db/pinecone';

export async function GET() {
  try {
    // Check MongoDB connection
    await connectDB();
    
    // Check Pinecone connection (optional - comment out if not setup yet)
    await getPineconeClient();

    return NextResponse.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
        // pinecone: 'connected',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
