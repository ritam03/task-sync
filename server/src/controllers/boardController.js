const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Create a new board in a workspace
// @route   POST /api/boards
const createBoard = async (req, res) => {
  const { title, workspaceId, bgImage } = req.body;

  try {
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
          orderBy: { order: 'asc' }, 
          include: {
            cards: {
              orderBy: { order: 'asc' }, 
            }
          }
        }
      }
    });

    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Check Membership & Return Role
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: req.user.id } }
    });
    
    if (!member) return res.status(403).json({ message: 'Not authorized' });

    // Combine board data with the user's role (ADMIN/MEMBER)
    res.json({ ...board, role: member.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Board (Admin Only)
// @route   DELETE /api/boards/:id
const deleteBoard = async (req, res) => {
  const { id } = req.params;

  try {
    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // RBAC: Check if Admin
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: req.user.id } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can delete boards' });
    }

    await prisma.board.delete({ where: { id } });
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBoard, getBoards, getBoard, deleteBoard };