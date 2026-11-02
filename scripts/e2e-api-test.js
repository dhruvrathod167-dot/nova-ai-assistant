const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function req(method, path, { token, body, cookieJar } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookieJar?.cookie) headers.Cookie = cookieJar.cookie;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const setCookie = res.headers.getSetCookie?.() || [];
  if (cookieJar && setCookie.length) {
    cookieJar.cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  }

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json, text };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const results = [];
  const cookieJar = { cookie: '' };

  // Chat page
  {
    const res = await fetch(`${BASE}/chat`);
    results.push(['GET /chat', res.status]);
    assert(res.status === 200, `GET /chat expected 200 got ${res.status}`);
  }

  // Register (ignore conflict)
  const email = `e2e_${Date.now()}@novaai.com`;
  const password = 'test1234';
  {
    const r = await req('POST', '/api/auth/register', {
      body: { email, password, name: 'E2E' },
      cookieJar,
    });
    results.push(['POST /api/auth/register', r.status]);
    assert(r.status === 201 || r.status === 409, `register failed: ${r.status} ${JSON.stringify(r.json)}`);
  }

  // Login
  let token = null;
  {
    const r = await req('POST', '/api/auth/login', {
      body: { email, password },
      cookieJar,
    });
    results.push(['POST /api/auth/login', r.status]);
    assert(r.status === 200, `login failed: ${JSON.stringify(r.json)}`);
    token = r.json.access_token;
    assert(token, 'missing access_token');
  }

  // Me with bearer
  {
    const r = await req('GET', '/api/auth/me', { token });
    results.push(['GET /api/auth/me (bearer)', r.status]);
    assert(r.status === 200, `me bearer failed: ${JSON.stringify(r.json)}`);
    assert(r.json.email === email, 'email mismatch');
  }

  // Me with cookie only
  {
    const r = await req('GET', '/api/auth/me', { cookieJar });
    results.push(['GET /api/auth/me (cookie)', r.status]);
    assert(r.status === 200, `me cookie failed: ${JSON.stringify(r.json)}`);
  }

  // Settings
  {
    const r = await req('GET', '/api/settings', { token });
    results.push(['GET /api/settings', r.status]);
    assert(r.status === 200, `settings failed: ${JSON.stringify(r.json)}`);
    assert(r.json.model, 'settings.model missing');
  }

  // Models
  let defaultModel = null;
  {
    const r = await req('GET', '/api/settings/models', { token });
    results.push(['GET /api/settings/models', r.status]);
    assert(r.status === 200, `models failed: ${JSON.stringify(r.json)}`);
    assert(Array.isArray(r.json.models) && r.json.models.length > 0, 'models empty');
    assert(r.json.defaultModel, 'defaultModel missing');
    defaultModel = r.json.defaultModel;
    console.log('Models:', r.json.models.map((m) => `${m.name} (${m.id})`).join(', '));
    console.log('Default model:', defaultModel);
  }

  // Conversations list
  {
    const r = await req('GET', '/api/conversations', { token });
    results.push(['GET /api/conversations', r.status]);
    assert(r.status === 200, `conversations failed: ${JSON.stringify(r.json)}`);
    assert(Array.isArray(r.json), 'conversations not array');
  }

  // Create conversation
  let convId = null;
  {
    const r = await req('POST', '/api/conversations', {
      token,
      body: { title: 'E2E Chat' },
    });
    results.push(['POST /api/conversations', r.status]);
    assert(r.status === 201 || r.status === 200, `create conv failed: ${JSON.stringify(r.json)}`);
    convId = r.json.id;
    assert(typeof convId === 'string', 'conversation id missing');
    assert(typeof r.json.created_at === 'string', 'created_at not serialized');
  }

  // Chat hello
  {
    const r = await req('POST', '/api/chat', {
      token,
      body: {
        message: 'hello',
        conversation_id: convId,
        model: defaultModel,
      },
    });
    results.push(['POST /api/chat (hello)', r.status]);
    console.log('Chat hello status:', r.status);
    console.log('Chat hello preview:', String(r.json.response || r.json.error || r.json.detail || '').slice(0, 200));
    assert(r.status === 200, `chat failed: ${JSON.stringify(r.json)}`);
    assert(r.json.response && r.json.response.length > 0, 'empty AI response');
  }

  // Chat quantum
  {
    const r = await req('POST', '/api/chat', {
      token,
      body: {
        message: 'Explain quantum computing in extremely simple terms',
        conversation_id: convId,
        model: defaultModel,
      },
    });
    results.push(['POST /api/chat (quantum)', r.status]);
    console.log('Chat quantum preview:', String(r.json.response || r.json.error || '').slice(0, 200));
    assert(r.status === 200, `quantum chat failed: ${JSON.stringify(r.json)}`);
  }

  // Chat python
  {
    const r = await req('POST', '/api/chat', {
      token,
      body: {
        message: 'Write a Python hello world program',
        conversation_id: convId,
        model: defaultModel,
      },
    });
    results.push(['POST /api/chat (python)', r.status]);
    console.log('Chat python preview:', String(r.json.response || r.json.error || '').slice(0, 200));
    assert(r.status === 200, `python chat failed: ${JSON.stringify(r.json)}`);
  }

  console.log('\nRESULTS:');
  for (const [name, status] of results) {
    console.log(`  ${status}  ${name}`);
  }
  console.log('\nALL CHECKS PASSED');
}

main().catch((err) => {
  console.error('\nE2E FAILED:', err.message);
  process.exit(1);
});
