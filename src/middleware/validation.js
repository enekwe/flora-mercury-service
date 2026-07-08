/**
 * Request Validation Middleware
 */

const { body, validationResult } = require('express-validator');

// Validation rules for account creation
const validateAccountCreation = [
  body('businessName')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Business name must be 2-200 characters'),

  body('ein')
    .trim()
    .notEmpty().withMessage('EIN is required')
    .matches(/^\d{2}-\d{7}$/).withMessage('EIN must be in format XX-XXXXXXX'),

  body('accountType')
    .optional()
    .isIn(['CHECKING', 'SAVINGS']).withMessage('Invalid account type'),

  body('businessStructure')
    .notEmpty().withMessage('Business structure is required')
    .isIn(['LLC', 'C_CORP', 'S_CORP', 'PARTNERSHIP', 'SOLE_PROPRIETOR']).withMessage('Invalid business structure'),

  body('beneficialOwners')
    .isArray({ min: 1 }).withMessage('At least one beneficial owner is required'),

  body('beneficialOwners.*.name')
    .trim()
    .notEmpty().withMessage('Owner name is required'),

  body('beneficialOwners.*.email')
    .trim()
    .notEmpty().withMessage('Owner email is required')
    .isEmail().withMessage('Invalid email address'),

  body('beneficialOwners.*.ssn')
    .trim()
    .notEmpty().withMessage('Owner SSN is required')
    .matches(/^\d{3}-\d{2}-\d{4}$/).withMessage('SSN must be in format XXX-XX-XXXX'),

  body('beneficialOwners.*.dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Invalid date format'),

  body('beneficialOwners.*.ownershipPercentage')
    .isFloat({ min: 0.01, max: 100 }).withMessage('Ownership must be between 0.01 and 100'),

  body('beneficialOwners.*.address.street')
    .trim()
    .notEmpty().withMessage('Street address is required'),

  body('beneficialOwners.*.address.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('beneficialOwners.*.address.state')
    .trim()
    .notEmpty().withMessage('State is required')
    .isLength({ min: 2, max: 2 }).withMessage('State must be 2-letter code'),

  body('beneficialOwners.*.address.zipCode')
    .trim()
    .notEmpty().withMessage('ZIP code is required')
    .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid ZIP code'),

  body('initialDeposit')
    .optional()
    .isFloat({ min: 0 }).withMessage('Initial deposit must be 0 or greater'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation rules for payment initiation
const validatePayment = [
  body('fromAccountId')
    .trim()
    .notEmpty().withMessage('Source account ID is required'),

  body('toAccount.accountNumber')
    .trim()
    .notEmpty().withMessage('Destination account number is required')
    .isLength({ min: 4, max: 17 }).withMessage('Invalid account number length'),

  body('toAccount.routingNumber')
    .trim()
    .notEmpty().withMessage('Routing number is required')
    .matches(/^\d{9}$/).withMessage('Routing number must be 9 digits'),

  body('toAccount.accountHolderName')
    .trim()
    .notEmpty().withMessage('Account holder name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Account holder name must be 2-100 characters'),

  body('toAccount.accountType')
    .optional()
    .isIn(['CHECKING', 'SAVINGS']).withMessage('Invalid account type'),

  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

  body('currency')
    .optional()
    .isIn(['USD']).withMessage('Only USD is currently supported'),

  body('description')
    .trim()
    .notEmpty().withMessage('Payment description is required')
    .isLength({ min: 2, max: 500 }).withMessage('Description must be 2-500 characters'),

  body('paymentMethod')
    .optional()
    .isIn(['ACH', 'WIRE', 'CHECK']).withMessage('Invalid payment method'),

  body('idempotencyKey')
    .optional()
    .trim()
    .isLength({ min: 10, max: 100 }).withMessage('Invalid idempotency key'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateAccountCreation,
  validatePayment
};
