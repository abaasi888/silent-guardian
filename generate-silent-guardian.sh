#!/bin/bash

# =============================================================================
# Silent Guardian - Complete Multi-Platform Project Generator
# Android Apps: User App (Kotlin) + Employee App (Kotlin)
# Run: chmod +x generate-silent-guardian-complete.sh && ./generate-silent-guardian-complete.sh
# =============================================================================

set -e

PROJECT_ROOT="silent-guardian-complete"
echo "🚀 Generating Complete Silent Guardian Project in: $PROJECT_ROOT"
mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

# -----------------------------------------------------------------------------
# 1. Create directory structure
# -----------------------------------------------------------------------------
mkdir -p {frontend,backend,user-android-app,employee-android-app,infrastructure/docker,docs}

# -----------------------------------------------------------------------------
# 2. FRONTEND (React Web Application)
# -----------------------------------------------------------------------------
echo "🌐 Creating Frontend Web Application..."

mkdir -p frontend/{public,src/{components,services,pages,admin/{pages,components,styles},utils}}

cat > frontend/package.json << 'EOF'
{
  "name": "silent-guardian-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "axios": "^1.3.4",
    "socket.io-client": "^4.5.0",
    "recharts": "^2.5.0",
    "date-fns": "^2.29.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.0"
  }
}
EOF

cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': 'http://localhost:5000'
    }
  }
})
EOF

cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Silent Guardian - Admin Portal</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF

cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOF

cat > frontend/src/index.css << 'EOF'
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
  color: #1a1a2e;
}
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
EOF

cat > frontend/src/App.jsx << 'EOF'
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import KycUpload from './pages/KycUpload'
import DeviceManagement from './pages/DeviceManagement'
import LocationHistory from './pages/LocationHistory'
import Subscriptions from './pages/Subscriptions'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { getCurrentUser } from './services/authService'

// Admin imports
import AdminLogin from './admin/pages/AdminLogin'
import AdminLayout from './admin/components/AdminLayout'
import AdminDashboard from './admin/pages/AdminDashboard'
import UserManagement from './admin/pages/UserManagement'
import DeviceManagementAdmin from './admin/pages/DeviceManagement'
import EmployeeManagement from './admin/pages/EmployeeManagement'
import InviteEmployee from './admin/pages/InviteEmployee'
import AuditLogs from './admin/pages/AuditLogs'
import Reports from './admin/pages/Reports'
import Settings from './admin/pages/Settings'

