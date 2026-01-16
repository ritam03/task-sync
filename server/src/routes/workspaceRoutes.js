const express = require('express');
const { 
  createWorkspace, 
  getWorkspaces, 
  inviteMember, 
  deleteWorkspace, 
  getWorkspaceLogs 
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspaces);
router.delete('/:id', protect, deleteWorkspace);      // Delete Workspace
router.post('/:id/invite', protect, inviteMember);
router.get('/:id/logs', protect, getWorkspaceLogs);   // Get Activity Logs

module.exports = router;