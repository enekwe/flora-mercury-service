/**
 * Encryption Service
 * AES-256-GCM encryption for sensitive PII data (SSN, DOB, etc.)
 */

const crypto = require('crypto');
const logger = require('../config/logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = this._getEncryptionKey();
  }

  _getEncryptionKey() {
    const keyHex = process.env.ENCRYPTION_KEY;

    if (!keyHex) {
      logger.warn('ENCRYPTION_KEY not set, using default (INSECURE - only for dev)');
      // Generate a default key for development only
      return crypto.randomBytes(32);
    }

    return Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypt sensitive data
   * @param {String} text - Plain text to encrypt
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error(`Encryption error: ${error.message}`);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {Object} encryptedData - Object with encrypted, iv, and authTag
   * @returns {String} Decrypted plain text
   */
  decrypt(encryptedData) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(encryptedData.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error(`Decryption error: ${error.message}`);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data (one-way, for verification only)
   * @param {String} text - Text to hash
   * @returns {String} Hash
   */
  hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

module.exports = new EncryptionService();
