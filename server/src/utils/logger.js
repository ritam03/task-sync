const { PrismaClient } = require('@prisma/client');
const { getIO } = require('../socket'); // Get the initialized socket instance
const prisma = new PrismaClient();

const logActivity = async (workspaceId, userId, action, entityType, entityTitle, boardId = null) => {
  try {
    // 1. Save to Database
    const log = await prisma.activityLog.create({
      data: {
        workspaceId,
        userId,
        action,
        entityType,
        entityTitle: entityTitle || 'Unknown',
        boardId: boardId || null
      },
      include: {
        user: { select: { name: true } },
        board: { select: { title: true } } // Fetch board title for the UI
      }
    });

    // 2. Emit Real-Time Event to the Workspace
    try {
        const io = getIO();
        io.to(workspaceId).emit("new_activity", log);
    } catch (socketError) {
        console.error("Socket emit failed (Logger)", socketError);
    }

  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

module.exports = { logActivity };