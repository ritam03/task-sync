const express = require('express');
const { createCard, updateCard, deleteCard } = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createCard);
router.put('/:id', protect, updateCard);
router.delete('/:id', protect, deleteCard);

module.exports = router;