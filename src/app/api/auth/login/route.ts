import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  createAuthToken,
  serializeUser,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user || user.passwordHash !== password) {
      return NextResponse.json(
        { detail: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = createAuthToken(user.id);
    const payload = {
      access_token: token,
      token_type: 'bearer',
      user: serializeUser(user),
    };

    const response = NextResponse.json(payload);
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
