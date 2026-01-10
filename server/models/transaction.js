const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      // Required mostly, but not for system-wide events like User creation
      required: function() {
        return !['create_user', 'delete_user', 'create_category', 'delete_category', 'system_change'].includes(this.type);
      }
    },
    itemName: {
      type: String,
    },
    itemCategory: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'in', 'out', 'return', 'transfer', 'confirmation', 
        'create_item', 'update_item', 'delete_item', 
        'create_category', 'delete_category', 
        'create_user', 'delete_user', 
        'system_change'
      ],
    },
    quantity: {
      type: Number,
      // Quantity is not relevant for system configuration changes
      required: function() {
        return !['create_item', 'update_item', 'delete_item', 'create_user', 'delete_user', 'create_category', 'delete_category', 'system_change'].includes(this.type);
      }
    },
    branch: {
      type: String,
      // Required for 'out', 'return', or 'transfer' transactions
      required: function () {
        return this.type === 'out' || this.type === 'return' || this.type === 'transfer';
      },
    },
    assetNumber: {
      type: String,
    },
    replacedAssetNumber: {
      type: String,
    },
    model: {
      type: String,
    },
    serialNumber: {
      type: String,
    },
    replacedSerialNumber: {
      type: String,
    },
    itemTrackingId: {
      type: String,
      // Required for 'transfer' transactions, optional for 'return'
      required: function () {
        return this.type === 'transfer';
      },
    },
    reason: {
      type: String,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
