/**
 * API Routes
 */

const express = require('express');
const bankingController = require('../controllers/bankingController');
const auth = require('../middleware/auth');
const {
  validateAccountCreation,
  validatePayment
} = require('../middleware/validation');

const router = express.Router();

// Health check (public)
router.get('/health', bankingController.healthCheck);

// Account routes (protected)
router.post(
  '/api/accounts/create',
  auth,
  validateAccountCreation,
  bankingController.createAccount
);

router.get(
  '/api/accounts',
  auth,
  bankingController.listAccounts
);

router.get(
  '/api/accounts/:accountId/balance',
  auth,
  bankingController.getAccountBalance
);

router.get(
  '/api/accounts/:accountId/transactions',
  auth,
  bankingController.getTransactions
);

router.get(
  '/api/accounts/:accountId/payments',
  auth,
  bankingController.listPayments
);

// Payment routes (protected)
router.post(
  '/api/payments/initiate',
  auth,
  validatePayment,
  bankingController.initiatePayment
);

router.get(
  '/api/payments/:paymentId',
  auth,
  bankingController.getPaymentStatus
);

module.exports = router;
