const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Create a new workspace
// @route   POST /api/workspaces
const createWorkspace = async (req, res) => {
  const { name, description } = req.body;

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' } // Auto-add creator as Admin
        }
      }
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all workspaces for the logged-in user
// @route   GET /api/workspaces
const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id // ONLY workspaces where user is a member
          }
        }
      },
      include: {
        members: true, // Include member details if needed
      }
    });

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createWorkspace, getWorkspaces };