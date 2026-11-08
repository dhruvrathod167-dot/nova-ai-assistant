import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Login endpoint is working',
      email: email,
      timestamp: new Date().toISOString(),
      success: true 
    });
  } catch (error) {
    console.error('Simple login error:', error);
    return NextResponse.json(
      { 
        detail: 'Simple login error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}