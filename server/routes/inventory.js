const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { protect } = require('../middleware/authMiddleware');

const {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  uploadInvoice,
} = require('../controllers/inventoryController');

router.route('/').get(protect, getInventoryItems).post(protect, createInventoryItem);
router.post('/upload-invoice', protect, upload.single('invoice'), uploadInvoice);
router.route('/:id').get(protect, getInventoryItemById).put(protect, updateInventoryItem).delete(protect, deleteInventoryItem);

module.exports = router;