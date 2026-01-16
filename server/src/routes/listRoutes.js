const express = require('express');
const { createList, updateList, deleteList } = require('../controllers/listController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createList);
router.put('/:id', protect, updateList);
router.delete('/:id', protect, deleteList);

module.exports = router;