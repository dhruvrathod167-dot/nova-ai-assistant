/**
 * Configured OpenRouter models for NOVA AI.
 * Keep in sync with the project's configured OpenRouter model IDs — do not invent IDs.
 */

export type OpenRouterModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: string;
  is_free: boolean;
  supports_images: boolean;
};

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenRouter',
    description: "OpenAI's efficient model",
    category: 'general',
    is_free: false,
    supports_images: false,
  },
];

export const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';

export function getAvailableModels(): OpenRouterModel[] {
  const models = [...OPENROUTER_MODELS];
  const envModel = process.env.OPENROUTER_MODEL?.trim();

  if (envModel && !models.some((m) => m.id === envModel)) {
    models.unshift({
      id: envModel,
      name: envModel,
      provider: 'OpenRouter',
      description: 'Configured via OPENROUTER_MODEL',
      category: 'general',
      is_free: envModel.endsWith(':free'),
      supports_images: false,
    });
  }

  return models;
}

export function getDefaultModel(): string {
  const models = getAvailableModels();
  if (models.some((m) => m.id === DEFAULT_MODEL)) {
    return DEFAULT_MODEL;
  }
  return models[0]?.id || 'openai/gpt-4o-mini';
}

export function getModelById(modelId: string): OpenRouterModel | undefined {
  return getAvailableModels().find((m) => m.id === modelId);
}

export function isValidModel(modelId: string): boolean {
  return Boolean(getModelById(modelId));
}

export function getModelDisplayName(modelId: string): string {
  return getModelById(modelId)?.name || modelId;
}