const RoleBasedRedirect = () => {
  const user = getCurrentUser()
  const adminToken = localStorage.getItem('adminToken')
  if (adminToken) return <Navigate to="/admin/dashboard" replace />
  if (!user) return <Navigate to="/login" replace />
  if (user.accountType === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KycUpload /></ProtectedRoute>} />
          <Route path="/devices" element={<ProtectedRoute><DeviceManagement /></ProtectedRoute>} />
          <Route path="/location-history" element={<ProtectedRoute><LocationHistory /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="devices" element={<DeviceManagementAdmin />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="invite" element={<InviteEmployee />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
export default App
EOF

# Frontend pages (simplified for space - same as working version)
cat > frontend/src/services/authService.js << 'EOF'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser')
  return user ? JSON.parse(user) : null
}
export const isAuthenticated = () => !!localStorage.getItem('accessToken')
export const logoutUser = () => {
  localStorage.clear()
  window.location.href = '/login'
}
EOF

cat > frontend/src/admin/pages/InviteEmployee.jsx << 'EOF'
import React, { useState } from 'react'
const InviteEmployee = () => {
  const [inviteLink, setInviteLink] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(null)
  const generateInviteLink = () => {
    const code = 'EMP_' + Math.random().toString(36).substring(2, 10).toUpperCase()
    setInviteLink(`https://silentguardian.com/employee/join?code=${code}`)
    setMessage({ text: 'Invite link generated! Share with employee', type: 'success' })
    setTimeout(() => setMessage(null), 3000)
  }
  return (
    <div className="admin-container" style={{ padding: '2rem' }}>
      <h1>Invite Employee</h1>
      <div style={{ marginTop: '1rem' }}>
        <input type="email" placeholder="Employee Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '0.5rem', marginRight: '0.5rem' }} />
        <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '0.5rem', marginRight: '0.5rem' }} />
        <button onClick={generateInviteLink} style={{ padding: '0.5rem 1rem', background: '#9c27b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Generate Invite</button>
        {inviteLink && <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}><strong>Invite Code:</strong> {inviteLink.split('code=')[1]}<br/><button onClick={() => navigator.clipboard.writeText(inviteLink)} style={{ marginTop: '0.5rem' }}>Copy Link</button></div>}
        {message && <div style={{ marginTop: '1rem', padding: '0.5rem, background: '#4caf50', color: 'white', borderRadius: '4px' }}>{message.text}</div>}
      </div>
    </div>
  )
}
export default InviteEmployee
EOF

# Create other frontend pages stubs
for page in Login Register Dashboard Profile KycUpload DeviceManagement LocationHistory Subscriptions; do
  cat > frontend/src/pages/${page}.jsx << EOF
import React from 'react'
export default function ${page}() {
  return <div style={{ padding: '2rem' }}><h1>${page}</h1><p>This is the ${page} page.</p></div>
}
EOF
done

for page in AdminLogin AdminDashboard UserManagement DeviceManagement EmployeeManagement AuditLogs Reports Settings; do
  cat > frontend/src/admin/pages/${page}.jsx << EOF
import React from 'react'
export default function ${page}() {
  return <div style={{ padding: '2rem' }}><h1>${page}</h1><p>Admin ${page} page.</p></div>
}
EOF
done

# Admin components
mkdir -p frontend/src/admin/components
cat > frontend/src/admin/components/AdminLayout.jsx << 'EOF'
import React from 'react'
import { Outlet } from 'react-router-dom'
export default () => <div><Outlet /></div>
EOF

cat > frontend/src/components/Navbar.jsx << 'EOF'
import React from 'react'
import { Link } from 'react-router-dom'
export default () => <nav style={{ padding: '1rem', background: '#1a1a2e', color: 'white' }}><Link to="/" style={{ color: 'white' }}>Silent Guardian</Link></nav>
EOF

cat > frontend/src/components/ProtectedRoute.jsx << 'EOF'
import React from 'react'
import { Navigate } from 'react-router-dom'
export default ({ children }) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('adminToken')
  return token ? children : <Navigate to="/login" />
}
EOF

# -----------------------------------------------------------------------------
# 3. BACKEND (Node.js + Express + MongoDB)
# -----------------------------------------------------------------------------
echo "🔧 Creating Backend Server..."

mkdir -p backend/{src/{controllers,models,routes,middleware,utils,services},tests}

cat > backend/package.json << 'EOF'
{
  "name": "silent-guardian-backend",
  "version": "1.0.0",
  "description": "Silent Guardian Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "socket.io": "^4.5.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.0",
    "express-validator": "^6.15.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.5.0"
  }
}
EOF

cat > backend/.env.example << 'EOF'
PORT=5000
MONGODB_URI=mongodb://localhost:27017/silent_guardian
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=admin@silentguardian.com
ADMIN_PASSWORD=admin123
EOF

cat > backend/src/server.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const socketIO = require('socket.io');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const deviceRoutes = require('./routes/device.routes');
const adminRoutes = require('./routes/admin.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8080", "http://10.0.2.2:5173"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/silent_guardian', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.IO for real-time tracking
io.on('connection', (socket) => {
  console.log('📱 Client connected:', socket.id);
  
  socket.on('user-location', (data) => {
    io.emit('location-update', data);
  });
  
  socket.on('employee-location', (data) => {
    io.emit('employee-tracking', data);
  });
  
  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
});
EOF

# Backend Models
cat > backend/src/models/User.model.js << 'EOF'
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  accountType: { type: String, enum: ['ordinary', 'corporate', 'admin', 'employee'], default: 'ordinary' },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);
EOF

cat > backend/src/models/Device.model.js << 'EOF'
const mongoose = require('mongoose');
const deviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceName: String,
  deviceId: { type: String, required: true, unique: true },
  deviceType: { type: String, enum: ['android', 'ios'], default: 'android' },
  status: { type: String, enum: ['active', 'inactive', 'stolen'], default: 'inactive' },
  lastLocation: { lat: Number, lng: Number, timestamp: Date },
  locationHistory: [{ lat: Number, lng: Number, timestamp: Date }],
  batteryLevel: Number,
  lastSeen: Date
});
module.exports = mongoose.model('Device', deviceSchema);
EOF

cat > backend/src/models/Employee.model.js << 'EOF'
const mongoose = require('mongoose');
const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  inviteCode: { type: String, required: true, unique: true },
  role: { type: String, default: 'Sales Agent' },
  commissionRate: { type: Number, default: 30 },
  status: { type: String, enum: ['pending', 'active', 'terminated'], default: 'pending' },
  joinDate: { type: Date, default: Date.now },
  totalSignups: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: { resume: String, idProof: String }
});
module.exports = mongoose.model('Employee', employeeSchema);
EOF

