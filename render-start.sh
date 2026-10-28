#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log(`Starting MAISON E-Commerce server on ${HOST}:${PORT}`);

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

// Wait for database to be ready if using PostgreSQL
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
  console.log('Waiting for PostgreSQL database to be ready...');
  
  const waitDb = spawn('python', ['-c', `import psycopg2; psycopg2.connect('${process.env.DATABASE_URL}')`], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  waitDb.on('exit', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.log('Database is unavailable - starting server anyway...');
      startServer();
    }
  });
} else {
  startServer();
}

function startServer() {
  // Start the Next.js server
  const serverProcess = spawn('node', [serverPath], {
    env: { 
      ...process.env, 
      PORT: PORT,
      HOST: HOST,
      NODE_ENV: 'production'
    },
    stdio: 'inherit',
    cwd: __dirname
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