#!/usr/bin/env node

/**
 * Silent Guardian Database Backup Script
 * Usage: node scripts/backup.js
 *
 * Environment variables (optional, with defaults):
 *   MONGODB_URI          - MongoDB connection string (required)
 *   BACKUP_PATH          - Directory to store backups (default: ./backups)
 *   BACKUP_RETENTION_DAYS- Delete backups older than this many days (default: 7)
 *   BACKUP_COMPRESS      - Use gzip compression (default: true)
 *   AWS_ACCESS_KEY_ID    - AWS S3 access key (optional, enables S3 upload)
 *   AWS_SECRET_ACCESS_KEY- AWS secret key
 *   AWS_REGION           - S3 region (default: us-east-1)
 *   S3_BUCKET            - S3 bucket name (required if AWS keys provided)
 *   LOG_LEVEL            - Log level (debug, info, warn, error, default: info)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { Transform } = require('stream');
require('dotenv').config();

const execPromise = util.promisify(exec);

// ==================== Configuration ====================
const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_PATH = process.env.BACKUP_PATH || './backups';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
const COMPRESS = process.env.BACKUP_COMPRESS !== 'false';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FILE = path.join(BACKUP_PATH, 'backup.log');

// AWS S3 configuration (optional)
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET;
const ENABLE_S3 = !!(AWS_ACCESS_KEY && AWS_SECRET_KEY && S3_BUCKET);

// ==================== Logger ====================
const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = logLevels[LOG_LEVEL] ?? 1;

const log = (level, message, meta = {}) => {
  if (logLevels[level] < currentLevel) return;
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  console.log(logEntry);
  // Also write to log file
  if (!fs.existsSync(BACKUP_PATH)) fs.mkdirSync(BACKUP_PATH, { recursive: true });
  fs.appendFileSync(LOG_FILE, logEntry + '\n');
};

// ==================== Utility Functions ====================
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log('debug', `Created directory: ${dir}`);
  }
};

const getBackupFileName = () => {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const extension = COMPRESS ? 'gz' : 'archive';
  return `backup_${timestamp}.${extension}`;
};

const deleteOldBackups = () => {
  const files = fs.readdirSync(BACKUP_PATH);
  const now = Date.now();
  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(BACKUP_PATH, file);
    const stats = fs.statSync(filePath);
    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > RETENTION_DAYS && file.startsWith('backup_')) {
      fs.unlinkSync(filePath);
      deletedCount++;
      log('debug', `Deleted old backup: ${file}`);
    }
  }
  if (deletedCount) {
    log('info', `Deleted ${deletedCount} backup(s) older than ${RETENTION_DAYS} days`);
  }
};

// ==================== Backup Functions ====================
const createBackupLocally = async () => {
  ensureDir(BACKUP_PATH);
  const fileName = getBackupFileName();
  const backupFile = path.join(BACKUP_PATH, fileName);

  let command;
  if (COMPRESS) {
    command = `mongodump --uri="${MONGODB_URI}" --archive="${backupFile}" --gzip`;
  } else {
    command = `mongodump --uri="${MONGODB_URI}" --archive="${backupFile}"`;
  }

  log('info', `Starting backup to ${backupFile} (compress=${COMPRESS})`);
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) log('warn', `mongodump stderr: ${stderr}`);
    log('info', `Backup completed: ${backupFile} (${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB)`);
    return backupFile;
  } catch (error) {
    log('error', `Backup failed: ${error.message}`);
    throw error;
  }
};

// Optional: Upload to S3
const uploadToS3 = async (filePath) => {
  if (!ENABLE_S3) {
    log('debug', 'S3 upload not configured – skipping');
    return;
  }

  // Dynamically import AWS SDK v3 to avoid bundling if not used
  let S3Client, PutObjectCommand;
  try {
    const aws = await import('@aws-sdk/client-s3');
    S3Client = aws.S3Client;
    PutObjectCommand = aws.PutObjectCommand;
  } catch (err) {
    log('error', 'AWS SDK not installed. Run: npm install @aws-sdk/client-s3');
    return;
  }

  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY }
  });

  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: S3_BUCKET,
    Key: `backups/${fileName}`,
    Body: fileContent,
    ContentType: 'application/octet-stream'
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    log('info', `Uploaded to S3: s3://${S3_BUCKET}/backups/${fileName}`);
  } catch (error) {
    log('error', `S3 upload failed: ${error.message}`);
  }
};

// ==================== Main ====================
const main = async () => {
  if (!MONGODB_URI) {
    log('error', 'MONGODB_URI environment variable not set');
    process.exit(1);
  }

  log('info', '=== Database Backup Started ===');

  try {
    const backupFile = await createBackupLocally();
    if (ENABLE_S3) await uploadToS3(backupFile);
    deleteOldBackups();
    log('info', '=== Backup Completed Successfully ===');
    process.exit(0);
  } catch (error) {
    log('error', 'Backup process failed', { error: error.message });
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createBackupLocally, deleteOldBackups, uploadToS3 };