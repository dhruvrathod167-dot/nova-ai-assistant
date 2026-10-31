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

    // Simple hardcoded authentication for demo
    if (email === 'user@novaai.com' && password === 'user123') {
      const token = `demo_token_${Date.now()}`;
      return NextResponse.json({
        access_token: token,
        token_type: 'bearer'
      });
    }

    return NextResponse.json(
      { detail: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}