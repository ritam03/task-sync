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
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Invite a user to the workspace
// @route   POST /api/workspaces/:id/invite
const inviteMember = async (req, res) => {
  const { id } = req.params; // Workspace ID
  const { email } = req.body;

  try {
    // 1. Verify Requestor is Admin of this workspace
    const requestor = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: req.user.id } }
    });

    if (!requestor || requestor.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can invite members' });
    }

    // 2. Find User to Invite
    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found. They must register first.' });
    }

    // 3. Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: userToInvite.id } }
    });

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // 4. Add Member
    await prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        userId: userToInvite.id,
        role: 'MEMBER'
      }
    });

    res.json({ message: `${userToInvite.name} added to workspace` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createWorkspace, getWorkspaces, inviteMember };