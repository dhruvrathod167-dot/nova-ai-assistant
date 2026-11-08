#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

console.log(`Starting NOVA AI server on ${HOST}:${PORT}`);

// Check if the standalone server exists
const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('Error: Standalone server not found at:', serverPath);
  console.error('Please run "npm run build" first to create the standalone build.');
  process.exit(1);
}

// Generate Prisma client if needed
if (!fs.existsSync(path.join(__dirname, 'node_modules/@prisma/client'))) {
  console.log('Generating Prisma client...');
  const prismaProcess = spawn('npx', ['prisma', 'generate'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  prismaProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error('Prisma client generation failed with code:', code);
      process.exit(code);
    }
  });
}

// Set the correct database path for standalone build
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const prodDbPath = path.join(__dirname, 'var', 'data', 'nova.db');

// Use production database path if available, otherwise use local
if (fs.existsSync(prodDbPath)) {
  process.env.DATABASE_URL = `file:${prodDbPath}`;
  console.log(`Using production database at: ${prodDbPath}`);
} else if (fs.existsSync(dbPath)) {
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log(`Using local database at: ${dbPath}`);
} else {
  // Create database directory and file if they don't exist
  const dbDir = path.join(__dirname, 'var', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  fs.writeFileSync(prodDbPath, '');
  process.env.DATABASE_URL = `file:${prodDbPath}`;
  console.log(`Created new database at: ${prodDbPath}`);
}

// Start the server directly without waiting for database
startServer();

function startServer() {
  // Start the Next.js server
  const serverProcess = spawn('node', [serverPath], {
    env: { 
      ...process.env, 
      PORT: PORT,
      HOSTNAME: HOST,
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL || `file:${prodDbPath}`
    },
    stdio: 'inherit',
    cwd: path.join(__dirname, '.next', 'standalone')
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
    }
    process.exit(code);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}