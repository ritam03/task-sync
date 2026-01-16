const express = require('express');
const { createWorkspace, getWorkspaces } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware'); // Import Middleware

const router = express.Router();

router.post('/', protect, createWorkspace); // Protected
router.get('/', protect, getWorkspaces);    // Protected

module.exports = router;