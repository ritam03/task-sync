const express = require('express');
const { createBoard, getBoards, getBoard } = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createBoard);
router.get('/', protect, getBoards);
router.get('/:id', protect, getBoard);

module.exports = router;