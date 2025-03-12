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

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to routes and controllers
app.set('io', io);

// Middleware
app.use(cors());
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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    createTestTimelineItems();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.log('Socket connection attempt with no token');
    return next(new Error('Authentication error'));
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Socket auth - decoded token:', decoded);
    
    // Support both id and userId formats
    socket.userId = decoded.id || decoded.userId;
    
    if (!socket.userId) {
      console.log('Invalid token format in socket connection');
      return next(new Error('Invalid token format'));
    }
    
    console.log(`Socket authenticated for user: ${socket.userId}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
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

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});