# Testing Guide

This directory contains test scripts for validating Monicredit integration.

## 🎯 START HERE: Mocked Tests (FREE - No Money Spent!)

**Run this first to test your logic WITHOUT spending money:**

```bash
npm run test:mock
```

This runs unit tests with **mocked responses** - NO real API calls, NO money spent!

## Prerequisites

1. **Environment Variables**: Ensure your `.env` file has:
   ```env
   MONICREDIT_PRIVATE_KEY="PRI_LIVE_XXXXXX"
   MONICREDIT_BASE_URL="https://live.backend.monicredit.com/api/v1"
   MONICREDIT_MERCHANT_EMAIL="your-email@domain.com"
   MONICREDIT_MERCHANT_PASSWORD="your-password"
   ```

2. **Node.js**: Node.js 18+ installed

## Available Tests

### 1. Virtual Account Creation Test
Tests the complete flow of creating virtual accounts via Monicredit API.

**What it tests:**
- ✅ Environment variables configuration
- ✅ Monicredit authentication
- ✅ Creating virtual account with valid data
- ✅ Duplicate phone number handling
- ✅ Missing NIN/BVN validation

**Run:**
```bash
npx tsx tests/virtual-account-creation.test.ts
```

### 2. Payment Verification Test
Tests the payment verification flow with Monicredit.

**What it tests:**
- ✅ Environment variables configuration
- ✅ Monicredit authentication
- ✅ Transaction verification with valid ID
- ✅ Transaction verification with invalid ID
- ✅ Wallet transaction fetching
- ✅ Transaction status mapping

**Before running:**
- Replace `TEST_TXN_ID_HERE` with a real transaction ID from Monicredit dashboard
- Replace `TEST_WALLET_ID_HERE` with a real wallet ID from your database

**Run:**
```bash
npx tsx tests/payment-verification.test.ts
```

## Running All Tests

```bash
# Install tsx if not already installed
npm install -D tsx

# Run virtual account tests
npx tsx tests/virtual-account-creation.test.ts

# Run payment verification tests
npx tsx tests/payment-verification.test.ts
```

## Understanding Test Results

### Success (✅)
```
✅ Test 1: Environment Variables Check
   All required environment variables are set
```

### Failure (❌)
```
❌ Test 2: Monicredit Authentication
   Authentication failed: Invalid credentials
```

### Skipped (⚠️)
```
⚠️  Test 3: Verify Transaction (Valid ID)
   Skipped: Please replace TEST_TXN_ID_HERE with a real transaction ID
```

## Getting Test Data

### Get Transaction ID:
1. Login to Monicredit dashboard: https://live.backend.monicredit.com
2. Navigate to Transactions
3. Copy any transaction ID (e.g., `ACX630613842`)
4. Replace `TEST_TXN_ID_HERE` in `payment-verification.test.ts`

### Get Wallet ID:
1. Login to your app's database (Supabase)
2. Run query:
   ```sql
   SELECT monicredit_wallet_id FROM profiles 
   WHERE monicredit_wallet_id IS NOT NULL 
   LIMIT 1;
   ```
3. Copy the wallet ID (e.g., `W000000`)
4. Replace `TEST_WALLET_ID_HERE` in `payment-verification.test.ts`

## Troubleshooting

### "Authentication failed"
- Check your Monicredit credentials in `.env`
- Verify you're using the correct base URL (demo vs live)
- Ensure the merchant account is active

### "Missing environment variables"
- Copy `.env.example` to `.env`
- Fill in all Monicredit credentials
- Restart your terminal/IDE

### "Transaction not found"
- Use a real transaction ID from your Monicredit dashboard
- Ensure the transaction exists in the correct environment (demo vs live)

### "Failed to fetch transactions"
- Verify the wallet ID exists in Monicredit
- Check that the Bearer token is valid
- Ensure the wallet has at least one transaction

## Adding New Tests

Create a new test file following this structure:

```typescript
// tests/your-test.test.ts

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

async function yourTest() {
  console.log('🧪 Starting Your Tests...\\n');
  
  await testSomething();
  
  printResults();
}

async function testSomething() {
  const test = 'Your Test Name';
  
  try {
    // Your test logic here
    
    results.push({
      test,
      passed: true,
      message: 'Test passed successfully',
    });
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function printResults() {
  // Copy from existing test files
}

yourTest();
```

## CI/CD Integration

To run tests in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx tsx tests/virtual-account-creation.test.ts
      - run: npx tsx tests/payment-verification.test.ts
    env:
      MONICREDIT_PRIVATE_KEY: ${{ secrets.MONICREDIT_PRIVATE_KEY }}
      MONICREDIT_BASE_URL: ${{ secrets.MONICREDIT_BASE_URL }}
      MONICREDIT_MERCHANT_EMAIL: ${{ secrets.MONICREDIT_MERCHANT_EMAIL }}
      MONICREDIT_MERCHANT_PASSWORD: ${{ secrets.MONICREDIT_MERCHANT_PASSWORD }}
```

## Notes

- These tests interact with the **live Monicredit API**
- Creating virtual accounts in tests will create real accounts
- Use demo environment for testing: `https://demo.backend.monicredit.com/api/v1`
- Clean up test data periodically from your Monicredit dashboard
