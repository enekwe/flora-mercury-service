# Flora Mercury Service - Deployment Summary

## Build Status: COMPLETE ✅

All components of the Mercury banking microservice have been successfully created following the exact architecture pattern from the CorpNet service.

## Files Created

### Core Application (18 files)

1. **Package Configuration**
   - `package.json` - Dependencies and scripts
   - `.gitignore` - Git ignore rules
   - `.env.example` - Environment template

2. **Services Layer** (3 files)
   - `src/services/mercuryClient.js` - Mercury API client with mock mode
   - `src/services/bankingService.js` - Business logic layer
   - `src/services/encryptionService.js` - PII encryption (pre-existing)

3. **Models** (3 files)
   - `src/models/BankAccount.js` - Account schema
   - `src/models/Transaction.js` - Transaction history
   - `src/models/Payment.js` - Payment instructions

4. **Controllers** (1 file)
   - `src/controllers/bankingController.js` - HTTP handlers

5. **Routes** (1 file)
   - `src/routes/index.js` - API endpoint definitions

6. **Middleware** (2 files)
   - `src/middleware/auth.js` - JWT authentication
   - `src/middleware/validation.js` - Input validation

7. **Configuration** (2 files)
   - `src/config/logger.js` - Winston logging
   - `src/config/database.js` - MongoDB connection

8. **Server** (1 file)
   - `src/server.js` - Express application

9. **Deployment** (3 files)
   - `Dockerfile` - Container definition
   - `railway.json` - Railway configuration
   - `README.md` - Complete documentation

## API Endpoints Summary

### Accounts
- `POST /api/accounts/create` - Create Mercury bank account
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:accountId/balance` - Get account balance
- `GET /api/accounts/:accountId/transactions` - Get transaction history
- `GET /api/accounts/:accountId/payments` - List account payments

### Payments
- `POST /api/payments/initiate` - Initiate payment/transfer
- `GET /api/payments/:paymentId` - Get payment status

### Health
- `GET /health` - Service health check

## Mock Mode Features

### Account Creation Mock
- Generates realistic account IDs: `mock_merc_1720358400000_abc123def`
- Returns routing number: `121000248`
- Random 10-digit account numbers
- Status: `PENDING_APPROVAL` (simulates KYC review)

### Balance Mock
- Dynamic balances based on account age
- Base balance: $50,000 + (days * $1,500)
- Realistic pending transactions
- Real-time updates

### Transaction History Mock
- Generates up to 30 realistic transactions
- 60% credits (revenue), 40% debits (expenses)
- Categories: Customer Payment, Wire Transfer, Payroll, SaaS, etc.
- Recent transactions show as PENDING
- Historical transactions show as COMPLETED

### Payment Processing Mock
- Payment IDs: `mock_pay_1720358400000_xyz789`
- ACH: 2-3 day delivery, $0 fee
- Wire: Same-day delivery, $25 fee
- 95% success rate simulation
- Status progression: PENDING → PROCESSING → COMPLETED

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/cope/Passbook_Oracle/microservices/flora-mercury-service
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env

# Edit .env with:
MOCK_MODE=true
MONGODB_URI=mongodb://localhost:27017/flora-mercury
JWT_SECRET=your-jwt-secret-here
```

### 3. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add output to .env as ENCRYPTION_KEY
```

### 4. Start Service
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Service will run on: `http://localhost:3020`

## Testing Examples

### Create Account (Mock Mode)
```bash
curl -X POST http://localhost:3020/api/accounts/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Startup Inc",
    "ein": "12-3456789",
    "accountType": "CHECKING",
    "businessStructure": "C_CORP",
    "beneficialOwners": [{
      "name": "John Founder",
      "email": "john@teststartup.com",
      "ssn": "123-45-6789",
      "dateOfBirth": "1990-01-01",
      "ownershipPercentage": 100,
      "address": {
        "street": "123 Startup Ave",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94102"
      }
    }],
    "initialDeposit": 25000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "mock_merc_1720358400000_abc123",
    "accountNumber": "1234567890",
    "routingNumber": "121000248",
    "accountType": "CHECKING",
    "businessName": "Test Startup Inc",
    "status": "PENDING_APPROVAL",
    "availableBalance": 0,
    "currentBalance": 0,
    "createdAt": "2026-07-07T12:00:00.000Z"
  }
}
```

### Get Balance (Mock Mode)
```bash
curl http://localhost:3020/api/accounts/mock_merc_1720358400000_abc123/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "mock_merc_1720358400000_abc123",
    "businessName": "Test Startup Inc",
    "accountType": "CHECKING",
    "availableBalance": 67543.21,
    "currentBalance": 69234.56,
    "pendingBalance": 1691.35,
    "currency": "USD",
    "lastUpdated": "2026-07-07T12:00:00.000Z"
  }
}
```

