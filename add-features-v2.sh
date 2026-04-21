#!/bin/bash

# Silent Guardian - Advanced Features Add-on (works from inside or outside project)

set -e

# Detect project root
if [ -f "backend/package.json" ] && [ -d "frontend" ]; then
  PROJECT_ROOT="."
elif [ -d "silent-guardian" ] && [ -f "silent-guardian/backend/package.json" ]; then
  PROJECT_ROOT="silent-guardian"
else
  echo "Error: Could not find Silent Guardian project. Make sure you are either inside the project or in the folder that contains it."
  exit 1
fi

cd "$PROJECT_ROOT"

echo "Adding advanced features to Silent Guardian at $(pwd)..."

# ----------------------------------------------------------------------
# 1. BACKEND: SIM change detection & enhanced SMS service
# ----------------------------------------------------------------------

# Add environment variables
if ! grep -q "OWNER_PHONE_NUMBER" backend/.env.example 2>/dev/null; then
  cat >> backend/.env.example << 'EOF'

# Advanced offline tracking & SMS
OWNER_PHONE_NUMBER=+256700123456
SMS_TRIGGER_KEYWORD=#TRACKNOW
OFFLINE_QUEUE_MAX_ENTRIES=50000
OFFLINE_QUEUE_MAX_DAYS=60
BLE_PEER_SCAN_INTERVAL_MS=30000
EOF
fi

# New service: simChangeService.js
cat > backend/src/services/simChangeService.js << 'EOF'
const Device = require('../models/Device');
const User = require('../models/User');
const { sendAlertSMS } = require('./smsService');
const logger = require('../config/logger');

const reportSimChange = async (deviceId, newSimNumber, oldSimNumber) => {
  const device = await Device.findOne({ deviceId });
  if (!device) return null;
  const user = await User.findById(device.userId);
  if (!user || !user.phone) return null;
  const message = `ALERT: SIM changed on device ${device.deviceName} (${deviceId}). Old: ${oldSimNumber}, New: ${newSimNumber}`;
  await sendAlertSMS(user.phone, message);
  logger.info(`SIM change reported for device ${deviceId}`);
  return { success: true };
};

module.exports = { reportSimChange };
EOF

# New controller: smsTrigger.js
cat > backend/src/controllers/device/smsTrigger.js << 'EOF'
const Device = require('../../models/Device');
const Location = require('../../models/Location');
const { sendAlertSMS } = require('../../services/smsService');
const User = require('../../models/User');

const processIncomingSms = async (req, res) => {
  const { deviceId, fromNumber, message } = req.body;
  const device = await Device.findOne({ deviceId });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  const user = await User.findById(device.userId);
  if (!user || !user.phone) return res.status(400).json({ error: 'User phone not set' });

  const triggerWord = process.env.SMS_TRIGGER_KEYWORD || '#TRACKNOW';
  if (message.trim() === triggerWord) {
    const lastLocation = await Location.findOne({ deviceId }).sort('-timestamp');
    let reply = `Device: ${device.deviceName}\n`;
    if (lastLocation) {
      reply += `Last location: ${lastLocation.lat}, ${lastLocation.lng} at ${lastLocation.timestamp}`;
    } else {
      reply += 'No location recorded yet.';
    }
    await sendAlertSMS(fromNumber, reply);
    return res.json({ success: true, action: 'location_reply' });
  }
  res.json({ success: false, message: 'Unknown command' });
};

module.exports = { processIncomingSms };
EOF

# Add route for SMS trigger
if ! grep -q "smsTrigger" backend/src/routes/v1/device.routes.js; then
  sed -i '/router\.post(\/fingerprint/a\
const { processIncomingSms } = require("../../controllers/device/smsTrigger");\
router.post("/sms-trigger", authMiddleware, processIncomingSms);' backend/src/routes/v1/device.routes.js
fi

