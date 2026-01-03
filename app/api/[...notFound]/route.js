import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'API route not found',
      error: 'The requested endpoint does not exist',
    },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'API route not found',
      error: 'The requested endpoint does not exist',
    },
    { status: 404 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: 'API route not found',
      error: 'The requested endpoint does not exist',
    },
    { status: 404 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: 'API route not found',
      error: 'The requested endpoint does not exist',
    },
    { status: 404 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      message: 'API route not found',
      error: 'The requested endpoint does not exist',
    },
    { status: 404 }
  );
}
