const express = require('express');
const { createWorkspace, getWorkspaces, inviteMember } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspaces);
router.post('/:id/invite', protect, inviteMember); // New Invite Route

module.exports = router;