import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getDefaultModel, isValidModel } from '@/lib/models';
import { ensureDb } from '@/lib/ensure-db';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callOpenRouterAI(
  messages: OpenRouterMessage[],
  model: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer':
            process.env.NEXTAUTH_URL ||
            'https://nova-ai-assistant-3.onrender.com',
          'X-Title': 'NOVA AI',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const rawText = await response.text();
    // Never log the API key or Authorization header — status only.
    console.log('OpenRouter status:', response.status, 'model:', model);

    if (!response.ok) {
      throw new Error(`OpenRouter status: ${response.status}`);
    }

    let data: {
      choices?: Array<{ message?: { content?: string } }>;
    };
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`OpenRouter status: ${response.status} (invalid JSON)`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`OpenRouter status: ${response.status} (empty content)`);
    }

    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenRouter request timed out');
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { detail: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const conversationId =
      typeof body.conversation_id === 'string'
        ? body.conversation_id
        : typeof body.conversationId === 'string'
          ? body.conversationId
          : null;
    const requestedModel =
      typeof body.model === 'string' ? body.model.trim() : null;

    if (!message) {
      return NextResponse.json(
        { detail: 'Message is required' },
        { status: 400 }
      );
    }

    let settings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });
    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          userId: user.id,
          aiProvider: 'openrouter',
          aiModel: getDefaultModel(),
          temperature: 0.7,
          maxTokens: 1000,
        },
      });
    }

    const selectedModel =
      (requestedModel && isValidModel(requestedModel) && requestedModel) ||
      (settings.aiModel && isValidModel(settings.aiModel) && settings.aiModel) ||
      getDefaultModel();

    const systemPrompt =
      settings.systemPrompt ||
      'You are NOVA AI, a professional general-purpose AI assistant. Answer clearly, explain technical topics accurately, write and debug code, summarize documents, and follow user instructions. Admit uncertainty instead of inventing facts.';

    let conversation = null;
    if (conversationId) {
      conversation = await db.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
      });
    }

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          title:
            message.length > 30 ? `${message.substring(0, 27)}...` : message,
          userId: user.id,
        },
      });
    }

    const priorMessages = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const openRouterMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...priorMessages.map((m) => ({
        role: (m.sender === 'assistant' ? 'assistant' : 'user') as
          | 'assistant'
          | 'user',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('Processing chat message:', {
      conversationId: conversation.id,
      userId: user.id,
      model: selectedModel,
    });

    const aiResponse = await callOpenRouterAI(
      openRouterMessages,
      selectedModel,
      settings.temperature ?? 0.7,
      settings.maxTokens ?? 1000
    );

    await db.message.create({
      data: {
        conversationId: conversation.id,
        userId: user.id,
        sender: 'user',
        content: message,
      },
    });

    const aiMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        userId: user.id,
        sender: 'assistant',
        content: aiResponse,
      },
    });

    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      status: 'done',
      response: aiResponse,
      content: aiResponse,
      message: aiResponse,
      id: aiMessage.id,
      message_id: aiMessage.id,
      conversation_id: conversation.id,
      model: selectedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        status: 'error',
        error: errorMessage,
        detail: errorMessage,
        content: `⚠️ **Error:** ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
