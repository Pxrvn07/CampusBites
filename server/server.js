const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Make io available in routes
app.set('io', io);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'CampusBites API is running' });
});

// Socket.io basic connection handler (placeholder for future use)
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusbites';
console.log('Attempting to connect to MongoDB...');

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection error:', err.message);
    console.log('Continuing server startup (routes will fail but health check may work)...');
  });

const PORT = process.env.PORT || 10000; // Render default is 10000

server.listen(PORT, '0.0.0.0', () => {
  console.log('--- SERVER STARTUP DIAGNOSTICS ---');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Port: ${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`MONGO_URI exists: ${!!process.env.MONGO_URI}`);
  console.log(`CLIENT_ORIGIN: ${process.env.CLIENT_ORIGIN || 'Not set (defaults to localhost:3000)'}`);
  console.log('---------------------------------');
  console.log(`Server is LIVE on 0.0.0.0:${PORT}`);
});
