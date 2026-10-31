import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/simple-auth';

interface User {
  id: number;
  email: string;
  name: string;
}

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
    
    // Find user by ID
    const user = findUserById(userId);
    
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