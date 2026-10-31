import { NextRequest, NextResponse } from 'next/server';

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
    console.log('Token parts:', tokenParts);
    
    if (tokenParts.length < 3) {
      return NextResponse.json(
        { detail: 'Invalid token format' },
        { status: 401 }
      );
    }

    const userId = parseInt(tokenParts[1]);
    console.log('User ID:', userId);
    
    // For demo purposes, return hardcoded user data
    const user = {
      id: userId,
      email: 'user@novaai.com',
      name: 'Demo User'
    };
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}