cat > backend/src/controllers/auth.controller.js << 'EOF'
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email exists' });
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashed, phone });
    await user.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, accountType: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    user.lastLogin = new Date();
    await user.save();
    
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, accountType: user.accountType } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
EOF

cat > backend/src/controllers/employee.controller.js << 'EOF'
const Employee = require('../models/Employee.model');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

exports.generateInvite = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const inviteCode = 'EMP_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const employee = new Employee({
      email,
      phone,
      inviteCode,
      fullName: email.split('@')[0],
      status: 'pending'
    });
    
    await employee.save();
    res.json({ message: 'Invite generated', inviteCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyInvite = async (req, res) => {
  try {
    const { inviteCode, fullName, password } = req.body;
    const employee = await Employee.findOne({ inviteCode });
    
    if (!employee) return res.status(404).json({ message: 'Invalid invite code' });
    if (employee.status !== 'pending') return res.status(400).json({ message: 'Invite already used' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      fullName,
      email: employee.email,
      password: hashedPassword,
      phone: employee.phone,
      accountType: 'employee'
    });
    
    await user.save();
    
    employee.status = 'active';
    employee.fullName = fullName;
    await employee.save();
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, accountType: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({ token, user: { id: user._id, fullName, email: employee.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
EOF

# -----------------------------------------------------------------------------
# 4. USER ANDROID APP (Kotlin) - For tracking users
# -----------------------------------------------------------------------------
echo "📱 Creating User Android App (Kotlin)..."

mkdir -p user-android-app/{app/src/main/{java/com/silentguardian/user/{activities,adapters,models,network,services,utils},res/{layout,drawable,values,menu}},gradle}

cat > user-android-app/settings.gradle << 'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "SilentGuardianUser"
include ':app'
EOF

cat > user-android-app/build.gradle << 'EOF'
// Top-level build file
plugins {
    id 'com.android.application' version '8.1.0' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.0' apply false
    id 'com.google.dagger.hilt.android' version '2.48' apply false
}
EOF

cat > user-android-app/app/build.gradle << 'EOF'
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'kotlin-kapt'
    id 'dagger.hilt.android.plugin'
}

android {
    namespace 'com.silentguardian.user'
    compileSdk 34

    defaultConfig {
        applicationId "com.silentguardian.user"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    buildFeatures {
        viewBinding true
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.10.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.1'
    implementation 'androidx.navigation:navigation-fragment-ktx:2.5.3'
    implementation 'androidx.navigation:navigation-ui-ktx:2.5.3'
    
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    
    // Dependency Injection
    implementation 'com.google.dagger:hilt-android:2.48'
    kapt 'com.google.dagger:hilt-compiler:2.48'
    
    // Location & Maps
    implementation 'com.google.android.gms:play-services-location:21.0.1'
    implementation 'com.google.android.gms:play-services-maps:18.1.0'
    
    // Room Database
    implementation 'androidx.room:room-runtime:2.5.1'
    implementation 'androidx.room:room-ktx:2.5.1'
    kapt 'androidx.room:room-compiler:2.5.1'
    
    // WorkManager
    implementation 'androidx.work:work-runtime-ktx:2.8.1'
    
    // Socket.IO
    implementation 'io.socket:socket.io-client:2.0.1'
    
    // Permissions
    implementation 'com.karumi:dexter:6.2.3'
    
    // Glide for images
    implementation 'com.github.bumptech.glide:glide:4.15.1'
}
EOF

cat > user-android-app/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.silentguardian.user">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Silent Guardian User"
        android:theme="@style/Theme.SilentGuardian">
        
        <activity
            android:name=".activities.SplashActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <activity android:name=".activities.LoginActivity" />
        <activity android:name=".activities.MainActivity" />
        <activity android:name=".activities.TrackingActivity" />
        <activity android:name=".activities.DeviceManagementActivity" />
        <activity android:name=".activities.LocationHistoryActivity" />
        <activity android:name=".activities.ProfileActivity" />
        <activity android:name=".activities.KycActivity" />
        
        <service android:name=".services.LocationTrackingService" />
        
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY" />
    </application>
</manifest>
EOF

cat > user-android-app/app/src/main/java/com/silentguardian/user/activities/LoginActivity.kt << 'EOF'
package com.silentguardian.user.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.user.databinding.ActivityLoginBinding
import com.silentguardian.user.network.ApiClient
import com.silentguardian.user.network.models.LoginRequest
import com.silentguardian.user.utils.PreferenceManager
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var preferenceManager: PreferenceManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferenceManager = PreferenceManager(this)
        
        if (preferenceManager.isLoggedIn()) {
            navigateToMain()
            return
        }
        
        binding.loginButton.setOnClickListener {
            val email = binding.emailInput.text.toString()
            val password = binding.passwordInput.text.toString()
            if (email.isNotEmpty() && password.isNotEmpty()) {
                performLogin(email, password)
            } else {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            }
        }
        
        binding.registerButton.setOnClickListener {
            startActivity(RegisterActivity.newIntent(this))
        }
    }
    
    private fun performLogin(email: String, password: String) {
        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getInstance().apiService
                val response = apiService.login(LoginRequest(email, password))
                
                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    preferenceManager.saveUserData(data)
                    Toast.makeText(this@LoginActivity, "Login successful!", Toast.LENGTH_SHORT).show()
                    navigateToMain()
                } else {
                    Toast.makeText(this@LoginActivity, "Invalid credentials", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@LoginActivity, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun navigateToMain() {
        startActivity(MainActivity.newIntent(this))
        finish()
    }
}
EOF

cat > user-android-app/app/src/main/java/com/silentguardian/user/services/LocationTrackingService.kt << 'EOF'
package com.silentguardian.user.services

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.silentguardian.user.MainActivity
import com.silentguardian.user.R
import com.silentguardian.user.network.ApiClient
import com.silentguardian.user.network.models.LocationUpdate
import com.silentguardian.user.utils.PreferenceManager
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.*
import java.net.URISyntaxException

class LocationTrackingService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationRequest: LocationRequest
    private lateinit var locationCallback: LocationCallback
    private lateinit var preferenceManager: PreferenceManager
    private var socket: Socket? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    companion object {
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "location_tracking"
    }
    
    override fun onCreate() {
        super.onCreate()
        preferenceManager = PreferenceManager(this)
        setupLocationTracking()
        setupSocket()
        createNotificationChannel()
    }
    
    private fun setupLocationTracking() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            5000L
        ).apply {
            setMinUpdateIntervalMillis(2000L)
            setMaxUpdateDelayMillis(10000L)
        }.build()
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    sendLocationToServer(location)
                    sendLocationViaSocket(location)
                }
            }
        }
        
        startLocationUpdates()
    }
    
    private fun setupSocket() {
        try {
            val options = IO.Options()
            options.reconnection = true
            socket = IO.socket("http://10.0.2.2:5000", options)
            socket?.connect()
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }
    
    private fun sendLocationToServer(location: Location) {
        serviceScope.launch {
            try {
                val token = preferenceManager.getToken()
                val deviceId = preferenceManager.getDeviceId()
                val update = LocationUpdate(
                    deviceId = deviceId,
                    lat = location.latitude,
                    lng = location.longitude,
                    accuracy = location.accuracy,
                    timestamp = System.currentTimeMillis()
                )
                val apiService = ApiClient.getInstance().apiService
                apiService.updateLocation("Bearer $token", update)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private fun sendLocationViaSocket(location: Location) {
        val data = mapOf(
            "lat" to location.latitude,
            "lng" to location.longitude,
            "deviceId" to preferenceManager.getDeviceId(),
            "timestamp" to System.currentTimeMillis()
        )
        socket?.emit("user-location", data)
    }
    
    private fun startLocationUpdates() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
        
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Silent Guardian")
            .setContentText("Location tracking is active")
            .setSmallIcon(R.drawable.ic_notification)
            .build()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        socket?.disconnect()
        serviceScope.cancel()
    }
    override fun onBind(intent: Intent?): IBinder? = null
}
EOF

# Create resource files for user app
cat > user-android-app/app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">Silent Guardian User</string>
</resources>
EOF

cat > user-android-app/app/src/main/res/values/themes.xml << 'EOF'
<resources>
    <style name="Theme.SilentGuardian" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/purple_500</item>
        <item name="colorPrimaryVariant">@color/purple_700</item>
        <item name="colorOnPrimary">@color/white</item>
    </style>
</resources>
EOF

cat > user-android-app/app/src/main/res/values/colors.xml << 'EOF'
<resources>
    <color name="purple_500">#9C27B0</color>
    <color name="purple_700">#7B1FA2</color>
    <color name="white">#FFFFFF</color>
</resources>
EOF

# -----------------------------------------------------------------------------
# 5. EMPLOYEE ANDROID APP (Kotlin) - Separate app for employees
# -----------------------------------------------------------------------------
echo "👔 Creating Employee Android App (Kotlin)..."

mkdir -p employee-android-app/{app/src/main/{java/com/silentguardian/employee/{activities,adapters,models,network,services,utils},res/{layout,drawable,values,menu}},gradle}

cat > employee-android-app/settings.gradle << 'EOF'
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "SilentGuardianEmployee"
include ':app'
EOF

cat > employee-android-app/build.gradle << 'EOF'
plugins {
    id 'com.android.application' version '8.1.0' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.0' apply false
}
EOF

cat > employee-android-app/app/build.gradle << 'EOF'
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'kotlin-kapt'
}

android {
    namespace 'com.silentguardian.employee'
    compileSdk 34

    defaultConfig {
        applicationId "com.silentguardian.employee"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    buildFeatures {
        viewBinding true
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.10.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.1'
    implementation 'androidx.navigation:navigation-fragment-ktx:2.5.3'
    implementation 'androidx.navigation:navigation-ui-ktx:2.5.3'
    
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    
    // Location & Maps
    implementation 'com.google.android.gms:play-services-location:21.0.1'
    implementation 'com.google.android.gms:play-services-maps:18.1.0'
    
    // Room Database
    implementation 'androidx.room:room-runtime:2.5.1'
    implementation 'androidx.room:room-ktx:2.5.1'
    kapt 'androidx.room:room-compiler:2.5.1'
    
    // WorkManager
    implementation 'androidx.work:work-runtime-ktx:2.8.1'
    
    // Socket.IO
    implementation 'io.socket:socket.io-client:2.0.1'
    
    // Charts for performance
    implementation 'com.github.PhilJay:MPAndroidChart:v3.1.0'
    
    // Permissions
    implementation 'com.karumi:dexter:6.2.3'
}
EOF

cat > employee-android-app/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.silentguardian.employee">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Silent Guardian Employee"
        android:theme="@style/Theme.SilentGuardianEmployee">
        
        <activity
            android:name=".activities.SplashActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <activity android:name=".activities.LoginActivity" />
        <activity android:name=".activities.MainActivity" />
        <activity android:name=".activities.TrackingActivity" />
        <activity android:name=".activities.PerformanceActivity" />
        <activity android:name=".activities.SignupsActivity" />
        <activity android:name=".activities.CommissionActivity" />
        <activity android:name=".activities.ProfileActivity" />
        
        <service android:name=".services.EmployeeTrackingService" />
        
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY" />
    </application>
</manifest>
EOF

cat > employee-android-app/app/src/main/java/com/silentguardian/employee/activities/LoginActivity.kt << 'EOF'
package com.silentguardian.employee.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.silentguardian.employee.databinding.ActivityLoginBinding
import com.silentguardian.employee.network.ApiClient
import com.silentguardian.employee.network.models.VerifyInviteRequest
import com.silentguardian.employee.utils.PreferenceManager
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var preferenceManager: PreferenceManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferenceManager = PreferenceManager(this)
        
        if (preferenceManager.isLoggedIn()) {
            navigateToMain()
            return
        }
        
        binding.loginButton.setOnClickListener {
            val inviteCode = binding.inviteCodeInput.text.toString()
            val fullName = binding.fullNameInput.text.toString()
            val password = binding.passwordInput.text.toString()
            
            if (inviteCode.isNotEmpty() && fullName.isNotEmpty() && password.isNotEmpty()) {
                verifyInvite(inviteCode, fullName, password)
            } else {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun verifyInvite(inviteCode: String, fullName: String, password: String) {
        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getInstance().apiService
                val response = apiService.verifyInvite(VerifyInviteRequest(inviteCode, fullName, password))
                
                if (response.isSuccessful && response.body() != null) {
                    val data = response.body()!!
                    preferenceManager.saveEmployeeData(data)
                    Toast.makeText(this@LoginActivity, "Welcome to Silent Guardian!", Toast.LENGTH_SHORT).show()
                    navigateToMain()
                } else {
                    Toast.makeText(this@LoginActivity, "Invalid invite code", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@LoginActivity, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun navigateToMain() {
        startActivity(MainActivity.newIntent(this))
        finish()
    }
}
EOF

cat > employee-android-app/app/src/main/java/com/silentguardian/employee/services/EmployeeTrackingService.kt << 'EOF'
package com.silentguardian.employee.services

import android.app.*
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.silentguardian.employee.R
import com.silentguardian.employee.network.ApiClient
import com.silentguardian.employee.network.models.EmployeeLocationUpdate
import com.silentguardian.employee.utils.PreferenceManager
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.*
import java.net.URISyntaxException

class EmployeeTrackingService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationRequest: LocationRequest
    private lateinit var locationCallback: LocationCallback
    private lateinit var preferenceManager: PreferenceManager
    private var socket: Socket? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    override fun onCreate() {
        super.onCreate()
        preferenceManager = PreferenceManager(this)
        setupLocationTracking()
        setupSocket()
        createNotificationChannel()
    }
    
    private fun setupLocationTracking() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            10000L // 10 seconds for employees
        ).apply {
            setMinUpdateIntervalMillis(5000L)
        }.build()
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    sendLocationToServer(location)
                    sendLocationViaSocket(location)
                }
            }
        }
        
        startLocationUpdates()
    }
    
    private fun setupSocket() {
        try {
            val options = IO.Options()
            options.reconnection = true
            socket = IO.socket("http://10.0.2.2:5000", options)
            socket?.connect()
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }
    
    private fun sendLocationToServer(location: Location) {
        serviceScope.launch {
            try {
                val token = preferenceManager.getToken()
                val update = EmployeeLocationUpdate(
                    lat = location.latitude,
                    lng = location.longitude,
                    timestamp = System.currentTimeMillis()
                )
                val apiService = ApiClient.getInstance().apiService
                apiService.updateEmployeeLocation("Bearer $token", update)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private fun sendLocationViaSocket(location: Location) {
        val data = mapOf(
            "lat" to location.latitude,
            "lng" to location.longitude,
            "employeeId" to preferenceManager.getEmployeeId(),
            "timestamp" to System.currentTimeMillis()
        )
        socket?.emit("employee-location", data)
    }
    
    private fun startLocationUpdates() {
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "employee_tracking",
                "Employee Tracking",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
        
        val notification = NotificationCompat.Builder(this, "employee_tracking")
            .setContentTitle("Silent Guardian Employee")
            .setContentText("Tracking active for work hours")
            .setSmallIcon(R.drawable.ic_notification)
            .build()
        
        startForeground(1002, notification)
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        socket?.disconnect()
        serviceScope.cancel()
    }
    override fun onBind(intent: Intent?): IBinder? = null
}
EOF

# Employee app resources
cat > employee-android-app/app/src/main/res/values/strings.xml << 'EOF'
<resources>
    <string name="app_name">Silent Guardian Employee</string>
</resources>
EOF

cat > employee-android-app/app/src/main/res/values/themes.xml << 'EOF'
<resources>
    <style name="Theme.SilentGuardianEmployee" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">#FF9800</item>
        <item name="colorPrimaryVariant">#F57C00</item>
        <item name="colorOnPrimary">@color/white</item>
    </style>
</resources>
EOF

cat > employee-android-app/app/src/main/res/values/colors.xml << 'EOF'
<resources>
    <color name="orange_500">#FF9800</color>
    <color name="orange_700">#F57C00</color>
    <color name="white">#FFFFFF</color>
</resources>
EOF

# -----------------------------------------------------------------------------
# 6. Backend Routes
# -----------------------------------------------------------------------------
cat > backend/src/routes/auth.routes.js << 'EOF'
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
EOF

cat > backend/src/routes/employee.routes.js << 'EOF'
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const auth = require('../middleware/auth');

router.post('/invite', auth, employeeController.generateInvite);
router.post('/verify', employeeController.verifyInvite);

module.exports = router;
EOF

cat > backend/src/routes/device.routes.js << 'EOF'
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/location', auth, (req, res) => {
  res.json({ message: 'Location updated' });
});

module.exports = router;
EOF

cat > backend/src/middleware/auth.js << 'EOF'
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
EOF

# -----------------------------------------------------------------------------
# 7. Docker & Documentation
# -----------------------------------------------------------------------------
cat > infrastructure/docker/docker-compose.yml << 'EOF'
version: '3.8'
services:
  mongodb:
    image: mongo:6
    container_name: silent-guardian-db
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    networks:
      - sg-network

  redis:
    image: redis:7-alpine
    container_name: silent-guardian-redis
    ports:
      - "6379:6379"
    networks:
      - sg-network

  backend:
    build: ./backend
    container_name: silent-guardian-api
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/silent_guardian?authSource=admin
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongodb
      - redis
    networks:
      - sg-network

volumes:
  mongodb_data:

networks:
  sg-network:
    driver: bridge
EOF

cat > docs/README.md << 'EOF'
# Silent Guardian Complete Platform

## 📱 Applications

### 1. Web Admin Portal (React)
- URL: http://localhost:5173
- Admin login: admin@silentguardian.com / admin123
- Features: User management, employee invites, analytics

### 2. Backend API (Node.js)
- URL: http://localhost:5000
- REST API with Socket.IO for real-time

### 3. User Android App (Kotlin)
- Package: com.silentguardian.user
- Features: Location tracking, device management, KYC

### 4. Employee Android App (Kotlin)
- Package: com.silentguardian.employee
- Features: Work tracking, commissions, performance

## 🚀 Setup Instructions

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev