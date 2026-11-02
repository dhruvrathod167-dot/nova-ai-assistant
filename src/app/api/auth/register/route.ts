import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  createAuthToken,
  serializeUser,
} from '@/lib/auth';
import { getDefaultModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { detail: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { detail: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        passwordHash: password,
        settings: {
          create: {
            aiProvider: 'openrouter',
            aiModel: getDefaultModel(),
            temperature: 0.7,
            maxTokens: 1000,
            systemPrompt:
              'You are NOVA AI, a professional general-purpose AI assistant. Answer clearly, explain technical topics accurately, write and debug code, summarize documents, and follow user instructions. Admit uncertainty instead of inventing facts.',
          },
        },
      },
    });

    const token = createAuthToken(user.id);
    const payload = {
      access_token: token,
      token_type: 'bearer',
      user: serializeUser(user),
    };

    const response = NextResponse.json(payload, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
