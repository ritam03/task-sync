const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Create a new board in a workspace
// @route   POST /api/boards
const createBoard = async (req, res) => {
  const { title, workspaceId, bgImage } = req.body;

  try {
    // Security: Verify user belongs to this workspace
    const isMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.user.id
        }
      }
    });

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to create boards in this workspace' });
    }

    const board = await prisma.board.create({
      data: {
        title,
        workspaceId,
        bgImage,
      }
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all boards for a specific workspace
// @route   GET /api/boards?workspaceId=...
const getBoards = async (req, res) => {
  const { workspaceId } = req.query;

  try {
     // Security check (reusing the same logic is good practice)
     const isMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: req.user.id } }
      });
  
      if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single board with Lists and Cards
// @route   GET /api/boards/:id
const getBoard = async (req, res) => {
  const { id } = req.params;

  try {
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          orderBy: { order: 'asc' }, // Sort lists by position
          include: {
            cards: {
              orderBy: { order: 'asc' }, // Sort cards by position
            }
          }
        }
      }
    });

    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Ensure user has access to this board's workspace
    // Note: In a real app, you might cache this permission check
    const isMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: req.user.id } }
    });
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBoard, getBoards, getBoard };