// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Environment logging
console.log('========== ENVIRONMENT DETAILS ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 5002);
console.log('MongoDB URI configured:', process.env.MONGODB_URI ? 'Yes' : 'No');
console.log('JWT Secret configured:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('Current directory:', __dirname);
console.log('Client build path:', path.join(__dirname, 'client/build'));
console.log('Detecting build directory:', require('fs').existsSync(path.join(__dirname, 'client/build')) ? 'Found' : 'Not found');
console.log('=======================================');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://wonderfly-host-hub.onrender.com', 'http://wonderfly-host-hub.onrender.com', '*'] // Be more specific in production
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Log socket.io config
console.log('Socket.io configured with CORS settings:', {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://wonderfly-host-hub.onrender.com', 'http://wonderfly-host-hub.onrender.com', '*'] 
    : 'http://localhost:3000'
});

// Make io available to routes and controllers
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://wonderfly-host-hub.onrender.com', 'http://wonderfly-host-hub.onrender.com', '*']
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.headers.authorization) {
    console.log('Auth header present');
  }
  next();
});

// Create test timeline items if none exist
const TimelineItem = require('./server/models/timelineItem.model');

async function createTestTimelineItems() {
  try {
    // Check if there are any timeline items
    const count = await TimelineItem.countDocuments();
    
    if (count === 0) {
      console.log('Creating test timeline items');
      
      // Create some test items for the event
      const eventId = '67cfb8a865249f273453b446'; // Your event ID
      const adminId = '67cfb83965249f273453b443'; // Your admin user ID from logs
      
      const items = [
        {
          event: new mongoose.Types.ObjectId(eventId),
          title: 'Welcome Reception',
          description: 'Welcome guests as they arrive',
          startTime: new Date('2025-06-18T13:30:00'),
          endTime: new Date('2025-06-18T14:30:00'),
          location: 'Main Hall',
          type: 'activity',
          important: true,
          createdBy: new mongoose.Types.ObjectId(adminId)
        },
        {
          event: new mongoose.Types.ObjectId(eventId),
          title: 'Dinner Service',
          description: 'Main course dinner service begins',
          startTime: new Date('2025-06-18T18:00:00'),
          endTime: new Date('2025-06-18T19:30:00'),
          location: 'Dining Room',
          type: 'meal',
          important: false,
          createdBy: new mongoose.Types.ObjectId(adminId)
        }
      ];
      
      await TimelineItem.insertMany(items);
      console.log('Test timeline items created');
    }
  } catch (error) {
    console.error('Error creating test timeline items:', error);
  }
}

// Create default facilities if none exist
const Facility = require('./server/models/facility.model');

async function createDefaultFacilities() {
  try {
    // Check if there are any facilities
    const count = await Facility.countDocuments();
    console.log('Existing facilities count:', count);
    
    if (count === 0) {
      console.log('Creating default facilities: Arbutus and Timonium');
      
      const facilities = [
        {
          name: 'Wonderfly Arena Arbutus',
          description: 'Wonderfly Arena located in Arbutus'
        },
        {
          name: 'Wonderfly Arena Timonium',
          description: 'Wonderfly Arena located in Timonium'
        }
      ];
      
      const result = await Facility.insertMany(facilities);
      console.log('Default facilities created:', result);
    } else {
      console.log('Facilities already exist, skipping seed');
    }
  } catch (error) {
    console.error('Error creating default facilities:', error);
  }
}

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');

// Additional MongoDB connection logging and monitoring
function logDbConnectionState() {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const state = mongoose.connection.readyState;
  console.log(`MongoDB connection state: ${state} (${stateMap[state] || 'unknown'})`);
  return state;
}

// Set up MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB event: connected');
});

