import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

function serializeConversation(conversation: {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: conversation.id,
    user_id: conversation.userId,
    title: conversation.title,
    created_at: conversation.createdAt.toISOString(),
    updated_at: conversation.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations.map(serializeConversation));
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : 'New Chat';

    const conversation = await db.conversation.create({
      data: {
        title,
        userId: user.id,
      },
    });

    return NextResponse.json(serializeConversation(conversation), {
      status: 201,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
