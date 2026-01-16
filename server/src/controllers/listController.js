const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/logger');
const prisma = new PrismaClient();

// @desc    Create a new list
const createList = async (req, res) => {
  const { boardId, title } = req.body;

  try {
    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' }
    });

    const newOrder = lastList ? lastList.order + 1024 : 1024;

    const list = await prisma.list.create({
      data: { boardId, title, order: newOrder },
      include: { board: true } // Need board for workspaceId & logging
    });

    // LOG: Pass boardId as last argument
    await logActivity(list.board.workspaceId, req.user.id, 'CREATED', 'LIST', title, boardId);

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update list (Title)
const updateList = async (req, res) => {
  const { id } = req.params;
  const { title, order } = req.body;

  try {
    const originalList = await prisma.list.findUnique({
      where: { id },
      include: { board: true }
    });

    if (!originalList) return res.status(404).json({ message: 'List not found' });

    const list = await prisma.list.update({
      where: { id },
      data: { title, order }
    });

    // LOG: Only if title changed
    if (title && title !== originalList.title) {
       await logActivity(
         originalList.board.workspaceId, 
         req.user.id, 
         'RENAMED', 
         'LIST', 
         `From "${originalList.title}" to "${title}"`,
         originalList.boardId
       );
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete list (Admin Only)
const deleteList = async (req, res) => {
  const { id } = req.params;

  try {
    const list = await prisma.list.findUnique({
      where: { id },
      include: { board: true }
    });

    if (!list) return res.status(404).json({ message: 'List not found' });

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: list.board.workspaceId, userId: req.user.id } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can delete lists' });
    }

    await prisma.list.delete({ where: { id } });

    // LOG
    await logActivity(list.board.workspaceId, req.user.id, 'DELETED', 'LIST', list.title, list.boardId);

    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createList, updateList, deleteList };