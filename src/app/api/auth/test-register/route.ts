import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ 
      message: 'Register endpoint is working',
      timestamp: new Date().toISOString(),
      success: true 
    });
  } catch (error) {
    console.error('Test register error:', error);
    return NextResponse.json(
      { 
        detail: 'Test register error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}