/**
 * Payment Model
 * Tracks payment instructions and transfers initiated through Mercury
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fromAccountId: {
    type: String,
    required: true,
    index: true
  },
  toAccount: {
    accountNumber: {
      type: String,
      required: true
    },
    routingNumber: {
      type: String,
      required: true
    },
    accountHolderName: {
      type: String,
      required: true
    },
    accountType: {
      type: String,
      enum: ['CHECKING', 'SAVINGS'],
      default: 'CHECKING'
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['ACH', 'WIRE', 'CHECK'],
    default: 'ACH',
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  estimatedDelivery: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  trackingUrl: {
    type: String
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  initiatedBy: {
    type: String,
    required: true,
    index: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
paymentSchema.index({ fromAccountId: 1, status: 1 });
paymentSchema.index({ fromAccountId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, estimatedDelivery: 1 });

// Virtual for total cost (amount + fee)
paymentSchema.virtual('totalCost').get(function() {
  return this.amount + this.fee;
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for masked destination account
paymentSchema.virtual('maskedToAccount').get(function() {
  if (!this.toAccount || !this.toAccount.accountNumber) return null;
  const last4 = this.toAccount.accountNumber.slice(-4);
  return `****${last4}`;
});

// Method to check if payment is complete
paymentSchema.methods.isComplete = function() {
  return this.status === 'COMPLETED';
};

// Method to check if payment is in progress
paymentSchema.methods.isInProgress = function() {
  return ['PENDING', 'PROCESSING'].includes(this.status);
};

// Method to check if payment failed
paymentSchema.methods.isFailed = function() {
  return ['FAILED', 'CANCELLED'].includes(this.status);
};

// Ensure virtuals are included in JSON
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);
