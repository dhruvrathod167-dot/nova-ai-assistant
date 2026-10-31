import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Login request received');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { email, password } = body;

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Email and password provided, generating token');
    
    // Generate token (in production, use JWT or proper auth)
    const token = `demo_token_${Date.now()}`;
    console.log('Generated token:', token);

    const response = {
      access_token: token,
      token_type: 'bearer'
    };

    console.log('Returning response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}