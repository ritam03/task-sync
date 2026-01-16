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

// @desc    Update card (Move to new list, reorder, change text)
// @route   PUT /api/cards/:id
const updateCard = async (req, res) => {
  const { id } = req.params;
  // listId is sent when moving card to a different column
  const { title, description, order, listId, dueDate, assigneeId } = req.body;

  try {
    const card = await prisma.card.update({
      where: { id },
      data: {
        title,
        description,
        order,
        listId, // This allows moving cards between lists!
        dueDate,
        assigneeId
      }
    });

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
const deleteCard = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.card.delete({ where: { id } });
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCard, updateCard, deleteCard };