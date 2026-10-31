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

export function findUserByEmail(email: string) {
  return users.get(email);
}

export function createUser(email: string, password: string) {
  const user = {
    id: Date.now(),
    email,
    password,
    name: email.split('@')[0]
  };
  users.set(email, user);
  return user;
}

interface RegisterRequest {
  email: string;
  password: string;
}

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
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { detail: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = createUser(email, password);

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