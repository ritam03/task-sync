const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Create a new card
// @route   POST /api/cards
const createCard = async (req, res) => {
  const { listId, title, description } = req.body;

  try {
    const lastCard = await prisma.card.findFirst({
      where: { listId },
      orderBy: { order: 'desc' }
    });

    const newOrder = lastCard ? lastCard.order + 1024 : 1024;

    const card = await prisma.card.create({
      data: {
        listId,
        title,
        description,
        order: newOrder
      }
    });

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update card (Move, Rename, Description, Due Date)
// @route   PUT /api/cards/:id
const updateCard = async (req, res) => {
  const { id } = req.params;
  const { title, description, order, listId, dueDate, assigneeId } = req.body;

  try {
    const card = await prisma.card.update({
      where: { id },
      data: {
        title,
        description,
        order,
        listId,
        dueDate,
        assigneeId
      }
    });

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Single Card Details (for Modal)
// @route   GET /api/cards/:id
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

// @desc    Add Comment to Card
// @route   POST /api/cards/:id/comments
const addComment = async (req, res) => {
  const { id } = req.params; // Card ID
  const { text } = req.body;

  try {
    const comment = await prisma.comment.create({
      data: {
        text,
        cardId: id,
        userId: req.user.id
      },
      include: { user: { select: { name: true } } }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete card (Admin Only)
// @route   DELETE /api/cards/:id
const deleteCard = async (req, res) => {
  const { id } = req.params;

  try {
    // We need to find the workspace ID to check permissions
    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: true } } }
    });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    const workspaceId = card.list.board.workspaceId;

    // RBAC Check
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: req.user.id } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can delete cards' });
    }

    await prisma.card.delete({ where: { id } });
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCard, updateCard, deleteCard, getCard, addComment };