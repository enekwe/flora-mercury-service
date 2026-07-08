# Flora Mercury Banking Microservice

A production-ready microservice for Mercury banking operations, account management, and payment processing. Part of the Flora platform ecosystem.

## Features

- **Account Management**: Create and manage Mercury business bank accounts
- **Real-time Balances**: Fetch live account balances and transaction history
- **Payment Processing**: Initiate ACH, Wire, and Check payments
- **Transaction Tracking**: Comprehensive transaction history with categorization
- **Security First**: AES-256-GCM encryption for PII, JWT authentication
- **Mock Mode**: Full development mode with realistic simulated data
- **Production Ready**: Docker, Railway deployment, health checks

## Architecture

```
src/
├── config/
│   ├── database.js       # MongoDB connection
│   └── logger.js         # Winston logging
├── controllers/
│   └── bankingController.js  # HTTP request handlers
├── middleware/
│   ├── auth.js          # JWT authentication
│   └── validation.js    # Input validation
├── models/
│   ├── BankAccount.js   # Account schema
│   ├── Transaction.js   # Transaction history
│   └── Payment.js       # Payment instructions
├── routes/
│   └── index.js         # API route definitions
├── services/
│   ├── bankingService.js    # Business logic
│   ├── mercuryClient.js     # Mercury API client
│   └── encryptionService.js # PII encryption
└── server.js            # Express app setup
```

## API Endpoints

### Account Operations

#### Create Bank Account
```http
POST /api/accounts/create
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "businessName": "Acme Corp",
  "ein": "12-3456789",
  "accountType": "CHECKING",
  "businessStructure": "C_CORP",
  "beneficialOwners": [
    {
      "name": "John Doe",
      "email": "john@acme.com",
      "ssn": "123-45-6789",
      "dateOfBirth": "1990-01-01",
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94102"
      },
      "ownershipPercentage": 100
    }
  ],
  "initialDeposit": 10000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "merc_acct_123abc",
    "accountNumber": "1234567890",
    "routingNumber": "121000248",
    "accountType": "CHECKING",
    "businessName": "Acme Corp",
    "status": "PENDING_APPROVAL",
    "availableBalance": 0,
    "currentBalance": 0,
    "createdAt": "2026-07-07T12:00:00.000Z"
  }
}
```

#### Get Account Balance
```http
GET /api/accounts/{accountId}/balance
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "merc_acct_123abc",
    "businessName": "Acme Corp",
    "accountType": "CHECKING",
    "availableBalance": 125430.50,
    "currentBalance": 127500.00,
    "pendingBalance": 2069.50,
    "currency": "USD",
    "lastUpdated": "2026-07-07T12:00:00.000Z"
  }
}
```