mongoose.connection.on('disconnected', () => {
  console.log('🔴 MongoDB event: disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('🚨 MongoDB connection error event:', err);
});

mongoose.connection.on('reconnected', () => {
  console.log('🟠 MongoDB event: reconnected');
});

// Log a sanitized version of the MongoDB URI if it exists
if (process.env.MONGODB_URI) {
  const sanitizedUri = process.env.MONGODB_URI.replace(/(mongodb(\+srv)?:\/\/)([^:]+):([^@]+)@/, '$1***:***@');
  console.log('MongoDB URI (sanitized):', sanitizedUri);
  
  // Extract non-sensitive URI parts for debugging
  try {
    const url = new URL(process.env.MONGODB_URI);
    console.log('MongoDB connection details:');
    console.log('- Protocol:', url.protocol);
    console.log('- Host:', url.hostname);
    console.log('- Port:', url.port || 'default');
    console.log('- Database:', url.pathname.substring(1) || 'none specified');
    console.log('- SRV record used:', process.env.MONGODB_URI.includes('+srv'));
  } catch (err) {
    console.error('Error parsing MongoDB URI:', err.message);
  }
} else {
  console.error('⛔ MONGODB_URI is not defined in environment variables');
}

// Check current connection state
logDbConnectionState();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('MongoDB connection details:');
    console.log('- Connection state:', mongoose.connection.readyState);
    console.log('- Connected to host:', mongoose.connection.host);
    console.log('- Database name:', mongoose.connection.name);
    console.log('- MongoDB version:', mongoose.connection.db?.serverConfig?.s?.options?.serverApi?.version || 'unknown');
    
    // Create seed data
    createTestTimelineItems();
    createDefaultFacilities();
  })
  .catch(err => {
    console.error('⛔ MongoDB connection error details:');
    console.error('- Error message:', err.message);
    console.error('- Error code:', err.code);
    console.error('- Error name:', err.name);
    
    if (err.name === 'MongoServerSelectionError') {
      console.error('- Server selection timed out. Possible causes:');
      console.error('  1. Network connectivity issues');
      console.error('  2. MongoDB server is not running');
      console.error('  3. Incorrect MongoDB URI');
      console.error('  4. Firewall blocking connection');
    }
    
    console.error('Full error stack:', err.stack);
  });

// Re-check connection state after 5 seconds
setTimeout(() => {
  console.log('Re-checking MongoDB connection status after 5 seconds:');
  logDbConnectionState();
}, 5000);

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  
  if (!token) {
    console.log('Socket connection attempt with no token - allowing for public content');
    socket.userId = 'anonymous-' + Date.now();
    socket.isAnonymous = true;
    return next();
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Socket auth - decoded token:', decoded);
    
    // Support both id and userId formats
    socket.userId = decoded.id || decoded.userId;
    
    if (!socket.userId) {
      console.log('Invalid token format in socket connection - allowing as anonymous');
      socket.userId = 'anonymous-' + Date.now();
      socket.isAnonymous = true;
      return next();
    }
    
    console.log(`Socket authenticated for user: ${socket.userId}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    console.log('Allowing as anonymous user');
    socket.userId = 'anonymous-' + Date.now();
    socket.isAnonymous = true;
    next();
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected, userId:', socket.userId);
  
  // Join an event room
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`Client ${socket.userId} joined event room: event-${eventId}`);
  });
  
  // Join admin event room
  socket.on('join-event-admin', (eventId) => {
    socket.join(`event-${eventId}-admin`);
    console.log(`Admin ${socket.userId} joined event room: event-${eventId}-admin`);
  });
  
  // Join user room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User joined personal room: user-${userId}`);
  });
  
  // Join poll room
  socket.on('join-poll', (pollId) => {
    socket.join(`poll-${pollId}`);
    console.log(`Client joined poll room: poll-${pollId}`);
  });
  
  // Vote for a track
  socket.on('vote-track', async ({ eventId, trackId, userId }) => {
    try {
      // Voting logic implemented in the controller
      
      // Broadcast the updated queue to all clients in the event room
      io.to(`event-${eventId}`).emit('queue-updated');
    } catch (error) {
      console.error('Error processing vote:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected, userId:', socket.userId);
  });
});

// Routes
app.use('/api/auth', require('./server/routes/auth.routes'));
app.use('/api/events', require('./server/routes/event.routes'));
app.use('/api/music', require('./server/routes/music.routes'));
app.use('/api/orders', require('./server/routes/order.routes'));
app.use('/api/menu', require('./server/routes/menu.routes'));
app.use('/api/polls', require('./server/routes/poll.routes'));
app.use('/api/notifications', require('./server/routes/notification.routes'));
app.use('/api/timeline', require('./server/routes/timeline.routes'));
app.use('/api/payments', require('./server/routes/payment.routes'));
app.use('/api/facilities', require('./server/routes/facility.routes')); // Added facility routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Render health check routes (both /health and root path for maximum compatibility)
app.get('/health', (req, res) => {
  // For Render health checks, a simple 200 OK response is sufficient
  res.status(200).send('OK');
});

