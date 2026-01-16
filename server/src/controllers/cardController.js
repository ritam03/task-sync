const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/logger');
const prisma = new PrismaClient();

// @desc    Create a new card
const createCard = async (req, res) => {
  const { listId, title, description } = req.body;

  try {
    const lastCard = await prisma.card.findFirst({ where: { listId }, orderBy: { order: 'desc' } });
    const newOrder = lastCard ? lastCard.order + 1024 : 1024;

    const card = await prisma.card.create({
      data: { listId, title, description, order: newOrder }
    });

    // Log with Board Context
    const list = await prisma.list.findUnique({ where: { id: listId }, include: { board: true } });
    if (list) {
        await logActivity(list.board.workspaceId, req.user.id, 'CREATED', 'CARD', title, list.board.id);
    }

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update card (Smart Logging)
const updateCard = async (req, res) => {
  const { id } = req.params;
  const { title, description, order, listId, dueDate, assigneeId } = req.body;

  try {
    // 1. Get old state to compare
    const oldCard = await prisma.card.findUnique({
        where: { id },
        include: { list: { include: { board: true } } }
    });

    if (!oldCard) return res.status(404).json({ message: 'Card not found' });
    const workspaceId = oldCard.list.board.workspaceId;
    const boardId = oldCard.list.board.id;

    // 2. Perform Update
    const updatedCard = await prisma.card.update({
      where: { id },
      data: { title, description, order, listId, dueDate, assigneeId }
    });

    // 3. Smart Granular Logging with Board Context
    if (listId && listId !== oldCard.listId) {
        const newList = await prisma.list.findUnique({ where: { id: listId } });
        await logActivity(workspaceId, req.user.id, 'MOVED', 'CARD', `"${updatedCard.title}" to ${newList.title}`, boardId);
    } 
    else if (title && title !== oldCard.title) {
        await logActivity(workspaceId, req.user.id, 'RENAMED', 'CARD', `"${oldCard.title}" to "${title}"`, boardId);
    }
    else if (description && description !== oldCard.description) {
        await logActivity(workspaceId, req.user.id, 'UPDATED', 'CARD', `Description of "${updatedCard.title}"`, boardId);
    }
    else if (dueDate && new Date(dueDate).toISOString() !== new Date(oldCard.dueDate)?.toISOString()) {
         await logActivity(workspaceId, req.user.id, 'SCHEDULED', 'CARD', `"${updatedCard.title}" due ${new Date(dueDate).toLocaleDateString()}`, boardId);
    }

    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Comment
const addComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const comment = await prisma.comment.create({
      data: { text, cardId: id, userId: req.user.id },
      include: { user: { select: { name: true } } }
    });
    
    // Log Comment
    const card = await prisma.card.findUnique({ where: { id }, include: { list: { include: { board: true } } } });
    if(card) {
        await logActivity(card.list.board.workspaceId, req.user.id, 'COMMENTED', 'CARD', `on "${card.title}"`, card.list.board.id);
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Card
const getCard = async (req, res) => {
  const { id } = req.params;
  try {
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        comments: {
          include: { user: { select: { name: true, id: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Card
const deleteCard = async (req, res) => {
  const { id } = req.params;

  try {
    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: true } } }
    });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    const workspaceId = card.list.board.workspaceId;
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: req.user.id } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can delete cards' });
    }

    await prisma.card.delete({ where: { id } });

    // Log
    await logActivity(workspaceId, req.user.id, 'DELETED', 'CARD', card.title, card.list.board.id);

    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCard, updateCard, addComment, getCard, deleteCard };