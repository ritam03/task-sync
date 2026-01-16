const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const http = require("http"); // Import HTTP
const { Server } = require("socket.io"); // Import Socket.io

// Import Routes
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join a Board Room
  socket.on("join_board", (boardId) => {
    socket.join(boardId);
    console.log(`User ${socket.id} joined board: ${boardId}`);
  });

  // Handle Card Movement
  socket.on("move_card", (data) => {
    const { boardId, newList, oldList } = data;
    // Broadcast to everyone else in the room
    socket.to(boardId).emit("card_moved", { newList, oldList });
  });

  // Handle New List Creation
  socket.on("add_list", (data) => {
    socket.to(data.boardId).emit("list_added", data.list);
  });
  
  // Handle New Card Creation
  socket.on("add_card", (data) => {
    socket.to(data.boardId).emit("card_added", data.card);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "TaskSync Server is running" });
});

// Database Connection Test
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    // CHANGE: app.listen -> server.listen
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

startServer();