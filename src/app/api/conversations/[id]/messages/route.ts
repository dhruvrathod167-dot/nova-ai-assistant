import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

function serializeMessage(message: {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  citations: string | null;
  createdAt: Date;
  userEdited: boolean;
}) {
  let citations: unknown[] = [];
  if (message.citations) {
    try {
      const parsed = JSON.parse(message.citations);
      citations = Array.isArray(parsed) ? parsed : [];
    } catch {
      citations = [];
    }
  }

  return {
    id: message.id,
    conversation_id: message.conversationId,
    sender: message.sender === 'assistant' ? 'assistant' : 'user',
    content: message.content,
    created_at: message.createdAt.toISOString(),
    user_edited: message.userEdited,
    citations,
  };
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
    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!conversation) {
      return NextResponse.json({ detail: 'Not found' }, { status: 404 });
    }

    const messages = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages.map(serializeMessage));
  } catch (error) {
    console.error('List messages error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
