/**
 * Local OpenRouter + NOVA AI verification.
 * Reads OPENROUTER_API_KEY from process env / .env.local via Next server — never prints the key.
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

function loadEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function req(method, pathName, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${pathName}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

async function main() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  console.log('OPENROUTER_API_KEY configured:', Boolean(key && key.startsWith('sk-or-')));
  console.log('OPENROUTER_MODEL:', process.env.OPENROUTER_MODEL || '(default)');

  // Direct OpenRouter model catalog check (no key leakage)
  if (key) {
    const modelsRes = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    console.log('OpenRouter /models status:', modelsRes.status);
    assert(modelsRes.status === 200, 'OpenRouter models list failed');
    const modelsJson = await modelsRes.json();
    const ids = (modelsJson.data || []).map((m) => m.id);
    const hasGpt4oMini = ids.includes('openai/gpt-4o-mini');
    console.log('openai/gpt-4o-mini available on OpenRouter:', hasGpt4oMini);
    assert(hasGpt4oMini, 'openai/gpt-4o-mini is not in OpenRouter catalog');
  }

  const email = `or_${Date.now()}@novaai.com`;
  const password = 'test1234';
  const reg = await req('POST', '/api/auth/register', {
    body: { email, password, name: 'OR' },
  });
  console.log('register', reg.status);
  assert(reg.status === 201 || reg.status === 409, 'register failed');

  const login = await req('POST', '/api/auth/login', {
    body: { email, password },
  });
  console.log('login', login.status);
  assert(login.status === 200, `login failed: ${JSON.stringify(login.json)}`);
  const token = login.json.access_token;

  const models = await req('GET', '/api/settings/models', { token });
  console.log('settings/models', models.status, models.json?.defaultModel);
  assert(models.status === 200, 'models endpoint failed');
  assert(
    models.json.models?.some((m) => m.id === 'openai/gpt-4o-mini'),
    'GPT-4o Mini missing from selector models'
  );

  const prompts = [
    'hello',
    'Explain quantum computing in extremely simple terms',
    'Write a Python hello world program',
  ];

  for (const message of prompts) {
    const chat = await req('POST', '/api/chat', {
      token,
      body: { message, model: 'openai/gpt-4o-mini' },
    });
    const preview = String(
      chat.json.response || chat.json.error || chat.json.detail || ''
    ).slice(0, 180);
    console.log(`chat[${message.slice(0, 24)}]`, chat.status, preview);
    assert(chat.status === 200, `chat failed for "${message}": ${preview}`);
    assert(chat.json.response?.length > 0, `empty response for "${message}"`);
    assert(
      !String(chat.json.response).includes('OpenRouter API key is not configured'),
      'API key missing error in response'
    );
    assert(
      !String(chat.json.response).includes('Connection ended'),
      'connection ended error'
    );
  }

  console.log('\nOPENROUTER VERIFICATION PASSED');
}

main().catch((e) => {
  console.error('\nFAILED:', e.message);
  process.exit(1);
});
