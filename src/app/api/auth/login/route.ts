import { NextRequest, NextResponse } from 'next/server';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Mock user database for demo purposes
const mockUsers = [
  {
    id: 1,
    email: 'user@novaai.com',
    password: 'user123', // In production, this would be hashed
    name: 'Demo User'
  }
];

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

    // Find user (in production, use proper database authentication)
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
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