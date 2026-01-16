const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/logger'); // Ensure you created this file
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
          create: { userId: req.user.id, role: 'ADMIN' }
        }
      }
    });

    // Log creation (Self-reference not strictly needed, but good for tracking)
    await logActivity(workspace.id, req.user.id, 'CREATED', 'WORKSPACE', name);

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
          some: { userId: req.user.id }
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
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
  const { id } = req.params;
  const { email } = req.body;

  try {
    const requestor = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: req.user.id } }
    });

    if (!requestor || requestor.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can invite members' });
    }

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found. They must register first.' });
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: userToInvite.id } }
    });

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        userId: userToInvite.id,
        role: 'MEMBER'
      }
    });

    // LOG ACTIVITY
    await logActivity(id, req.user.id, 'INVITED', 'MEMBER', userToInvite.name);

    res.json({ message: `${userToInvite.name} added to workspace` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Workspace (Owner Only)
// @route   DELETE /api/workspaces/:id
const deleteWorkspace = async (req, res) => {
  const { id } = req.params;
  try {
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    if (workspace.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the Workspace Owner can delete it.' });
    }

    await prisma.workspace.delete({ where: { id } });
    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Activity Logs (Admin Only)
// @route   GET /api/workspaces/:id/logs
const getWorkspaceLogs = async (req, res) => {
  const { id } = req.params;
  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: req.user.id } }
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only Admins can view activity logs' });
    }

    const logs = await prisma.activityLog.findMany({
      where: { workspaceId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 actions
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createWorkspace, 
  getWorkspaces, 
  inviteMember, 
  deleteWorkspace, 
  getWorkspaceLogs 
};