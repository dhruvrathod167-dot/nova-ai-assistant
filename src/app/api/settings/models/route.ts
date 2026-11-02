import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAvailableModels, getDefaultModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const models = getAvailableModels().map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      description: m.description,
      category: m.category,
      is_free: m.is_free,
      supports_images: m.supports_images,
    }));

    return NextResponse.json({
      models,
      defaultModel: getDefaultModel(),
    });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
