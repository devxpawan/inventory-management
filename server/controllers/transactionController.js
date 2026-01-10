const Transaction = require('../models/transaction');
const InventoryItem = require('../models/inventory');
const PendingReplacement = require('../models/pendingReplacement');

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Public
const createTransaction = async (req, res) => {
  const { itemId, type, quantity, branch, itemTrackingId } = req.body;

  if (!itemId || !type || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if ((type === 'out' || type === 'return') && !branch) {
    return res.status(400).json({ message: 'Branch is required for "out" and "return" transactions' });
  }

  try {
    let item = await InventoryItem.findById(itemId);

    // For 'return' transactions, if item doesn't exist (was deleted after transfer), recreate it
    if (!item && type === 'return') {
      // Find the original transfer transaction to get item details
      const transferTransaction = await Transaction.findOne({ 
        itemId, 
        type: 'transfer',
        itemTrackingId 
      }).sort({ createdAt: -1 });

      if (!transferTransaction) {
        return res.status(404).json({ message: 'Original transfer transaction not found' });
      }

      // Recreate the item in inventory
      item = new InventoryItem({
        _id: itemId,
        name: transferTransaction.itemName,
        category: transferTransaction.itemCategory,
        quantity: 0, // Will be updated below
        location: 'Main Inventory', // Default location for returned items
        supplier: '',
        model: transferTransaction.model || '',
        serialNumber: transferTransaction.serialNumber || '',
        status: 'in-stock',
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id,
      });
    }

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (type === 'out' && item.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock for this transaction' });
    }

    // Update inventory item quantity
    if (type === 'out') {
      item.quantity -= quantity;
    } else { // 'in' or 'return'
      item.quantity += quantity;
    }
    
    let updatedItem;
    let itemDeleted = false;

    // If quantity reaches 0 after 'out' transaction, delete the item
    if (type === 'out' && item.quantity === 0) {
      await item.deleteOne();
      itemDeleted = true;
      updatedItem = { ...item.toObject(), quantity: 0, status: 'out-of-stock' };
    } else {
      // Determine item status based on stock levels
      if (item.quantity === 0) {
        item.status = 'out-of-stock';
      } else {
        item.status = 'in-stock';
      }
      item.lastUpdatedBy = req.user._id;
      updatedItem = await item.save();
    }

    // Create the transaction
    const transaction = new Transaction({
      itemId,
      itemName: item.name,
      itemCategory: item.category,
      type,
      quantity,
      branch,
      itemTrackingId, // Include itemTrackingId if provided
      performedBy: req.user._id,
    });

    const createdTransaction = await transaction.save();

    res.status(201).json({
      transaction: createdTransaction,
      item: updatedItem,
      itemDeleted, // Flag to indicate if item was deleted
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transfer an inventory item to a branch
// @route   POST /api/transactions/transfer
// @access  Public
const transferItem = async (req, res) => {
  const { itemId, itemName, itemCategory, quantity, branch, assetNumber, model, serialNumber, itemTrackingId, reason } = req.body;

  // Validate required fields
  // If itemId is provided, we use it. If not, we need itemName and itemCategory to create a new one.
  if ((!itemId && (!itemName || !itemCategory)) || !quantity || !branch || !itemTrackingId) {
    return res.status(400).json({ message: 'Missing required fields. Provide either itemId OR (itemName and itemCategory), plus quantity, branch, and itemTrackingId.' });
  }

  // Validate Item Tracking ID format
  if (!itemTrackingId.startsWith('CRE')) {
    return res.status(400).json({ message: 'Item Tracking ID must start with "CRE"' });
  }

  // Validate Reason
  const validReasons = ['New Equipment', 'Replacement Equipment', 'Repaired'];
  const isValidReason = validReasons.some(r => reason === r || reason.startsWith(r + ' - '));
  
  if (reason && !isValidReason) {
    return res.status(400).json({ message: 'Invalid reason provided' });
  }

  try {
    let item;
    let isDirectTransfer = false;

    if (itemId) {
      item = await InventoryItem.findById(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
    } else {
      // Direct Transfer: Create a new transient item
      item = await InventoryItem.create({
        name: itemName,
        category: itemCategory,
        quantity: quantity, // Initialize with the transfer quantity so it zeros out
        branch: 'Main Inventory', // Temporary location
        location: 'Main Inventory', // Required field
        purchaseDate: new Date(), // Required field
        status: 'in-stock',
        model: model || '',
        serialNumber: serialNumber || '',
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id,
      });
      isDirectTransfer = true;
    }

    if (item.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock for this transfer' });
    }

    // Decrement quantity from current location
    item.quantity -= quantity;

    let updatedItem;
    let itemDeleted = false;

    // If quantity reaches 0, delete the item from inventory
    if (item.quantity === 0) {
      await item.deleteOne();
      itemDeleted = true;
      // Keep a reference to the item for the response
      updatedItem = { ...item.toObject(), quantity: 0, status: 'transferred' };
    } else {
      // Otherwise, update the item status
      item.status = 'in-stock';
      item.lastUpdatedBy = req.user._id;
      updatedItem = await item.save();
    }

    // Create the transfer transaction
    const transaction = new Transaction({
      itemId: item._id, // Use the (possibly deleted) item's ID
      itemName: item.name,
      itemCategory: item.category,
      type: 'transfer',
      quantity,
      branch,
      assetNumber,
      model,
      serialNumber,
      itemTrackingId,
      reason,
      performedBy: req.user._id,
    });

    const createdTransaction = await transaction.save();

    // If reason is Replacement Equipment, add to PendingReplacement
    if (reason && reason.startsWith('Replacement Equipment')) {
      await PendingReplacement.create({
        transactionId: createdTransaction._id,
        itemId: item._id,
        itemName: item.name,
        branch,
        itemTrackingId,
        reason,
        status: 'Pending'
      });
    }

    res.status(201).json({
      transaction: createdTransaction,
      item: updatedItem,
      itemDeleted, // Flag to indicate if item was deleted
      isDirectTransfer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all transactions for a specific item
// @route   GET /api/transactions/:itemId
// @access  Public
const getTransactionsByItem = async (req, res) => {
  try {
    const transactions = await Transaction.find({ itemId: req.params.itemId }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all unique branches from transactions
// @route   GET /api/transactions/branches
// @access  Public
const getBranches = async (req, res) => {
  try {
    const branches = await Transaction.distinct('branch', { type: 'out' });
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all items for a specific branch
// @route   GET /api/transactions/branch/:branchName
// @access  Public
const getItemsByBranch = async (req, res) => {
  try {
    const branchName = req.params.branchName;
    const items = await Transaction.aggregate([
      { $match: { type: 'out', branch: branchName } },
      {
        $group: {
          _id: '$itemId',
          quantity: { $sum: '$quantity' },
        },
      },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      { $unwind: '$itemDetails' },
      {
        $project: {
          _id: '$itemDetails._id',
          name: '$itemDetails.name',
          category: '$itemDetails.category',
          location: '$itemDetails.location',
          supplier: '$itemDetails.supplier',
          quantity: '$quantity',
        },
      },
    ]);
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all transferred items, grouped by branch
// @route   GET /api/transactions/transferred-items
// @access  Public
const getAllTransferredItems = async (req, res) => {
  try {
    const transferredItems = await Transaction.aggregate([
      { $match: { type: { $in: ['transfer', 'return'] } } }, // Match both 'transfer' and 'return' transactions
      { $sort: { createdAt: 1 } }, // Ensure transactions are processed in order
      {
        $addFields: {
          // Make return quantities negative for proper calculation
          adjustedQuantity: {
            $cond: {
              if: { $eq: ['$type', 'return'] },
              then: { $multiply: ['$quantity', -1] },
              else: '$quantity'
            }
          }
        }
      },
      {
        $group: {
          _id: {
            branch: '$branch',
            itemId: '$itemId',
            itemTrackingId: '$itemTrackingId'
          },
          netQuantity: { $sum: '$adjustedQuantity' },
          // Get the last transfer's details for display
          assetNumber: { $last: '$assetNumber' },
          model: { $last: '$model' },
          serialNumber: { $last: '$serialNumber' },
          reason: { $last: '$reason' },
          // Store original item info from transaction in case item is deleted
          itemName: { $last: '$itemName' },
          itemCategory: { $last: '$itemCategory' },
          transferDate: { $last: '$createdAt' },
        },
      },
      // Filter out items with zero or negative net quantity
      { $match: { netQuantity: { $gt: 0 } } },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id.itemId',
          foreignField: '_id',
          as: 'itemDetails',
        },
      },
      // Use preserveNullAndEmptyArrays to keep items even if inventory item is deleted
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          branch: '$_id.branch',
          id: '$_id.itemId',
          // Use itemDetails if available, otherwise use stored transaction data
          name: { $ifNull: ['$itemDetails.name', '$itemName'] },
          category: { $ifNull: ['$itemDetails.category', '$itemCategory'] },
          quantity: '$netQuantity',
          assetNumber: '$assetNumber',
          model: '$model',
          serialNumber: '$serialNumber',
          itemTrackingId: '$_id.itemTrackingId',
          reason: '$reason',
          transferDate: '$transferDate',
        },
      },
      {
        $group: {
          _id: '$branch',
          items: {
            $push: {
              id: '$id',
              name: '$name',
              category: '$category',
              quantity: '$quantity',
              assetNumber: '$assetNumber',
              model: '$model',
              serialNumber: '$serialNumber',
              itemTrackingId: '$itemTrackingId',
              reason: '$reason',
              transferDate: '$transferDate',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          branch: '$_id',
          items: 1,
        },
      },
    ]);
    res.status(200).json(transferredItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit logs for superadmin
// @route   GET /api/transactions/audit-logs
// @access  Private/Superadmin
const getAuditLogs = async (req, res) => {
  try {
    const logs = await Transaction.find({})
      .populate('performedBy', 'username role')
      .sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an audit log
// @route   DELETE /api/transactions/audit-logs/:id
// @access  Private/Superadmin
const deleteAuditLog = async (req, res) => {
  try {
    const log = await Transaction.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    await log.deleteOne();
    res.status(200).json({ message: 'Audit log removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending replacements
// @route   GET /api/transactions/pending-replacements
// @access  Public
const getPendingReplacements = async (req, res) => {
  try {
    const pending = await PendingReplacement.find({}).sort({ createdAt: -1 });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm a pending replacement
// @route   PUT /api/transactions/pending-replacements/:id/confirm
// @access  Public
const confirmPendingReplacement = async (req, res) => {
  try {
    const pending = await PendingReplacement.findById(req.params.id);

    if (!pending) {
      return res.status(404).json({ message: 'Pending replacement not found' });
    }

    // Get replacement details from request body
    const { replacementAssetNumber, replacementSerialNumber } = req.body;

    // Fetch item to get category
    const item = await InventoryItem.findById(pending.itemId);

    // Fetch original transaction to get the NEW serial/asset number
    const originalTransaction = await Transaction.findById(pending.transactionId);
    const newSerialNumber = originalTransaction ? originalTransaction.serialNumber : null;
    const newAssetNumber = originalTransaction ? originalTransaction.assetNumber : null;

    // Build detailed reason with replacement information
    let confirmationReason = `Confirmed replacement: ${pending.reason}`;
    if (replacementAssetNumber || replacementSerialNumber) {
      confirmationReason += ' | Replaced: ';
      if (replacementAssetNumber) {
        confirmationReason += `Asset #${replacementAssetNumber}`;
      }
      if (replacementSerialNumber) {
        if (replacementAssetNumber) confirmationReason += ', ';
        confirmationReason += `S/N: ${replacementSerialNumber}`;
      }
    }

    // Create a confirmation transaction log
    await Transaction.create({
      itemId: pending.itemId,
      itemName: pending.itemName,
      itemCategory: item ? item.category : 'Replacement',
      type: 'confirmation',
      quantity: 1,
      branch: pending.branch,
      itemTrackingId: pending.itemTrackingId,
      reason: confirmationReason,
      assetNumber: newAssetNumber,
      serialNumber: newSerialNumber,
      replacedAssetNumber: replacementAssetNumber,
      replacedSerialNumber: replacementSerialNumber,
      performedBy: req.user._id
    });

    // Remove from pending list (delete the document)
    await pending.deleteOne();

    res.status(200).json({ message: 'Pending replacement confirmed and removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all confirmed replacements
// @route   GET /api/transactions/confirmed-replacements
// @access  Public
const getConfirmedReplacements = async (req, res) => {
  try {
    const confirmed = await Transaction.find({ type: 'confirmation' })
      .populate('performedBy', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json(confirmed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
