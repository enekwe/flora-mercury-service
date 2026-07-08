/**
 * BankAccount Model
 * Tracks Mercury bank accounts created through Flora
 */

const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  routingNumber: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    required: true,
    enum: ['CHECKING', 'SAVINGS'],
    default: 'CHECKING'
  },
  businessName: {
    type: String,
    required: true,
    index: true
  },
  ein: {
    type: String,
    required: true
  },
  businessStructure: {
    type: String,
    required: true,
    enum: ['LLC', 'C_CORP', 'S_CORP', 'PARTNERSHIP', 'SOLE_PROPRIETOR']
  },
  beneficialOwners: [{
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    ssn: {
      encrypted: String,
      iv: String,
      authTag: String
    },
    dateOfBirth: {
      encrypted: String,
      iv: String,
      authTag: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    },
    ownershipPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  status: {
    type: String,
    required: true,
    enum: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'CLOSED'],
    default: 'PENDING_APPROVAL',
    index: true
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  lastBalanceUpdate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
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

// Indexes for common queries
bankAccountSchema.index({ createdBy: 1, status: 1 });
bankAccountSchema.index({ businessName: 'text' });

// Virtual for masked account number
bankAccountSchema.virtual('maskedAccountNumber').get(function() {
  if (!this.accountNumber) return null;
  const last4 = this.accountNumber.slice(-4);
  return `****${last4}`;
});

// Ensure virtuals are included in JSON
bankAccountSchema.set('toJSON', { virtuals: true });
bankAccountSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
