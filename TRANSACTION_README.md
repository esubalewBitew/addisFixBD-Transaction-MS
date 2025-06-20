# Transaction Microservice System

This document provides comprehensive information about the Transaction MicroService System for the AddisFix platform.

## Overview

The Transaction MicroService System handles all financial transactions including:
- Job payments and commissions
- Technician payouts
- Client billing
- Service fees and VAT
- Tips and additional charges
- Financial reporting and analytics

## Transaction Model

### Core Fields

#### Identifiers
- `transactionID`: Unique transaction identifier (auto-generated)
- `FTNumber`: Financial transaction number
- `userId`: Reference to the user initiating the transaction
- `userCode`: User's unique code
- `clientId`: Reference to the business/client (optional)

#### Job-Related Fields
- `jobId`: Reference to the associated job
- `jobTitle`: Title of the job
- `technicianId`: Reference to the assigned technician
- `technicianName`: Name of the technician
- `technicianPhone`: Technician's phone number

#### Financial Details
- `amount`: Base transaction amount
- `totalAmount`: Total amount including fees
- `paidAmount`: Amount actually paid
- `serviceFee`: Service fee charged
- `facilitationFee`: Platform facilitation fee
- `VAT`: Value Added Tax
- `tipAmount`: Tip amount
- `deliveryAmount`: Delivery charges
- `commissionAmount`: Commission amount
- `currency`: Currency code (default: "ETB")

#### Transaction Status
- `transactionType`: Type of transaction (deposit, withdrawal, transfer, payment, refund, commission, tip)
- `transactionStatus`: Current status (pending, completed, failed, cancelled, processing)
- `paymentMethod`: Payment method used (telebirr, mpesa, bank_transfer, cash, wallet)
- `isPaid`: Boolean flag indicating if transaction is paid
- `isExpired`: Boolean flag for expired transactions
- `isFailed`: Boolean flag for failed transactions
- `isReversed`: Boolean flag for reversed transactions

#### Account Information
- `debitAccountNumber`: Account being debited
- `debitAccountHolderName`: Name of debit account holder
- `creditAccountNumber`: Account being credited
- `creditAccountHolderName`: Name of credit account holder
- `creditPhoneNumber`: Phone number associated with credit account

#### External References
- `telebirrReference`: TeleBirr transaction reference
- `mpesaReference`: M-Pesa transaction reference
- `incomingReference`: Reference for incoming transactions
- `bankName`: Name of the bank involved
- `BCICode`: Bank Code Identifier

#### Technical Data
- `coreResponse`: Core system response data
- `extRefResponse`: External reference response
- `reverseResponse`: Reversal response data
- `extRefStatus`: External reference status

#### Dates
- `transactionDate`: Date of transaction
- `dueDate`: Due date for payment
- `paidAt`: Date when payment was completed
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

## API Endpoints

### Base URL
```
/addisfix/transactions
```

### 1. Create Transaction
**POST** `/`

Creates a new transaction record.

**Request Body:**
```json
{
  "FTNumber": "FT123456789",
  "userId": "60d5ecb74b24a1234567890a",
  "userCode": "USER001",
  "phoneNumber": "+251911234567",
  "clientId": "60d5ecb74b24a1234567890b",
  "jobId": "60d5ecb74b24a1234567890c",
  "jobTitle": "Plumbing Repair",
  "technicianId": "60d5ecb74b24a1234567890d",
  "technicianName": "John Doe",
  "technicianPhone": "+251911234568",
  "debitAccountNumber": "1234567890",
  "debitAccountHolderName": "Client Name",
  "creditAccountNumber": "0987654321",
  "creditAccountHolderName": "Technician Name",
  "amount": 500,
  "serviceFee": 25,
  "VAT": 75,
  "tipAmount": 50,
  "transactionType": "payment",
  "paymentMethod": "telebirr",
  "transactionReason": "Job completion payment",
  "bankName": "Commercial Bank of Ethiopia",
  "agentCode": "AGT001",
  "branchCode": "BR001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "_id": "60d5ecb74b24a1234567890e",
    "transactionID": "TXN-1623456789-abc123def",
    "FTNumber": "FT123456789",
    "amount": 500,
    "totalAmount": 650,
    "transactionStatus": "pending",
    "createdAt": "2023-06-12T10:30:00.000Z",
    // ... other fields
  }
}
```

### 2. Get All Transactions
**GET** `/`

Retrieves transactions with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `userId`: Filter by user ID
- `clientId`: Filter by client ID
- `jobId`: Filter by job ID
- `technicianId`: Filter by technician ID
- `transactionType`: Filter by transaction type
- `transactionStatus`: Filter by status
- `paymentMethod`: Filter by payment method
- `isPaid`: Filter by payment status (true/false)
- `dateFrom`: Start date filter (YYYY-MM-DD)
- `dateTo`: End date filter (YYYY-MM-DD)
- `amountMin`: Minimum amount filter
- `amountMax`: Maximum amount filter
- `bankName`: Filter by bank name
- `agentCode`: Filter by agent code
- `branchCode`: Filter by branch code

**Example Request:**
```
GET /addisfix/transactions?page=1&limit=20&transactionStatus=completed&dateFrom=2023-06-01&dateTo=2023-06-30
```

### 3. Get Transaction by ID
**GET** `/:id`

Retrieves a specific transaction by its ID.

### 4. Update Transaction
**PUT** `/:id`

Updates an existing transaction.

**Request Body:**
```json
{
  "transactionStatus": "completed",
  "isPaid": true,
  "paidAmount": 650,
  "paidAt": "2023-06-12T11:00:00.000Z",
  "telebirrReference": "TB123456789"
}
```

### 5. Mark Transaction as Paid
**PATCH** `/:id/mark-paid`

