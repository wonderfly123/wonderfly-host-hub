const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join an event room
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`Client joined event room: event-${eventId}`);
  });
  
  // Join admin event room
  socket.on('join-event-admin', (eventId) => {
    socket.join(`event-${eventId}-admin`);
    console.log(`Admin joined event room: event-${eventId}-admin`);
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
    console.log('Client disconnected');
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
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});