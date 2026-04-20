#!/usr/bin/env node

/**
 * Silent Guardian Migration Runner
 * Usage:
 *   node scripts/migrate.js create <name>          - Create a new migration file
 *   node scripts/migrate.js up                     - Run all pending migrations
 *   node scripts/migrate.js down                   - Rollback the last migration
 *   node scripts/migrate.js status                 - Show migration status
 *   node scripts/migrate.js help                   - Show this help
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, '../src/migrations');
const COLLECTION_NAME = 'migrations';

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// MongoDB connection
let db;
let migrationCollection;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  db = mongoose.connection.db;
  migrationCollection = db.collection(COLLECTION_NAME);
  // Ensure index on migration name
  await migrationCollection.createIndex({ name: 1 }, { unique: true });
  console.log('✅ Connected to MongoDB');
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
};

// Get all applied migrations (sorted by name)
const getAppliedMigrations = async () => {
  const cursor = migrationCollection.find({}).sort({ name: 1 });
  return await cursor.toArray();
};

// Get all migration files from disk (sorted by name)
const getMigrationFiles = () => {
  const files = fs.readdirSync(MIGRATIONS_DIR);
  return files
    .filter(f => f.endsWith('.js') && !f.startsWith('_'))
    .sort();
};

// Load a migration module
const loadMigration = (fileName) => {
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
};

// Run a single migration (up)
const runMigrationUp = async (fileName) => {
  const migration = loadMigration(fileName);
  if (!migration.up) {
    throw new Error(`Migration ${fileName} does not export an 'up' function`);
  }
  console.log(`⏫ Running up: ${fileName}`);
  await migration.up(db, mongoose);
  await migrationCollection.insertOne({ name: fileName, appliedAt: new Date() });
  console.log(`✅ Applied: ${fileName}`);
};

// Rollback a single migration (down)
const runMigrationDown = async (fileName) => {
  const migration = loadMigration(fileName);
  if (!migration.down) {
    throw new Error(`Migration ${fileName} does not export a 'down' function`);
  }
  console.log(`🔻 Running down: ${fileName}`);
  await migration.down(db, mongoose);
  await migrationCollection.deleteOne({ name: fileName });
  console.log(`✅ Rolled back: ${fileName}`);
};

// Create a new migration file
const createMigration = async (name) => {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const fileName = `${timestamp}_${name}.js`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  async up(db, mongoose) {
    // Write your migration logic here
    // Example: await db.collection('users').updateMany({}, { $set: { newField: true } });
  },

  async down(db, mongoose) {
    // Rollback logic (optional but recommended)
    // Example: await db.collection('users').updateMany({}, { $unset: { newField: "" } });
  }
};
`;
  fs.writeFileSync(filePath, template);
  console.log(`✅ Created migration: ${fileName}`);
};

// Run pending migrations
const runUp = async () => {
  const applied = await getAppliedMigrations();
  const appliedNames = applied.map(m => m.name);
  const files = getMigrationFiles();
  const pending = files.filter(f => !appliedNames.includes(f));

  if (pending.length === 0) {
    console.log('✅ No pending migrations');
    return;
  }

  console.log(`📦 Found ${pending.length} pending migration(s):`);
  pending.forEach(f => console.log(`   - ${f}`));

  for (const file of pending) {
    await runMigrationUp(file);
  }
  console.log('🎉 All migrations applied successfully');
};

// Rollback the last migration
const runDown = async () => {
  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    console.log('ℹ️ No migrations to rollback');
    return;
  }
  const last = applied[applied.length - 1];
  console.log(`🔻 Rolling back: ${last.name}`);
  await runMigrationDown(last.name);
};

// Show migration status
const showStatus = async () => {
  const applied = await getAppliedMigrations();
  const appliedNames = applied.map(m => m.name);
  const files = getMigrationFiles();

  console.log('\n📋 Migration Status:\n');
  console.log('Applied Migrations:');
  if (applied.length === 0) {
    console.log('   (none)');
  } else {
    applied.forEach(m => {
      console.log(`   ✅ ${m.name} (applied at ${m.appliedAt})`);
    });
  }

  console.log('\nPending Migrations:');
  const pending = files.filter(f => !appliedNames.includes(f));
  if (pending.length === 0) {
    console.log('   (none)');
  } else {
    pending.forEach(f => console.log(`   ⏳ ${f}`));
  }
  console.log('');
};

// Help
const showHelp = () => {
  console.log(`
Silent Guardian Migration Tool

Usage:
  node scripts/migrate.js create <name>   - Create a new migration file
  node scripts/migrate.js up              - Run all pending migrations
  node scripts/migrate.js down            - Rollback the last migration
  node scripts/migrate.js status          - Show migration status
  node scripts/migrate.js help            - Show this help

Examples:
  node scripts/migrate.js create add_user_kyc_fields
  node scripts/migrate.js up
  node scripts/migrate.js down
  node scripts/migrate.js status
`);
};

// Main CLI
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    showHelp();
    process.exit(0);
  }

  try {
    await connectDB();

    switch (command) {
      case 'create':
        if (!args[1]) {
          console.error('❌ Please provide a migration name');
          showHelp();
          process.exit(1);
        }
        await createMigration(args[1]);
        break;

      case 'up':
        await runUp();
        break;

      case 'down':
        await runDown();
        break;

      case 'status':
        await showStatus();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

main();