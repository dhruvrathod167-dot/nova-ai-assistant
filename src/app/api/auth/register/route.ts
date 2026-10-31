import { NextRequest, NextResponse } from 'next/server';

interface RegisterRequest {
  email: string;
  password: string;
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
    const body: RegisterRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { detail: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { detail: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user (in production, use proper database)
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password, // In production, hash this password
      name: email.split('@')[0]
    };
    
    mockUsers.push(newUser);

    return NextResponse.json(
      { detail: 'Registration successful' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}