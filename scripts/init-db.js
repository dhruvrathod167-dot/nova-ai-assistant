const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    // Check if database file exists, if not create it
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
    
    if (!fs.existsSync(dbPath)) {
      console.log('Database file not found, creating new database...');
      
      // Create empty database file
      fs.closeSync(fs.openSync(dbPath, 'w'));
      
      // Connect and create tables
      await prisma.$connect();
      await prisma.$executeRaw`PRAGMA journal_mode = WAL;`;
      
      console.log('Database initialized successfully!');
    } else {
      console.log('Database already exists, checking schema...');
      
      // Connect and check if tables exist
      await prisma.$connect();
      
      try {
        const count = await prisma.category.count();
        console.log(`Database schema verified. Found ${count} categories.`);
      } catch (error) {
        console.log('Tables may not exist, running migrations...');
        
        // For SQLite, we need to push the schema
        const { execSync } = require('child_process');
        try {
          execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
          console.log('Database schema updated successfully!');
        } catch (migrationError) {
          console.error('Migration failed:', migrationError);
        }
      }
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();