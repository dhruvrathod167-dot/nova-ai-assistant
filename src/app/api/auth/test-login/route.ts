import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test login request received');
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Test login attempt with email:', email);

    // Simple hardcoded test
    if (email === 'user@novaai.com' && password === 'user123') {
      const token = `demo_token_${Date.now()}`;
      console.log('Test login successful');
      return NextResponse.json({ 
        access_token: token, 
        token_type: 'bearer' 
      });
    }

    console.log('Test login failed - invalid credentials');
    return NextResponse.json(
      { detail: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}