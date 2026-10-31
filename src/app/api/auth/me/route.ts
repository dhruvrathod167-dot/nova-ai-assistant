import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: number;
  email: string;
  name: string;
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

// In-memory storage for created users (will reset on deployment)
const createdUsers = new Map<number, any>();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Validate token (in production, use proper JWT validation)
    if (!token.startsWith('demo_token_')) {
      return NextResponse.json(
        { detail: 'Invalid token' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const tokenParts = token.split('_');
    if (tokenParts.length < 3) {
      return NextResponse.json(
        { detail: 'Invalid token format' },
        { status: 401 }
      );
    }

    const userId = parseInt(tokenParts[1]);
    
    // Check both mock users and created users
    let user = mockUsers.find(u => u.id === userId);
    if (!user) {
      user = createdUsers.get(userId);
    }
    
    if (!user) {
      return NextResponse.json(
        { detail: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}