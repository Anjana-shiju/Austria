require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const path = require("path");
const { ChatMessage } = require('./models/index');

// ─── Init ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://austria-frontend.vercel.app",
 
];

// ─── Socket.io ────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Track online users
const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name _id');

    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 ${socket.user.name} connected`);

  onlineUsers.set(socket.id, {
    userId: socket.user._id,
    name: socket.user.name
  });

  io.emit('online_count', onlineUsers.size);
  socket.broadcast.emit('user_joined', { name: socket.user.name });

  socket.on('chat_message', async ({ message }) => {
    try {
      if (!message?.trim()) return;

      const msg = await ChatMessage.create({
        sender: socket.user._id,
        message: message.trim()
      });

      const populated = await msg.populate('sender', 'name university');

      io.emit('new_message', {
        _id: populated._id,
        sender: populated.sender,
        message: populated.message,
        createdAt: populated.createdAt,
        type: 'text'
      });

    } catch (err) {
      console.error('Chat error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ ${socket.user.name} disconnected`);
    onlineUsers.delete(socket.id);
    io.emit('online_count', onlineUsers.size);
  });
});

// ─── Middlewares ──────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests, try again later'
  }
});

app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

// ─── Admin Seed ───────────────────────────────────────
const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (!exists) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        university: 'Admin',
        country: 'Austria'
      });

      console.log('✅ Admin user created');
    }

  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

// ─── Start ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdmin();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
  });
});