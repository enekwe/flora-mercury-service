/**
 * Transaction Model
 * Tracks bank account transactions from Mercury
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accountId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['DEBIT', 'CREDIT'],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  counterparty: {
    type: String
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
    default: 'PENDING',
    index: true
  },
  postedAt: {
    type: Date,
    index: true
  },
  category: {
    type: String,
    enum: [
      'REVENUE',
      'PAYROLL',
      'VENDOR_PAYMENT',
      'SUBSCRIPTION',
      'TRANSFER',
      'FEE',
      'REFUND',
      'OTHER'
    ]
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
transactionSchema.index({ accountId: 1, postedAt: -1 });
transactionSchema.index({ accountId: 1, type: 1, status: 1 });
transactionSchema.index({ accountId: 1, createdAt: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Method to categorize transaction automatically
transactionSchema.methods.autoCategorizate = function() {
  const desc = this.description.toLowerCase();

  if (desc.includes('payroll') || desc.includes('salary')) {
    this.category = 'PAYROLL';
  } else if (desc.includes('subscription') || desc.includes('saas')) {
    this.category = 'SUBSCRIPTION';
  } else if (desc.includes('vendor') || desc.includes('payment')) {
    this.category = 'VENDOR_PAYMENT';
  } else if (desc.includes('revenue') || desc.includes('customer')) {
    this.category = 'REVENUE';
  } else if (desc.includes('transfer')) {
    this.category = 'TRANSFER';
  } else if (desc.includes('fee')) {
    this.category = 'FEE';
  } else if (desc.includes('refund')) {
    this.category = 'REFUND';
  } else {
    this.category = 'OTHER';
  }

  return this.category;
};

// Ensure virtuals are included in JSON
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema);
