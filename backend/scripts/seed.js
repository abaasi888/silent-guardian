#!/usr/bin/env node

/**
 * Silent Guardian Database Seeder
 * Usage: node scripts/seed.js [--clear] [--demo]
 *
 * Options:
 *   --clear   - Drop all existing data before seeding (use with caution!)
 *   --demo    - Also create demo user, devices, and sample locations
 *
 * Environment variables:
 *   MONGODB_URI          - MongoDB connection string (required)
 *   ADMIN_EMAIL          - Admin email (default: admin@silentguardian.com)
 *   ADMIN_PASSWORD       - Admin password (default: Admin123!)
 *   ADMIN_FULLNAME       - Admin full name (default: System Administrator)
 *   ADMIN_PHONE          - Admin phone (default: +1234567890)
 *   DEMO_USER_EMAIL      - Demo user email (default: demo@silentguardian.com)
 *   DEMO_USER_PASSWORD   - Demo user password (default: Demo123!)
 *   NODE_ENV             - If 'test', skips seeding (unless forced)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const Device = require('../src/models/Device');
const Location = require('../src/models/Location');
const Alert = require('../src/models/Alert');
const Payment = require('../src/models/Payment');

// Constants
const { SUBSCRIPTION_PLANS } = require('../src/config/constants');

// ==================== Configuration ====================
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@silentguardian.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_FULLNAME = process.env.ADMIN_FULLNAME || 'System Administrator';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+1234567890';

const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@silentguardian.com';
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Demo123!';

const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const shouldSeedDemo = args.includes('--demo');

// Skip seeding in test environment unless forced
if (process.env.NODE_ENV === 'test' && !args.includes('--force')) {
  console.log('ℹ️ NODE_ENV=test, skipping seed. Use --force to override.');
  process.exit(0);
}

// ==================== Logger ====================
const log = {
  info: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  step: (msg) => console.log(`\n📌 ${msg}`)
};

// ==================== Database Helpers ====================
const connectDB = async () => {
  if (!MONGODB_URI) {
    log.error('MONGODB_URI environment variable not set');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  log.info('Connected to MongoDB');
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  log.info('Disconnected from MongoDB');
};

const clearDatabase = async () => {
  log.warn('Clearing all data...');
  await User.deleteMany({});
  await Subscription.deleteMany({});
  await Device.deleteMany({});
  await Location.deleteMany({});
  await Alert.deleteMany({});
  await Payment.deleteMany({});
  log.info('Database cleared');
};

// ==================== Seed Functions ====================
const seedAdminUser = async () => {
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    log.info(`Admin user already exists (${ADMIN_EMAIL})`);
    return existing;
  }

  const admin = new User({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    fullName: ADMIN_FULLNAME,
    phone: ADMIN_PHONE,
    role: 'admin',
    isEmailVerified: true,
    kycStatus: 'approved'
  });
  await admin.save();
  log.info(`Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  return admin;
};

const seedSubscriptionPlans = async () => {
  let createdCount = 0;
  for (const [planId, planData] of Object.entries(SUBSCRIPTION_PLANS)) {
    const existing = await Subscription.findOne({ planId: planId.toLowerCase() });
    if (!existing) {
      // Subscriptions are per-user, so we don't seed global plans.
      // Instead, we ensure the plan definitions exist in constants.
      // This function is a placeholder for any future global plan collection.
      log.info(`Plan definition available: ${planId}`);
      createdCount++;
    }
  }
  if (createdCount === 0) {
    log.info('All subscription plans already defined');
  }
};

const seedDemoUser = async () => {
  if (!shouldSeedDemo) return null;

  const existing = await User.findOne({ email: DEMO_USER_EMAIL });
  if (existing) {
    log.info(`Demo user already exists (${DEMO_USER_EMAIL})`);
    return existing;
  }

  const demo = new User({
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    fullName: 'Demo User',
    phone: '+1987654321',
    role: 'user',
    isEmailVerified: true,
    kycStatus: 'approved'
  });
  await demo.save();
  log.info(`Demo user created: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);
  return demo;
};

const seedDemoDevices = async (demoUser) => {
  if (!shouldSeedDemo || !demoUser) return;

  const deviceNames = ['My Phone', 'Car Tracker', 'Laptop'];
  for (const name of deviceNames) {
    const existing = await Device.findOne({ deviceName: name, userId: demoUser._id });
    if (!existing) {
      const deviceId = `DEMO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const device = new Device({
        userId: demoUser._id,
        deviceName: name,
        deviceId,
        status: 'active',
        stealthMode: name === 'Laptop' ? true : false,
        hardwareInfo: { manufacturer: 'Demo Corp', model: `${name} Model`, os: 'DemoOS' },
        lastSeen: new Date()
      });
      await device.save();
      log.info(`Demo device created: ${name} (${deviceId})`);
    }
  }
};

const seedDemoLocations = async (demoUser) => {
  if (!shouldSeedDemo || !demoUser) return;

  const devices = await Device.find({ userId: demoUser._id });
  if (devices.length === 0) return;

  // Sample locations around New York City
  const samplePoints = [
    { lat: 40.7128, lng: -74.0060, accuracy: 10 }, // Times Square
    { lat: 40.7580, lng: -73.9855, accuracy: 8 },  // Rockefeller Center
    { lat: 40.6892, lng: -74.0445, accuracy: 12 }, // Statue of Liberty
    { lat: 40.7489, lng: -73.9680, accuracy: 9 },  // Empire State Building
    { lat: 40.7829, lng: -73.9654, accuracy: 7 }    // Central Park
  ];

  for (const device of devices) {
    for (let i = 0; i < samplePoints.length; i++) {
      const point = samplePoints[i];
      const timestamp = new Date(Date.now() - (samplePoints.length - i) * 3600000); // older to newer
      const existing = await Location.findOne({
        deviceId: device.deviceId,
        timestamp: { $gte: new Date(timestamp - 60000), $lte: new Date(timestamp + 60000) }
      });
      if (!existing) {
        const location = new Location({
          deviceId: device.deviceId,
          userId: demoUser._id,
          lat: point.lat,
          lng: point.lng,
          accuracy: point.accuracy,
          speed: Math.random() * 30,
          heading: Math.random() * 360,
          timestamp,
          isOffline: false
        });
        await location.save();
      }
    }
    // Update device last location
    const lastPoint = samplePoints[samplePoints.length - 1];
    await Device.findByIdAndUpdate(device._id, {
      lastLocation: {
        lat: lastPoint.lat,
        lng: lastPoint.lng,
        accuracy: lastPoint.accuracy,
        timestamp: new Date()
      },
      lastSeen: new Date()
    });
    log.info(`Demo locations seeded for device ${device.deviceName}`);
  }
};

// ==================== Main ====================
const seed = async () => {
  try {
    log.step('Connecting to database...');
    await connectDB();

    if (shouldClear) {
      await clearDatabase();
    }

    log.step('Seeding admin user...');
    const admin = await seedAdminUser();

    log.step('Seeding subscription plans (definitions)...');
    await seedSubscriptionPlans();

    let demoUser = null;
    if (shouldSeedDemo) {
      log.step('Seeding demo user...');
      demoUser = await seedDemoUser();

      log.step('Seeding demo devices...');
      await seedDemoDevices(demoUser);

      log.step('Seeding demo locations...');
      await seedDemoLocations(demoUser);
    }

    log.step('Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    if (demoUser) {
      console.log(`   - Demo user: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);
    }
    console.log(`   - Subscription plans: ${Object.keys(SUBSCRIPTION_PLANS).length} defined`);
    console.log(`   - Demo data: ${shouldSeedDemo ? 'Yes' : 'No'}`);
  } catch (err) {
    log.error(`Seed failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = { seedAdminUser, seedDemoUser, seedDemoDevices, seedDemoLocations };
