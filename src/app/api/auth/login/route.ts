import { NextRequest, NextResponse } from 'next/server';
import { mockUsers, findUserById } from '@/lib/auth-store';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    import { findUserByEmail } from '@/lib/auth-store';

// Find user (in production, use proper database authentication)
    const user = findUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { detail: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token (in production, use JWT or proper auth)
    const token = `demo_token_${user.id}_${Date.now()}`;

    const response: LoginResponse = {
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