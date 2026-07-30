require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const setupSocket = require('./socket');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend application
const corsOptions = {
  origin: function (origin, callback) {
    // Allow any localhost port in development, or the specific FRONTEND_URL
    if (!origin || origin.startsWith('http://localhost') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: corsOptions
});

// Pass io instance to setup
setupSocket(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('ChatSphere API is running');
});

const { MongoMemoryServer } = require('mongodb-memory-server');

// MongoDB Connection
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    // If we are using the default local URI, use an automatic in-memory database instead so it works out of the box!
    if (!mongoUri || mongoUri.includes('localhost')) {
      console.log('Starting automatic in-memory database...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};
connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