# ----------------------------------------------------------------------
# 2. BACKEND: Enhanced offline queue (TTL index)
# ----------------------------------------------------------------------
cat > backend/src/models/OfflineQueue.js << 'EOF'
const mongoose = require('mongoose');
const offlineQueueSchema = new mongoose.Schema({
  deviceId: String,
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  payload: mongoose.Schema.Types.Mixed,
  retries: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now, index: true }
});
const maxDays = parseInt(process.env.OFFLINE_QUEUE_MAX_DAYS) || 60;
offlineQueueSchema.index({ createdAt: 1 }, { expireAfterSeconds: maxDays * 86400 });
module.exports = mongoose.model('OfflineQueue', offlineQueueSchema);
EOF

# ----------------------------------------------------------------------
# 3. FRONTEND: Enhanced offline storage with compression
# ----------------------------------------------------------------------
cat > frontend/src/services/offline.js << 'EOF'
import { openDB } from 'idb';
import pako from 'pako';

const DB_NAME = 'silent-guardian';
const DB_VERSION = 2;
const STORE_NAME = 'offlineLocations';

let dbPromise = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
        }
      }
    });
  }
  return dbPromise;
};

const compress = async (data) => {
  const json = JSON.stringify(data);
  return pako.deflate(json);
};

const decompress = async (compressed) => {
  const json = pako.inflate(compressed, { to: 'string' });
  return JSON.parse(json);
};

export const saveOfflineLocation = async (location) => {
  const db = await getDB();
  const compressed = await compress(location);
  await db.add(STORE_NAME, { compressed, timestamp: location.timestamp || Date.now() });
};

export const getOfflineLocations = async () => {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  const results = [];
  for (const item of all) {
    const decompressed = await decompress(item.compressed);
    results.push(decompressed);
  }
  return results;
};

export const clearOfflineLocations = async () => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
};

export const getOfflineCount = async () => {
  const db = await getDB();
  return await db.count(STORE_NAME);
};
EOF

# Add pako dependency
if ! grep -q '"pako"' frontend/package.json; then
  sed -i '/"crypto-js"/a\    "pako": "^2.1.0",' frontend/package.json
fi

# ----------------------------------------------------------------------
# 4. SIM detection service (frontend)
# ----------------------------------------------------------------------
cat > frontend/src/services/simDetection.js << 'EOF'
import api from './api';
import { getItem, setItem } from './storage';

export const startSimDetection = (deviceId) => {
  const storedSim = getItem('lastSimNumber');
  if (!storedSim) {
    setItem('lastSimNumber', 'SIM_MOCK_001');
  }
  // In real Android, you'd listen to SIM state changes and call reportSimChange.
};

export const reportSimChange = async (deviceId, newSimNumber, oldSimNumber) => {
  try {
    await api.post('/devices/sim-change', { deviceId, newSimNumber, oldSimNumber });
    setItem('lastSimNumber', newSimNumber);
  } catch (err) {
    console.error('Failed to report SIM change', err);
  }
};

export const stopSimDetection = () => {};
EOF

# Add backend controller for SIM change
cat > backend/src/controllers/device/simChange.js << 'EOF'
const { reportSimChange } = require('../../services/simChangeService');
const simChangeReport = async (req, res) => {
  const { deviceId, newSimNumber, oldSimNumber } = req.body;
  const result = await reportSimChange(deviceId, newSimNumber, oldSimNumber);
  res.json(result);
};
module.exports = simChangeReport;
EOF

# Add route for SIM change
if ! grep -q "sim-change" backend/src/routes/v1/device.routes.js; then
  sed -i '/router\.post(\/sms-trigger/a\
const simChangeReport = require("../../controllers/device/simChange");\
router.post("/sim-change", authMiddleware, simChangeReport);' backend/src/routes/v1/device.routes.js
fi

# ----------------------------------------------------------------------
# 5. Peer-to-peer mesh stub
# ----------------------------------------------------------------------
cat > frontend/src/services/bleMesh.js << 'EOF'
export const startMeshScan = (deviceId, userId) => {
  console.log(`[Mesh] Started scanning for device ${deviceId}`);
  // In real implementation, use Web Bluetooth or native module.
};

export const stopMeshScan = () => {};
EOF