### Get Transactions (Mock Mode)
```bash
curl "http://localhost:3020/api/accounts/mock_merc_1720358400000_abc123/transactions?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mock_tx_1720358400000_0_abc123",
      "type": "CREDIT",
      "amount": 3456.78,
      "description": "Customer Payment",
      "counterparty": "ACME Corporation",
      "status": "COMPLETED",
      "postedAt": "2026-07-06T10:30:00.000Z",
      "createdAt": "2026-07-06T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Initiate Payment (Mock Mode)
```bash
curl -X POST http://localhost:3020/api/payments/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "mock_merc_1720358400000_abc123",
    "toAccount": {
      "accountNumber": "9876543210",
      "routingNumber": "121000248",
      "accountHolderName": "Vendor Services LLC",
      "accountType": "CHECKING"
    },
    "amount": 2500.00,
    "description": "Invoice #12345 payment",
    "paymentMethod": "ACH"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "mock_pay_1720358400000_xyz789",
    "status": "PENDING",
    "amount": 2500.00,
    "fee": 0.00,
    "estimatedDelivery": "2026-07-09T12:00:00.000Z",
    "trackingUrl": "https://mercury-api.flora.passbook.vc/payments/mock_pay_1720358400000_xyz789",
    "createdAt": "2026-07-07T12:00:00.000Z"
  }
}
```

### Health Check
```bash
curl http://localhost:3020/health
```

**Expected Response:**
```json
{
  "success": true,
  "service": "flora-mercury-service",
  "status": "healthy",
  "timestamp": "2026-07-07T12:00:00.000Z",
  "mockMode": true
}
```

## Architecture Highlights

### Security
- **AES-256-GCM encryption** for SSN and DOB
- **JWT authentication** on all protected endpoints
- **Input validation** using express-validator
- **Helmet.js** security headers
- **Masked account numbers** in responses

### Mock Mode Intelligence
- Account balances grow over time
- Transaction status based on age (recent = PENDING, old = COMPLETED)
- Payment progression simulation
- Realistic delays (ACH vs Wire)
- 95% success rate for payments

### Database Design
- **Compound indexes** for common queries
- **Virtual fields** for computed values (masked account numbers, formatted amounts)
- **Auto-categorization** for transactions
- **Idempotency keys** for payment deduplication

## Production Deployment

### Railway Deployment
```bash
# Link to Railway project
railway link

# Set environment variables in Railway dashboard:
- MONGODB_URI
- JWT_SECRET
- ENCRYPTION_KEY
- MERCURY_API_KEY (if not using mock mode)
- MOCK_MODE=false

# Deploy
railway up
```

### Docker Deployment
```bash
# Build
docker build -t flora-mercury-service .

# Run
docker run -p 3020:3020 \
  -e MONGODB_URI=mongodb://mongo:27017/flora-mercury \
  -e JWT_SECRET=your-secret \
  -e ENCRYPTION_KEY=your-key \
  -e MOCK_MODE=true \
  flora-mercury-service
```

## Verification Checklist

- ✅ All 18 files created
- ✅ Follows CorpNet architecture exactly
- ✅ Mock mode fully implemented
- ✅ All endpoints defined
- ✅ Security measures in place
- ✅ Comprehensive documentation
- ✅ Docker and Railway configs
- ✅ Health check endpoint
- ✅ Logging configured
- ✅ Error handling implemented

## Next Steps

1. **Install dependencies**: `npm install`
2. **Configure .env**: Copy from .env.example
3. **Start MongoDB**: Ensure MongoDB is running
4. **Start service**: `npm run dev`
5. **Test endpoints**: Use curl or Postman
6. **Review logs**: Check `logs/combined.log`
7. **Deploy to Railway**: When ready for production

## Support

- Review `README.md` for detailed documentation
- Check `logs/` directory for debugging
- Verify health endpoint: `GET /health`
- Ensure MongoDB is connected
- Confirm environment variables are set

## Comparison with CorpNet Service

Both services follow identical patterns:

| Feature | CorpNet | Mercury |
|---------|---------|---------|
| Port | 3010 | 3020 |
| Mock Mode | ✅ | ✅ |
| JWT Auth | ✅ | ✅ |
| Input Validation | ✅ | ✅ |
| Winston Logging | ✅ | ✅ |
| MongoDB | ✅ | ✅ |
| Docker | ✅ | ✅ |
| Railway | ✅ | ✅ |
| Health Check | ✅ | ✅ |
| Encryption | - | ✅ (PII) |

**Status: Ready for Development and Testing! 🚀**
