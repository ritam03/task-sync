const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Create a new list
// @route   POST /api/lists
const createList = async (req, res) => {
  const { boardId, title } = req.body;

  try {
    // Find the last list to calculate new order position
    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' }
    });

    const newOrder = lastList ? lastList.order + 1024 : 1024; // Gap logic for easier reordering

    const list = await prisma.list.create({
      data: {
        boardId,
        title,
        order: newOrder
      }
    });

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update list (Title or Order)
// @route   PUT /api/lists/:id
const updateList = async (req, res) => {
  const { id } = req.params;
  const { title, order } = req.body;

  try {
    const list = await prisma.list.update({
      where: { id },
      data: { title, order }
    });

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete list (Admin Only)
// @route   DELETE /api/lists/:id
const deleteList = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Find the list and its parent board to check workspace permissions
    const list = await prisma.list.findUnique({
      where: { id },
      include: { board: true }
    });

    if (!list) return res.status(404).json({ message: 'List not found' });

    // 2. Check if the User is an ADMIN of the Workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: list.board.workspaceId,
          userId: req.user.id
        }
      }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can delete lists' });
    }

    // 3. Delete the list
    await prisma.list.delete({ where: { id } });
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createList, updateList, deleteList };