/**
 * Mercury API Client
 * Handles all communication with Mercury's Banking API
 * Supports MOCK_MODE for development without API credentials
 */

const axios = require('axios');
const logger = require('../config/logger');

class MercuryClient {
  constructor() {
    this.mockMode = process.env.MOCK_MODE === 'true';
    this.apiKey = process.env.MERCURY_API_KEY;
    this.baseUrl = process.env.MERCURY_API_URL || 'https://api.mercury.com/api/v1';

    if (!this.mockMode && !this.apiKey) {
      logger.warn('Mercury API key not found. Running in MOCK_MODE.');
      this.mockMode = true;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`Mercury API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info(`Mercury API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`Mercury API Error: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new Mercury bank account
   * @param {Object} data - Account creation data
   * @returns {Object} Account details with ID and routing numbers
   */
  async createAccount(data) {
    if (this.mockMode) {
      return this._mockCreateAccount(data);
    }

    try {
      const payload = {
        business_name: data.businessName,
        business_ein: data.ein,
        account_type: data.accountType || 'CHECKING', // CHECKING or SAVINGS
        business_structure: data.businessStructure, // LLC, C_CORP, S_CORP
        beneficial_owners: data.beneficialOwners.map(owner => ({
          name: owner.name,
          email: owner.email,
          ssn: owner.ssn, // Should be encrypted before transmission
          date_of_birth: owner.dateOfBirth,
          address: owner.address,
          ownership_percentage: owner.ownershipPercentage
        })),
        initial_deposit: data.initialDeposit || 0
      };

      const response = await this.client.post('/accounts', payload);

      return {
        accountId: response.data.account_id,
        accountNumber: response.data.account_number,
        routingNumber: response.data.routing_number,
        accountType: response.data.account_type,
        status: response.data.status, // PENDING_APPROVAL, ACTIVE, SUSPENDED
        availableBalance: response.data.available_balance,
        currentBalance: response.data.current_balance,
        createdAt: response.data.created_at
      };
    } catch (error) {
      throw this._handleError(error, 'Account creation failed');
    }
  }

  /**
   * Get account balance
   * @param {String} accountId - The account ID
   * @returns {Object} Balance information
   */
  async getAccountBalance(accountId) {
    if (this.mockMode) {
      return this._mockGetAccountBalance(accountId);
    }

    try {
      const response = await this.client.get(`/accounts/${accountId}/balance`);

      return {
        accountId: response.data.account_id,
        availableBalance: response.data.available_balance,
        currentBalance: response.data.current_balance,
        pendingBalance: response.data.pending_balance,
        currency: response.data.currency || 'USD',
        lastUpdated: response.data.last_updated
      };
    } catch (error) {
      throw this._handleError(error, 'Failed to retrieve account balance');
    }
  }

  /**
   * Get account transactions
   * @param {String} accountId - The account ID
   * @param {Object} options - Query options (startDate, endDate, limit, offset)
   * @returns {Object} Transaction list
   */
  async getTransactions(accountId, options = {}) {
    if (this.mockMode) {
      return this._mockGetTransactions(accountId, options);
    }

    try {
      const params = {
        start_date: options.startDate,
        end_date: options.endDate,
        limit: options.limit || 100,
        offset: options.offset || 0,
        type: options.type // DEBIT, CREDIT, ALL
      };

      const response = await this.client.get(`/accounts/${accountId}/transactions`, { params });

      return {
        accountId: response.data.account_id,
        transactions: response.data.transactions.map(tx => ({
          id: tx.id,
          type: tx.type, // DEBIT or CREDIT
          amount: tx.amount,
          description: tx.description,
          counterparty: tx.counterparty,
          status: tx.status, // PENDING, COMPLETED, FAILED
          postedAt: tx.posted_at,
          createdAt: tx.created_at
        })),
        pagination: {
          total: response.data.total,
          limit: response.data.limit,
          offset: response.data.offset,
          hasMore: response.data.has_more
        }
      };
    } catch (error) {
      throw this._handleError(error, 'Failed to retrieve transactions');
    }
  }

  /**
   * Initiate a payment/transfer
   * @param {Object} data - Payment data
   * @returns {Object} Payment confirmation
   */
  async initiatePayment(data) {
    if (this.mockMode) {
      return this._mockInitiatePayment(data);
    }

    try {
      const payload = {
        from_account_id: data.fromAccountId,
        to_account: {
          account_number: data.toAccount.accountNumber,
          routing_number: data.toAccount.routingNumber,
          account_holder_name: data.toAccount.accountHolderName,
          account_type: data.toAccount.accountType
        },
        amount: data.amount,
        currency: data.currency || 'USD',
        description: data.description,
        payment_method: data.paymentMethod || 'ACH', // ACH, WIRE, CHECK
        idempotency_key: data.idempotencyKey
      };

      const response = await this.client.post('/payments', payload);

      return {
        paymentId: response.data.payment_id,
        status: response.data.status, // PENDING, PROCESSING, COMPLETED, FAILED
        fromAccountId: response.data.from_account_id,
        amount: response.data.amount,
        fee: response.data.fee,
        estimatedDelivery: response.data.estimated_delivery,
        trackingUrl: response.data.tracking_url,
        createdAt: response.data.created_at
      };
    } catch (error) {
      throw this._handleError(error, 'Payment initiation failed');
    }
  }

  /**
   * Get payment status
   * @param {String} paymentId - The payment ID
   * @returns {Object} Payment details
   */
  async getPaymentStatus(paymentId) {
    if (this.mockMode) {
      return this._mockGetPaymentStatus(paymentId);
    }

    try {
      const response = await this.client.get(`/payments/${paymentId}`);

      return {
        paymentId: response.data.payment_id,
        status: response.data.status,
        fromAccountId: response.data.from_account_id,
        toAccount: response.data.to_account,
        amount: response.data.amount,
        fee: response.data.fee,
        completedAt: response.data.completed_at,
        failureReason: response.data.failure_reason,
        createdAt: response.data.created_at
      };
    } catch (error) {
      throw this._handleError(error, 'Failed to retrieve payment status');
    }
  }

  // ==================== MOCK MODE IMPLEMENTATIONS ====================

  _mockCreateAccount(data) {
    logger.info('[MOCK MODE] Creating Mercury account:', data.businessName);

    return new Promise((resolve) => {
      setTimeout(() => {
        const accountId = `mock_merc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const routingNumber = '121000248'; // Mock Mercury routing number

        resolve({
          accountId,
          accountNumber,
          routingNumber,
          accountType: data.accountType || 'CHECKING',
          status: 'PENDING_APPROVAL', // Simulates KYC review
          availableBalance: 0,
          currentBalance: 0,
          createdAt: new Date().toISOString()
        });
      }, 1200);
    });
  }

  _mockGetAccountBalance(accountId) {
    logger.info('[MOCK MODE] Getting balance for account:', accountId);

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate realistic balance based on account age
        const isMock = accountId.startsWith('mock_');
        const timestamp = isMock ? parseInt(accountId.split('_')[2]) : Date.now();
        const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

        // Older accounts have higher balances (simulated growth)
        const baseBalance = 50000 + (ageInDays * 1500);
        const availableBalance = parseFloat((baseBalance + Math.random() * 10000).toFixed(2));
        const pendingTransactions = parseFloat((Math.random() * 5000).toFixed(2));
        const currentBalance = parseFloat((availableBalance + pendingTransactions).toFixed(2));

        resolve({
          accountId,
          availableBalance,
          currentBalance,
          pendingBalance: pendingTransactions,
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        });
      }, 400);
    });
  }

  _mockGetTransactions(accountId, options = {}) {
    logger.info('[MOCK MODE] Getting transactions for account:', accountId);

    return new Promise((resolve) => {
      setTimeout(() => {
        const limit = options.limit || 100;
        const offset = options.offset || 0;

        // Generate mock transactions
        const mockTransactions = [];
        const numTransactions = Math.min(30, limit); // Generate up to 30 transactions

        const transactionTypes = [
          { type: 'CREDIT', descriptions: ['Customer Payment', 'Wire Transfer In', 'ACH Deposit', 'Revenue Payment'] },
          { type: 'DEBIT', descriptions: ['Vendor Payment', 'Payroll', 'SaaS Subscription', 'Office Supplies', 'Wire Transfer Out'] }
        ];

        for (let i = 0; i < numTransactions; i++) {
          const isCredit = Math.random() > 0.4; // 60% credits, 40% debits
          const txType = isCredit ? transactionTypes[0] : transactionTypes[1];
          const description = txType.descriptions[Math.floor(Math.random() * txType.descriptions.length)];

          const daysAgo = i + offset;
          const txDate = new Date();
          txDate.setDate(txDate.getDate() - daysAgo);

          mockTransactions.push({
            id: `mock_tx_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
            type: txType.type,
            amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
            description,
            counterparty: isCredit ? 'ACME Corporation' : description,
            status: daysAgo < 2 ? 'PENDING' : 'COMPLETED',
            postedAt: txDate.toISOString(),
            createdAt: txDate.toISOString()
          });
        }

        resolve({
          accountId,
          transactions: mockTransactions,
          pagination: {
            total: 150, // Mock total
            limit,
            offset,
            hasMore: offset + limit < 150
          }
        });
      }, 600);
    });
  }

  _mockInitiatePayment(data) {
    logger.info('[MOCK MODE] Initiating payment:', data.amount);

    return new Promise((resolve) => {
      setTimeout(() => {
        const paymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const estimatedDelivery = new Date();

        // ACH takes 2-3 business days, Wire is same-day
        if (data.paymentMethod === 'WIRE') {
          estimatedDelivery.setHours(estimatedDelivery.getHours() + 2);
        } else {
          estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
        }

        const fee = data.paymentMethod === 'WIRE' ? 25.00 : 0.00;

        resolve({
          paymentId,
          status: 'PENDING',
          fromAccountId: data.fromAccountId,
          amount: parseFloat(data.amount),
          fee,
          estimatedDelivery: estimatedDelivery.toISOString(),
          trackingUrl: `https://mercury-api.flora.passbook.vc/payments/${paymentId}`,
          createdAt: new Date().toISOString()
        });
      }, 800);
    });
  }

  _mockGetPaymentStatus(paymentId) {
    logger.info('[MOCK MODE] Getting payment status:', paymentId);

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate payment progression based on age
        const isMock = paymentId.startsWith('mock_');
        const timestamp = isMock ? parseInt(paymentId.split('_')[2]) : Date.now();
        const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60);

        let status = 'PENDING';
        let completedAt = null;
        let failureReason = null;

        if (ageInHours > 48) {
          // Simulate 95% success rate
          if (Math.random() > 0.05) {
            status = 'COMPLETED';
            completedAt = new Date(timestamp + 48 * 60 * 60 * 1000).toISOString();
          } else {
            status = 'FAILED';
            failureReason = 'Insufficient funds';
          }
        } else if (ageInHours > 2) {
          status = 'PROCESSING';
        }

        resolve({
          paymentId,
          status,
          fromAccountId: 'mock_merc_account_123',
          toAccount: {
            accountHolderName: 'Example Vendor LLC',
            accountNumber: '****5678',
            routingNumber: '121000248'
          },
          amount: 1500.00,
          fee: 0.00,
          completedAt,
          failureReason,
          createdAt: new Date(timestamp).toISOString()
        });
      }, 400);
    });
  }

  // ==================== ERROR HANDLING ====================

  _handleError(error, message) {
    if (error.response) {
      // API returned an error response
      logger.error(`Mercury API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      return new Error(`${message}: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      logger.error(`Mercury API Error: No response received`);
      return new Error(`${message}: No response from Mercury API`);
    } else {
      // Something else happened
      logger.error(`Mercury API Error: ${error.message}`);
      return new Error(`${message}: ${error.message}`);
    }
  }
}

module.exports = MercuryClient;
