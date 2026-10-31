import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory user store for demo
const users = new Map<string, any>();

// Add demo user
users.set('user@novaai.com', {
  id: 1,
  email: 'user@novaai.com',
  password: 'user123',
  name: 'Demo User'
});

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

    // Find user in our in-memory store
    const user = users.get(email);
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { detail: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token (in production, use JWT or proper auth)
    const token = `demo_token_${user.id}_${Date.now()}`;

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