import { db } from '@/lib/db';

let ensurePromise: Promise<void> | null = null;

/**
 * Ensure NOVA AI auth/chat tables exist (SQLite).
 * Safe to call on every request — runs once per process.
 */
export function ensureDb(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL,
          "name" TEXT,
          "passwordHash" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`
      );
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Conversation" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Message" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "conversationId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "sender" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "citations" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "userEdited" BOOLEAN NOT NULL DEFAULT false,
          CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserSettings" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "systemPrompt" TEXT DEFAULT 'You are NOVA AI, a professional general-purpose AI assistant. Answer clearly, explain technical topics accurately, write and debug code, summarize documents, and follow user instructions. Admit uncertainty instead of inventing facts.',
          "temperature" REAL DEFAULT 0.7,
          "maxTokens" INTEGER DEFAULT 1000,
          "aiProvider" TEXT DEFAULT 'openrouter',
          "aiModel" TEXT DEFAULT 'openai/gpt-4o-mini',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_userId_key" ON "UserSettings"("userId");`
      );
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}