#### Get Transactions
```http
GET /api/accounts/{accountId}/transactions?limit=50&offset=0&type=CREDIT
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tx_abc123",
      "type": "CREDIT",
      "amount": 5000.00,
      "description": "Customer Payment",
      "counterparty": "ACME Corporation",
      "status": "COMPLETED",
      "postedAt": "2026-07-06T10:30:00.000Z",
      "createdAt": "2026-07-06T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### List Accounts
```http
GET /api/accounts?status=ACTIVE&page=1&limit=20
Authorization: Bearer {jwt-token}
```

### Payment Operations

#### Initiate Payment
```http
POST /api/payments/initiate
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "fromAccountId": "merc_acct_123abc",
  "toAccount": {
    "accountNumber": "9876543210",
    "routingNumber": "121000248",
    "accountHolderName": "Vendor LLC",
    "accountType": "CHECKING"
  },
  "amount": 1500.00,
  "currency": "USD",
  "description": "Invoice #12345 payment",
  "paymentMethod": "ACH"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_xyz789",
    "status": "PENDING",
    "amount": 1500.00,
    "fee": 0.00,
    "estimatedDelivery": "2026-07-09T12:00:00.000Z",
    "trackingUrl": "https://mercury-api.flora.passbook.vc/payments/pay_xyz789",
    "createdAt": "2026-07-07T12:00:00.000Z"
  }
}
```

#### Get Payment Status
```http
GET /api/payments/{paymentId}
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_xyz789",
    "status": "COMPLETED",
    "fromAccountId": "merc_acct_123abc",
    "toAccount": {
      "accountHolderName": "Vendor LLC",
      "accountNumber": "****3210",
      "routingNumber": "121000248"
    },
    "amount": 1500.00,
    "fee": 0.00,
    "completedAt": "2026-07-09T10:00:00.000Z",
    "createdAt": "2026-07-07T12:00:00.000Z"
  }
}
```

#### List Payments
```http
GET /api/accounts/{accountId}/payments?status=PENDING&page=1&limit=20
Authorization: Bearer {jwt-token}
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "service": "flora-mercury-service",
  "status": "healthy",
  "timestamp": "2026-07-07T12:00:00.000Z",
  "mockMode": true
}
```

## Mock Mode

The service includes a comprehensive mock mode for development and testing without Mercury API credentials.

### Features

- **Realistic Account Creation**: Simulates KYC approval process
- **Dynamic Balances**: Account balances grow over time based on account age
- **Transaction History**: Generates realistic transaction data with various types
- **Payment Processing**: Simulates payment lifecycle (PENDING → PROCESSING → COMPLETED)
- **Success/Failure Simulation**: 95% success rate with realistic failure reasons
- **Timing Simulation**: ACH (2-3 days), Wire (same-day)

### Enable Mock Mode

Set in `.env`:
```bash
MOCK_MODE=true
```

### Mock Data Examples

**Account IDs**: `mock_merc_1720358400000_abc123def`
**Payment IDs**: `mock_pay_1720358400000_xyz789`
**Transaction IDs**: `mock_tx_1720358400000_1_abc123`

**Mock Routing Number**: `121000248`
**Mock Account Numbers**: Random 10-digit numbers

## Installation

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Mercury API credentials (or use Mock Mode)

### Setup

1. Clone and install dependencies:
```bash
cd microservices/flora-mercury-service
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add to .env as ENCRYPTION_KEY
```

4. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment (development/production) |
| `PORT` | No | 3020 | Server port |
| `LOG_LEVEL` | No | info | Winston log level |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | JWT secret (must match main app) |
| `MERCURY_API_KEY` | Conditional | - | Mercury API key (not needed in mock mode) |
| `MERCURY_API_URL` | No | https://api.mercury.com/api/v1 | Mercury API base URL |
| `ENCRYPTION_KEY` | Yes | - | 32-byte hex key for AES-256-GCM |
| `MOCK_MODE` | No | false | Enable mock mode (true/false) |

## Security

### PII Encryption

All sensitive personally identifiable information (PII) is encrypted using AES-256-GCM before storage:

- Social Security Numbers (SSN)
- Date of Birth (DOB)
- Full account numbers (masked in responses)

### Authentication

- JWT-based authentication
- Token verification on all protected endpoints
- User context attached to requests

### Best Practices

- Encryption keys stored in environment variables
- Sensitive data never logged
- HTTPS required in production
- Helmet.js security headers
- Input validation on all endpoints
- Rate limiting (recommended)

## Database Schema

### BankAccount
- `accountId`: Mercury account identifier
- `accountNumber`: Full account number (encrypted in responses)
- `routingNumber`: Bank routing number
- `accountType`: CHECKING or SAVINGS
- `businessName`: Business name
- `ein`: Employer Identification Number
- `businessStructure`: LLC, C_CORP, S_CORP, etc.
- `beneficialOwners[]`: Array of encrypted owner data
- `status`: PENDING_APPROVAL, ACTIVE, SUSPENDED, CLOSED
- `availableBalance`: Current available balance
- `currentBalance`: Current total balance

### Transaction
- `transactionId`: Mercury transaction identifier
- `accountId`: Associated account
- `type`: DEBIT or CREDIT
- `amount`: Transaction amount
- `description`: Transaction description
- `counterparty`: Other party in transaction
- `status`: PENDING, COMPLETED, FAILED, REVERSED
- `category`: Auto-categorized type

### Payment
- `paymentId`: Mercury payment identifier
- `fromAccountId`: Source account
- `toAccount{}`: Destination account details
- `amount`: Payment amount
- `fee`: Transaction fee
- `paymentMethod`: ACH, WIRE, CHECK
- `status`: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- `estimatedDelivery`: Expected completion date
- `idempotencyKey`: Deduplication key

## Docker Deployment

### Build Image
```bash
docker build -t flora-mercury-service .
```

### Run Container
```bash
docker run -p 3020:3020 \
  -e MONGODB_URI=mongodb://mongo:27017/flora-mercury \
  -e JWT_SECRET=your-secret \
  -e MOCK_MODE=true \
  flora-mercury-service
```

## Railway Deployment

The service is configured for Railway deployment with `railway.json`:

1. Push to Railway:
```bash
railway up
```

2. Set environment variables in Railway dashboard

3. Service will auto-deploy on git push

## Testing

Run tests:
```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Logging

Winston logger with multiple transports:

- Console: Colorized, human-readable
- File: `logs/combined.log` (all logs)
- File: `logs/error.log` (errors only)

Log levels: error, warn, info, debug

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request / validation error
- `401`: Unauthorized
- `404`: Not found
- `500`: Server error

## Integration with Flora Platform

### JWT Authentication

Tokens must be signed with the same `JWT_SECRET` as the main Flora app:

```javascript
{
  "id": "user_123",
  "email": "user@example.com",
  "role": "user"
}
```

### Service Discovery

Default port: `3020`

Health check: `http://localhost:3020/health`

## Development Workflow

1. Enable mock mode in `.env`
2. Start MongoDB locally
3. Run `npm run dev`
4. Test endpoints with mock data
5. Implement tests
6. Deploy to Railway

## Production Checklist

- [ ] Set `MOCK_MODE=false`
- [ ] Configure real Mercury API credentials
- [ ] Set strong `JWT_SECRET`
- [ ] Generate secure `ENCRYPTION_KEY`
- [ ] Configure production MongoDB
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review and adjust log levels
- [ ] Set up rate limiting
- [ ] Configure CORS for production domains

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review health check endpoint
- Verify environment variables
- Check MongoDB connection

## License

MIT