# ----------------------------------------------------------------------
# 6. Offline geofencing utility
# ----------------------------------------------------------------------
cat > frontend/src/utils/geofence.js << 'EOF'
import { getItem, setItem } from '../services/storage';

export const loadGeofences = () => getItem('geofences') || [];

export const saveGeofence = (geofence) => {
  const fences = loadGeofences();
  fences.push(geofence);
  setItem('geofences', fences);
};

export const isOutsideGeofence = (lat, lng, fence) => {
  const R = 6371e3;
  const toRad = (v) => v * Math.PI / 180;
  const φ1 = toRad(lat);
  const φ2 = toRad(fence.lat);
  const Δφ = toRad(fence.lat - lat);
  const Δλ = toRad(fence.lng - lng);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance > fence.radius;
};

export const checkGeofences = (lat, lng) => {
  const fences = loadGeofences();
  return fences.filter(f => isOutsideGeofence(lat, lng, f));
};
EOF

# ----------------------------------------------------------------------
# 7. Adaptive geolocation hook
# ----------------------------------------------------------------------
cat > frontend/src/hooks/useAdaptiveGeolocation.js << 'EOF'
import { useState, useEffect, useRef } from 'react';
import { checkGeofences } from '../utils/geofence';
import { saveOfflineLocation } from '../services/offline';

export const useAdaptiveGeolocation = (deviceId, isOnline) => {
  const [position, setPosition] = useState(null);
  const [speed, setSpeed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: spd, accuracy, timestamp } = pos.coords;
        const currentSpeed = spd || 0;
        setSpeed(currentSpeed);
        setPosition({ lat: latitude, lng: longitude, accuracy, timestamp: new Date(timestamp) });
        checkGeofences(latitude, longitude);
        const loc = { deviceId, lat: latitude, lng: longitude, accuracy, speed: currentSpeed, timestamp: new Date(timestamp), isOffline: !isOnline };
        saveOfflineLocation(loc);
      },
      (err) => console.error('Geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [deviceId, isOnline]);

  return { position, speed };
};
EOF

# ----------------------------------------------------------------------
# 8. Update App.jsx to initialize new services (only if not already present)
# ----------------------------------------------------------------------
if ! grep -q "startSimDetection" frontend/src/App.jsx; then
  sed -i '/import.*StealthProvider/a\
import { startSimDetection } from "./services/simDetection";\
import { startMeshScan } from "./services/bleMesh";\
import { useAuth } from "./hooks/useAuth";' frontend/src/App.jsx

  sed -i '/function App() {/a\
  const { user } = useAuth();\
  useEffect(() => {\
    if (user && user.stealthEnabled) {\
      startSimDetection("DEVICE_ID_PLACEHOLDER");\
      startMeshScan("DEVICE_ID_PLACEHOLDER", user.id);\
    }\
  }, [user]);' frontend/src/App.jsx
fi

# ----------------------------------------------------------------------
# 9. Create hidden partition script template
# ----------------------------------------------------------------------
cat > scripts/create-hidden-partition.sh << 'EOF'
#!/bin/bash
echo "This script is a template for creating a hidden partition on rooted devices."
echo "Please consult the documentation before using."
exit 0
EOF
chmod +x scripts/create-hidden-partition.sh

# ----------------------------------------------------------------------
# Final instructions
# ----------------------------------------------------------------------
echo ""
echo "================================================================"
echo "Advanced features added successfully!"
echo ""
echo "Next steps:"
echo "1. Install new frontend dependency:"
echo "   cd frontend && npm install pako"
echo ""
echo "2. Copy environment files if you haven't already:"
echo "   cp backend/.env.example backend/.env"
echo "   cp frontend/.env.example frontend/.env"
echo "   (Edit backend/.env and set OWNER_PHONE_NUMBER, SMS_TRIGGER_KEYWORD, etc.)"
echo ""
echo "3. Restart your containers:"
echo "   make dev"
echo ""
echo "4. For SIM change detection to work, you need to implement the native Android side"
echo "   (broadcast receiver) that calls the /devices/sim-change endpoint."
echo ""
echo "5. For BLE mesh, implement Web Bluetooth or a native module."
echo "================================================================"