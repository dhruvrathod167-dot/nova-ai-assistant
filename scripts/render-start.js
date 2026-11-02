#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = process.env.PORT || '10000';
const host = process.env.HOSTNAME || '0.0.0.0';

const fallbackDbDir = fs.existsSync('/var/data')
  ? '/var/data'
  : path.join(root, 'prisma');
if (!fs.existsSync(fallbackDbDir)) {
  fs.mkdirSync(fallbackDbDir, { recursive: true });
}
const fallbackDbFile = path.join(fallbackDbDir, 'nova.db');

process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${fallbackDbFile}`;
if (process.env.DATABASE_URL.startsWith('file:./') || process.env.DATABASE_URL.startsWith('file:prisma/')) {
  const relative = process.env.DATABASE_URL.replace(/^file:\.?\/?/, '');
  process.env.DATABASE_URL = `file:${path.join(root, relative)}`;
}

const dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
const dbParent = path.dirname(dbPath);
if (!fs.existsSync(dbParent)) {
  fs.mkdirSync(dbParent, { recursive: true });
}

console.log('[render-start] DATABASE_URL=', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***@'));
console.log('[render-start] Ensuring Prisma schema is applied...');

const push = spawnSync(
  'npx',
  ['prisma', 'db', 'push', '--accept-data-loss', '--skip-generate'],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

if (push.status !== 0) {
  console.error('[render-start] prisma db push failed with code', push.status);
  process.exit(push.status || 1);
}

const serverPath = path.join(root, '.next', 'standalone', 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('[render-start] Missing standalone server at', serverPath);
  process.exit(1);
}

// Ensure standalone can resolve prisma client / static assets
const standaloneDir = path.join(root, '.next', 'standalone');
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(root, 'public');
const publicDest = path.join(standaloneDir, 'public');

function copyIfMissing(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) return;
  fs.cpSync(src, dest, { recursive: true });
}

copyIfMissing(staticSrc, staticDest);
copyIfMissing(publicSrc, publicDest);

console.log(`[render-start] Starting server on ${host}:${port}`);
const child = spawn('node', [serverPath], {
  cwd: standaloneDir,
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: host,
    NODE_ENV: 'production',
  },
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code || 0));
