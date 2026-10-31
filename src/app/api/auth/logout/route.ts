import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In a real application, you might want to blacklist the token
    // For this demo, we'll just return a success response
    return NextResponse.json({ 
      detail: 'Logout successful',
      message: 'Token has been invalidated. Please clear the token from client storage.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}