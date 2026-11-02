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

async function getOwnedConversation(id: string, userId: string) {
  return db.conversation.findFirst({
    where: { id, userId },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getOwnedConversation(id, user.id);
    if (!conversation) {
      return NextResponse.json({ detail: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(serializeConversation(conversation));
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getOwnedConversation(id, user.id);
    if (!conversation) {
      return NextResponse.json({ detail: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : conversation.title;

    const updated = await db.conversation.update({
      where: { id: conversation.id },
      data: { title },
    });

    return NextResponse.json(serializeConversation(updated));
  } catch (error) {
    console.error('Rename conversation error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getOwnedConversation(id, user.id);
    if (!conversation) {
      return NextResponse.json({ detail: 'Not found' }, { status: 404 });
    }

    await db.conversation.delete({ where: { id: conversation.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
