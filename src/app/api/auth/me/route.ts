import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, serializeUser } from '@/lib/auth';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { detail: 'Missing or invalid authorization' },
        { status: 401 }
      );
    }

    return NextResponse.json(serializeUser(user));
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
