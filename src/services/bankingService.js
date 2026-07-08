/**
 * Banking Service
 * Business logic for Mercury banking operations
 */

const MercuryClient = require('./mercuryClient');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const encryptionService = require('./encryptionService');
const logger = require('../config/logger');

class BankingService {
  constructor() {
    this.mercuryClient = new MercuryClient();
  }

  /**
   * Create a new Mercury bank account
   * @param {Object} data - Account creation data
   * @param {String} userId - User ID creating the account
   * @returns {Object} Created account details
   */
  async createAccount(data, userId) {
    try {
      // Encrypt sensitive PII before storing
      const encryptedOwners = data.beneficialOwners.map(owner => {
        const ssnEncrypted = encryptionService.encrypt(owner.ssn);
        const dobEncrypted = encryptionService.encrypt(owner.dateOfBirth);

        return {
          name: owner.name,
          email: owner.email,
          ssn: ssnEncrypted,
          dateOfBirth: dobEncrypted,
          address: owner.address,
          ownershipPercentage: owner.ownershipPercentage
        };
      });

      // Create account via Mercury API
      const mercuryAccount = await this.mercuryClient.createAccount({
        ...data,
        beneficialOwners: data.beneficialOwners // Send unencrypted to API
      });

      // Store account record in database
      const account = new BankAccount({
        accountId: mercuryAccount.accountId,
        accountNumber: mercuryAccount.accountNumber,
        routingNumber: mercuryAccount.routingNumber,
        accountType: mercuryAccount.accountType,
        businessName: data.businessName,
        ein: data.ein,
        businessStructure: data.businessStructure,
        beneficialOwners: encryptedOwners, // Store encrypted
        status: mercuryAccount.status,
        availableBalance: mercuryAccount.availableBalance,
        currentBalance: mercuryAccount.currentBalance,
        createdBy: userId,
        createdAt: mercuryAccount.createdAt
      });

      await account.save();

      logger.info(`Bank account created: ${account.accountId} for user: ${userId}`);

      return {
        accountId: account.accountId,
        accountNumber: account.accountNumber,
        routingNumber: account.routingNumber,
        accountType: account.accountType,
        businessName: account.businessName,
        status: account.status,
        availableBalance: account.availableBalance,
        currentBalance: account.currentBalance,
        createdAt: account.createdAt
      };
    } catch (error) {
      logger.error(`Create account error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get account balance
   * @param {String} accountId - Mercury account ID
   * @param {String} userId - User ID requesting balance
   * @returns {Object} Balance information
   */
  async getAccountBalance(accountId, userId) {
    try {
      // Verify user has access to this account
      const account = await BankAccount.findOne({ accountId });

      if (!account) {
        throw new Error('Account not found');
      }

      // Get live balance from Mercury
      const balance = await this.mercuryClient.getAccountBalance(accountId);

      // Update stored balance
      account.availableBalance = balance.availableBalance;
      account.currentBalance = balance.currentBalance;
      account.lastBalanceUpdate = new Date();
      await account.save();

      logger.info(`Balance retrieved for account: ${accountId}`);

      return {
        accountId: balance.accountId,
        businessName: account.businessName,
        accountType: account.accountType,
        availableBalance: balance.availableBalance,
        currentBalance: balance.currentBalance,
        pendingBalance: balance.pendingBalance,
        currency: balance.currency,
        lastUpdated: balance.lastUpdated
      };
    } catch (error) {
      logger.error(`Get balance error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get account transactions
   * @param {String} accountId - Mercury account ID
   * @param {Object} options - Query options
   * @param {String} userId - User ID requesting transactions
   * @returns {Object} Transaction list
   */
  async getTransactions(accountId, options = {}, userId) {
    try {
      // Verify user has access to this account
      const account = await BankAccount.findOne({ accountId });

      if (!account) {
        throw new Error('Account not found');
      }

      // Get transactions from Mercury
      const result = await this.mercuryClient.getTransactions(accountId, options);

      // Store/update transactions in database
      for (const tx of result.transactions) {
        await Transaction.findOneAndUpdate(
          { transactionId: tx.id },
          {
            transactionId: tx.id,
            accountId: accountId,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            counterparty: tx.counterparty,
            status: tx.status,
            postedAt: tx.postedAt,
            createdAt: tx.createdAt
          },
          { upsert: true, new: true }
        );
      }

      logger.info(`Retrieved ${result.transactions.length} transactions for account: ${accountId}`);

      return result;
    } catch (error) {
      logger.error(`Get transactions error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initiate a payment
   * @param {Object} data - Payment data
   * @param {String} userId - User ID initiating payment
   * @returns {Object} Payment confirmation
   */
  async initiatePayment(data, userId) {
    try {
      // Verify source account exists and user has access
      const account = await BankAccount.findOne({ accountId: data.fromAccountId });

      if (!account) {
        throw new Error('Source account not found');
      }

      // Check if account has sufficient balance (if not in mock mode)
      if (process.env.MOCK_MODE !== 'true') {
        const balance = await this.mercuryClient.getAccountBalance(data.fromAccountId);
        if (balance.availableBalance < data.amount) {
          throw new Error('Insufficient funds');
        }
      }

      // Generate idempotency key if not provided
      const idempotencyKey = data.idempotencyKey || `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initiate payment via Mercury API
      const payment = await this.mercuryClient.initiatePayment({
        ...data,
        idempotencyKey
      });

      // Store payment record in database
      const paymentRecord = new Payment({
        paymentId: payment.paymentId,
        fromAccountId: payment.fromAccountId,
        toAccount: data.toAccount,
        amount: payment.amount,
        fee: payment.fee,
        currency: data.currency || 'USD',
        description: data.description,
        paymentMethod: data.paymentMethod || 'ACH',
        status: payment.status,
        estimatedDelivery: payment.estimatedDelivery,
        trackingUrl: payment.trackingUrl,
        idempotencyKey,
        initiatedBy: userId,
        createdAt: payment.createdAt
      });

      await paymentRecord.save();

      logger.info(`Payment initiated: ${payment.paymentId} by user: ${userId}`);

      return {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount,
        fee: payment.fee,
        estimatedDelivery: payment.estimatedDelivery,
        trackingUrl: payment.trackingUrl,
        createdAt: payment.createdAt
      };
    } catch (error) {
      logger.error(`Initiate payment error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment status
   * @param {String} paymentId - Payment ID
   * @param {String} userId - User ID requesting status
   * @returns {Object} Payment details
   */
  async getPaymentStatus(paymentId, userId) {
    try {
      // Get payment from database
      const payment = await Payment.findOne({ paymentId });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Get live status from Mercury
      const mercuryPayment = await this.mercuryClient.getPaymentStatus(paymentId);

      // Update payment record
      payment.status = mercuryPayment.status;
      payment.completedAt = mercuryPayment.completedAt;
      payment.failureReason = mercuryPayment.failureReason;
      await payment.save();

      logger.info(`Payment status retrieved: ${paymentId} - ${mercuryPayment.status}`);

      return {
        paymentId: mercuryPayment.paymentId,
        status: mercuryPayment.status,
        fromAccountId: mercuryPayment.fromAccountId,
        toAccount: mercuryPayment.toAccount,
        amount: mercuryPayment.amount,
        fee: mercuryPayment.fee,
        completedAt: mercuryPayment.completedAt,
        failureReason: mercuryPayment.failureReason,
        createdAt: mercuryPayment.createdAt
      };
    } catch (error) {
      logger.error(`Get payment status error: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all accounts for a user
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Object} Account list with pagination
   */
  async listAccounts(filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.accountType) query.accountType = filters.accountType;
      if (filters.businessName) query.businessName = new RegExp(filters.businessName, 'i');
      if (filters.createdBy) query.createdBy = filters.createdBy;

      const accounts = await BankAccount.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-beneficialOwners'); // Don't return encrypted PII

      const total = await BankAccount.countDocuments(query);

      logger.info(`Listed ${accounts.length} accounts`);

      return {
        accounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`List accounts error: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all payments for an account
   * @param {String} accountId - Account ID
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Object} Payment list with pagination
   */
  async listPayments(accountId, filters = {}, pagination = {}) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      const query = { fromAccountId: accountId };
      if (filters.status) query.status = filters.status;
      if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments(query);

      logger.info(`Listed ${payments.length} payments for account: ${accountId}`);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`List payments error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BankingService;