// Additional root health check that won't interfere with React routing in production
// because we only serve the React app for * routes in production mode
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Server status and health check route with detailed information
app.get('/api/status', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const mongoStatus = {
    state: mongoose.connection.readyState,
    stateDescription: stateMap[mongoose.connection.readyState] || 'unknown',
    connected: mongoose.connection.readyState === 1,
    host: mongoose.connection.host || 'not connected',
    database: mongoose.connection.name || 'not connected'
  };
  
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: {
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      },
      port: PORT
    },
    database: mongoStatus
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Running in production mode - serving static assets from', path.join(__dirname, 'client/build'));
  
  // Verify client build directory exists
  const clientBuildPath = path.join(__dirname, 'client/build');
  const clientBuildExists = require('fs').existsSync(clientBuildPath);
  console.log(`Client build directory ${clientBuildPath} exists: ${clientBuildExists ? 'Yes' : 'No'}`);
  
  if (clientBuildExists) {
    // Check if index.html exists in the build directory
    const indexHtmlPath = path.join(clientBuildPath, 'index.html');
    const indexHtmlExists = require('fs').existsSync(indexHtmlPath);
    console.log(`index.html file ${indexHtmlPath} exists: ${indexHtmlExists ? 'Yes' : 'No'}`);
  }
  
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Make sure our API and health check routes are handled before the catch-all route
  app.get('*', (req, res) => {
    // Log first few requests to catch-all route in production for debugging
    if (!global.catchAllRequestCount) {
      global.catchAllRequestCount = 0;
    }
    
    if (global.catchAllRequestCount < 5) {
      console.log(`Catch-all route handling request for: ${req.originalUrl}`);
      global.catchAllRequestCount++;
    }
    
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Process-level error handling
process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION 🚨');
  console.error('Error details:', err);
  console.error('Stack trace:', err.stack);
  
  // Log critical info that might help diagnose the issue
  console.error('NODE_ENV:', process.env.NODE_ENV);
  console.error('PORT:', process.env.PORT);
  console.error('Current directory:', __dirname);
  
  // Don't exit the process, but make sure the error is logged
  if (process.env.NODE_ENV === 'production') {
    // In production, we might want to restart the server automatically
    console.error('Uncaught exception in production - service may need restart');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION 🚨');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  // Keep the process alive but log the error
});

// Start server
const PORT = process.env.PORT || 5002;

console.log('Attempting to start server on port', PORT);
console.log('Environment PORT value:', process.env.PORT);

// Add error handling for server startup
const serverInstance = server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server successfully started and listening on port ${PORT}`);
  console.log('Server environment:', process.env.NODE_ENV || 'development');
  
  // Log server address info
  const addressInfo = serverInstance.address();
  console.log('Server address info:', {
    address: addressInfo?.address || 'not available',
    port: addressInfo?.port,
    family: addressInfo?.family
  });
  
  // Log routes for debugging
  console.log('\n📋 Registered API Routes:');
  const apiRoutes = [];
  app._router.stack
    .filter(r => r.route && r.route.path)
    .forEach(r => {
      Object.keys(r.route.methods).forEach(method => {
        apiRoutes.push(`${method.toUpperCase()} ${r.route.path}`);
      });
    });
  
  app._router.stack
    .filter(r => r.name === 'router' && r.handle && r.handle.stack)
    .forEach(r => {
      if (r.regexp && r.regexp.toString().includes('api')) {
        r.handle.stack
          .filter(h => h.route && h.route.path)
          .forEach(h => {
            Object.keys(h.route.methods).forEach(method => {
              apiRoutes.push(`${method.toUpperCase()} /api/${h.route.path}`);
            });
          });
      }
    });
  
  if (apiRoutes.length > 0) {
    apiRoutes.forEach(route => console.log(`- ${route}`));
  } else {
    console.log('No API routes found or unable to enumerate routes');
  }
  
  console.log('\n🌐 Server ready to accept connections');
  console.log('=======================================');
});

// Add server error event handlers
serverInstance.on('error', (error) => {
  console.error('🚨 SERVER ERROR EVENT 🚨');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.error('Full error:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose a different port or terminate the process using this port.`);
  }
});

serverInstance.on('close', () => {
  console.log('Server closed');
});