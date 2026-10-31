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

    // For demo purposes, accept any valid email/password combination
    // In production, you'd validate against a database
    console.log('Login attempt for:', email);
    console.log('Password provided:', password ? 'yes' : 'no');
    
    // Generate token (in production, use JWT or proper auth)
    const token = `demo_token_${Date.now()}`;

    const response = {
      access_token: token,
      token_type: 'bearer'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}