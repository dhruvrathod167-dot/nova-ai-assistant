import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const AUTH_COOKIE_NAME = 'nova_auth_token';

/** Token format: nova_token_<userId>_<timestamp> */
export function createAuthToken(userId: string): string {
  return `nova_token_${userId}_${Date.now()}`;
}

export function parseUserIdFromToken(token: string): string | null {
  if (!token || !token.startsWith('nova_token_')) {
    return null;
  }

  const parts = token.split('_');
  // ['nova', 'token', '<userId>', '<timestamp>'] — userId may itself contain underscores
  if (parts.length < 4) {
    return null;
  }

  const userId = parts.slice(2, -1).join('_');
  return userId || null;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7).trim() || null;
  }

  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return cookieToken?.trim() || null;
}

export async function getUserFromRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const userId = parseUserIdFromToken(token);
  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return user;
}

export function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  createdAt?: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    is_active: true,
    created_at: user.createdAt ? user.createdAt.toISOString() : undefined,
  };
}

export function authCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
