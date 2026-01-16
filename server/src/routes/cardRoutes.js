const express = require('express');
const { createCard, updateCard, deleteCard, getCard, addComment } = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createCard);
router.put('/:id', protect, updateCard);
router.delete('/:id', protect, deleteCard); // Added Delete
router.get('/:id', protect, getCard);       // Added Get Detail
router.post('/:id/comments', protect, addComment); // Added Comment

module.exports = router;