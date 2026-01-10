const express = require('express');
const router = express.Router();
const { protect, superadmin } = require('../middleware/authMiddleware');
const {
  createTransaction,
  transferItem,
  getTransactionsByItem,
  getBranches,
  getItemsByBranch,
  getAllTransferredItems,
  getAuditLogs,
  deleteAuditLog,
  getPendingReplacements,
  confirmPendingReplacement,
  getConfirmedReplacements,
} = require('../controllers/transactionController');

router.route('/').post(protect, createTransaction);
router.route('/transfer').post(protect, transferItem);
router.route('/branches').get(protect, getBranches);
router.route('/transferred-items').get(protect, getAllTransferredItems);
router.route('/pending-replacements').get(protect, getPendingReplacements);
router.route('/pending-replacements/:id/confirm').put(protect, confirmPendingReplacement);
router.route('/confirmed-replacements').get(protect, getConfirmedReplacements);
router.route('/audit-logs').get(protect, superadmin, getAuditLogs);
router.route('/audit-logs/:id').delete(protect, superadmin, deleteAuditLog);
router.route('/branch/:branchName').get(protect, getItemsByBranch);
router.route('/:itemId').get(protect, getTransactionsByItem);

module.exports = router;
