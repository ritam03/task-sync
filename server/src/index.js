const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const http = require("http");
const { init } = require('./socket'); // Import the socket helper

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

// Initialize Socket.io (using the helper to allow global access)
const io = init(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
  // console.log(`User Connected: ${socket.id}`);

  // 1. Join Workspace Room (For Activity Log Auto-Sync)
  socket.on("join_workspace", (workspaceId) => {
    socket.join(workspaceId);
  });

  // 2. Join Board Room (For Kanban Sync)
  socket.on("join_board", (boardId) => {
    socket.join(boardId);
  });

  // Kanban Events
  socket.on("move_card", (data) => {
    const { boardId, newList, oldList } = data;
    socket.to(boardId).emit("card_moved", { newList, oldList });
  });

  socket.on("add_list", (data) => {
    socket.to(data.boardId).emit("list_added", data.list);
  });
  
  socket.on("add_card", (data) => {
    socket.to(data.boardId).emit("card_added", data.card);
  });

  socket.on("delete_list", (data) => {
    const { boardId, listId } = data;
    socket.to(boardId).emit("list_deleted", listId);
  });

  socket.on("disconnect", () => {
    // console.log("User Disconnected", socket.id);
  });
});

// Database Connection & Server Start
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

startServer();