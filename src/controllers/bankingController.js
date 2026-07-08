/**
 * Banking Controller
 * Handles HTTP requests for Mercury banking operations
 */

const BankingService = require('../services/bankingService');
const logger = require('../config/logger');

const bankingService = new BankingService();

class BankingController {
  /**
   * POST /api/accounts/create
   * Create new Mercury bank account
   */
  async createAccount(req, res) {
    try {
      const userId = req.user?.id; // From JWT auth middleware
      const data = req.body;

      logger.info(`Creating Mercury account for: ${data.businessName} by user: ${userId}`);

      const result = await bankingService.createAccount(data, userId);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Create account error: ${error.message}`);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/accounts/:accountId/balance
   * Get account balance
   */
  async getAccountBalance(req, res) {
    try {
      const { accountId } = req.params;
      const userId = req.user?.id;

      logger.info(`Getting balance for account: ${accountId} by user: ${userId}`);

      const balance = await bankingService.getAccountBalance(accountId, userId);

      res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      logger.error(`Get balance error: ${error.message}`);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/accounts/:accountId/transactions
   * Get account transactions
   */
  async getTransactions(req, res) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate, type, limit, offset } = req.query;
      const userId = req.user?.id;

      const options = {
        startDate,
        endDate,
        type,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
      };

      logger.info(`Getting transactions for account: ${accountId} by user: ${userId}`);

      const result = await bankingService.getTransactions(accountId, options, userId);

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Get transactions error: ${error.message}`);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/payments/initiate
   * Initiate a payment/transfer
   */
  async initiatePayment(req, res) {
    try {
      const userId = req.user?.id;
      const data = req.body;

      logger.info(`Initiating payment: ${data.amount} from account: ${data.fromAccountId} by user: ${userId}`);

      const result = await bankingService.initiatePayment(data, userId);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Initiate payment error: ${error.message}`);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/payments/:paymentId
   * Get payment status
   */
  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      logger.info(`Getting payment status: ${paymentId} by user: ${userId}`);

      const payment = await bankingService.getPaymentStatus(paymentId, userId);

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error(`Get payment status error: ${error.message}`);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/accounts
   * List all accounts
   */
  async listAccounts(req, res) {
    try {
      const { status, accountType, businessName, page, limit } = req.query;
      const userId = req.user?.id;

      const filters = {};
      if (status) filters.status = status;
      if (accountType) filters.accountType = accountType;
      if (businessName) filters.businessName = businessName;
      if (userId && !req.user?.isAdmin) filters.createdBy = userId;

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      logger.info(`Listing accounts for user: ${userId}`);

      const result = await bankingService.listAccounts(filters, pagination);

      res.status(200).json({
        success: true,
        data: result.accounts,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`List accounts error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/accounts/:accountId/payments
   * List all payments for an account
   */
  async listPayments(req, res) {
    try {
      const { accountId } = req.params;
      const { status, paymentMethod, page, limit } = req.query;
      const userId = req.user?.id;

      const filters = {};
      if (status) filters.status = status;
      if (paymentMethod) filters.paymentMethod = paymentMethod;

      const pagination = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      logger.info(`Listing payments for account: ${accountId} by user: ${userId}`);

      const result = await bankingService.listPayments(accountId, filters, pagination);

      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`List payments error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /health
   * Health check endpoint
   */
  async healthCheck(req, res) {
    res.status(200).json({
      success: true,
      service: 'flora-mercury-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mockMode: process.env.MOCK_MODE === 'true'
    });
  }
}

module.exports = new BankingController();
