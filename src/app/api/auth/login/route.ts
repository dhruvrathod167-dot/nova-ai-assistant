import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/simple-auth';

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
    console.log('Login request received');
    const body: LoginRequest = await request.json();
    const { email, password } = body;
    
    console.log('Login attempt with email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user (in production, use proper database authentication)
    const user = findUserByEmail(email);
    console.log('User found:', !!user);
    
    if (!user || user.password !== password) {
      console.log('Invalid credentials');
      return NextResponse.json(
        { detail: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token (in production, use JWT or proper auth)
    const token = `demo_token_${user.id}_${Date.now()}`;
    console.log('Token generated successfully');

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