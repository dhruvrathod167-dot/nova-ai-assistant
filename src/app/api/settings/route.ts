import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getDefaultModel } from '@/lib/models';
import { ensureDb } from '@/lib/ensure-db';

function serializeSettings(
  settings: {
    aiProvider: string | null;
    aiModel: string | null;
    temperature: number | null;
    maxTokens: number | null;
    systemPrompt: string | null;
  },
  user: { id: string; email: string },
  theme: 'dark' | 'light' = 'dark'
) {
  return {
    success: true,
    theme,
    provider: (settings.aiProvider === 'ollama' ? 'ollama' : 'openai') as
      | 'ollama'
      | 'openai',
    model: settings.aiModel || getDefaultModel(),
    temperature: settings.temperature ?? 0.7,
    max_tokens: settings.maxTokens ?? 1000,
    system_prompt: settings.systemPrompt,
    email: user.email,
    user_id: user.id,
    settings: {
      theme,
      provider: settings.aiProvider || 'openrouter',
      model: settings.aiModel || getDefaultModel(),
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens ?? 1000,
      system_prompt: settings.systemPrompt,
    },
  };
}

async function getOrCreateSettings(userId: string) {
  let settings = await db.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await db.userSettings.create({
      data: {
        userId,
        aiProvider: 'openrouter',
        aiModel: getDefaultModel(),
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt:
          'You are NOVA AI, a professional general-purpose AI assistant. Answer clearly, explain technical topics accurately, write and debug code, summarize documents, and follow user instructions. Admit uncertainty instead of inventing facts.',
      },
    });
  }
  return settings;
}

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getOrCreateSettings(user.id);
    return NextResponse.json(serializeSettings(settings, user));
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureDb();
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const settings = await getOrCreateSettings(user.id);

    const updated = await db.userSettings.update({
      where: { id: settings.id },
      data: {
        aiProvider:
          body.provider === 'ollama'
            ? 'ollama'
            : body.provider === 'openai' || body.provider === 'openrouter'
              ? 'openrouter'
              : undefined,
        aiModel: typeof body.model === 'string' ? body.model : undefined,
        temperature:
          typeof body.temperature === 'number' ? body.temperature : undefined,
        maxTokens:
          typeof body.max_tokens === 'number'
            ? body.max_tokens
            : typeof body.maxTokens === 'number'
              ? body.maxTokens
              : undefined,
        systemPrompt:
          typeof body.system_prompt === 'string'
            ? body.system_prompt
            : typeof body.systemPrompt === 'string'
              ? body.systemPrompt
              : undefined,
      },
    });

    const theme =
      body.theme === 'light' || body.theme === 'dark' ? body.theme : 'dark';

    return NextResponse.json(serializeSettings(updated, user, theme));
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