Marks a transaction as paid and updates related fields.

**Request Body:**
```json
{
  "paidAmount": 650,
  "paymentMethod": "telebirr",
  "telebirrReference": "TB123456789"
}
```

### 6. Get Financial Summary
**GET** `/reports/summary`

Generates financial overview and analytics.

**Query Parameters:**
- `dateFrom`: Start date for report
- `dateTo`: End date for report
- `userId`: Filter by specific user
- `technicianId`: Filter by specific technician

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 12450,
    "totalExpenses": 8120,
    "netProfit": 4330,
    "pendingPayments": 2350,
    "technicianPayouts": 8120,
    "totalTransactions": 156,
    "completedTransactions": 142,
    "failedTransactions": 8,
    "pendingTransactions": 6,
    "averageTransactionAmount": 79.81,
    "totalServiceFees": 622.5,
    "totalVAT": 1867.5,
    "totalTips": 450,
    "totalCommissions": 1624
  }
}
```

### 7. Get Transactions by Job
**GET** `/job/:jobId`

Retrieves all transactions related to a specific job.

### 8. Get Transactions by Technician
**GET** `/technician/:technicianId`

Retrieves all transactions for a specific technician.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by transaction status

### 9. Cancel Transaction
**DELETE** `/:id`

Cancels a transaction (soft delete by setting status to 'cancelled').

## Usage Examples

### Creating a Job Payment Transaction

```javascript
const transactionData = {
  FTNumber: "FT" + Date.now(),
  userId: jobData.clientId,
  userCode: clientData.userCode,
  phoneNumber: clientData.phoneNumber,
  jobId: jobData._id,
  jobTitle: jobData.jobTitle,
  technicianId: jobData.technicianId,
  technicianName: techData.fullName,
  debitAccountNumber: clientData.mainAccount,
  debitAccountHolderName: clientData.fullName,
  creditAccountNumber: techData.mainAccount,
  creditAccountHolderName: techData.fullName,
  amount: jobData.jobPrice,
  serviceFee: jobData.jobPrice * 0.05, // 5% service fee
  VAT: jobData.jobPrice * 0.15, // 15% VAT
  transactionType: "payment",
  transactionReason: "Job completion payment",
  paymentMethod: "telebirr"
};

const response = await fetch('/addisfix/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(transactionData)
});
```

### Processing Technician Commission

```javascript
const commissionData = {
  FTNumber: "COM" + Date.now(),
  userId: technicianId,
  userCode: techData.userCode,
  technicianId: technicianId,
  jobId: jobId,
  debitAccountNumber: "PLATFORM_ACCOUNT",
  debitAccountHolderName: "AddisFix Platform",
  creditAccountNumber: techData.mainAccount,
  creditAccountHolderName: techData.fullName,
  amount: jobPrice * 0.8, // 80% to technician
  commissionAmount: jobPrice * 0.8,
  transactionType: "commission",
  transactionReason: "Technician commission payment"
};
```

### Generating Monthly Financial Report

```javascript
const startDate = new Date(2023, 5, 1); // June 1, 2023
const endDate = new Date(2023, 5, 30); // June 30, 2023

const response = await fetch(
  `/addisfix/transactions/reports/summary?dateFrom=${startDate.toISOString().split('T')[0]}&dateTo=${endDate.toISOString().split('T')[0]}`
);

const financialSummary = await response.json();
```

## Database Indexes

The following indexes are automatically created for optimal query performance:

- `transactionID` (unique)
- `userId`
- `jobId`
- `technicianId`
- `transactionStatus`
- `transactionType`
- `transactionDate` (descending)
- `isPaid`
- `clientId`

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Security Considerations

1. **Authentication**: All endpoints should be protected with proper authentication middleware
2. **Authorization**: Implement role-based access control
3. **Data Validation**: All input data is validated before processing
4. **Audit Trail**: All transaction modifications are logged with timestamps
5. **Encryption**: Sensitive financial data should be encrypted at rest

## Integration with Other Systems

### Job Management System
- Automatically create payment transactions when jobs are completed
- Link transactions to specific jobs for tracking
- Update job status based on payment status

### User Management System
- Link transactions to users, clients, and technicians
- Validate user permissions before processing transactions
- Track user transaction history

### External Payment Systems
- Integration with TeleBirr for mobile payments
- M-Pesa integration for cross-border transactions
- Bank transfer processing through core banking systems

## Monitoring and Analytics

### Key Metrics to Track
- Transaction success rate
- Average transaction processing time
- Revenue trends
- Technician payout efficiency
- Failed transaction analysis
- Customer payment patterns

### Alerts and Notifications
- Failed transaction alerts
- Large transaction notifications
- Unusual activity detection
- Payment due reminders
- Commission payment notifications

## Backup and Recovery

1. **Regular Backups**: Automated daily backups of transaction data
2. **Point-in-Time Recovery**: Ability to restore to specific timestamps
3. **Data Integrity Checks**: Regular validation of transaction data consistency
4. **Disaster Recovery**: Procedures for system recovery in case of failures

## Performance Optimization

1. **Database Indexing**: Proper indexes for frequently queried fields
2. **Pagination**: All list endpoints support pagination
3. **Caching**: Implement caching for frequently accessed data
4. **Query Optimization**: Efficient database queries with proper joins
5. **Background Processing**: Heavy operations processed asynchronously

## Compliance and Regulations

1. **Financial Regulations**: Compliance with Ethiopian financial regulations
2. **Data Protection**: GDPR-compliant data handling
3. **Audit Requirements**: Comprehensive audit trails
4. **Tax Compliance**: Proper VAT calculation and reporting
5. **Anti-Money Laundering**: Transaction monitoring for suspicious activities 