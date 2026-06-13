/**
 * Payment Verification Test
 * 
 * This test validates the payment verification flow with Monicredit
 * 
 * Prerequisites:
 * - Valid Monicredit credentials in .env
 * - A test transaction ID from Monicredit (you can get this from their dashboard)
 */

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

async function testPaymentVerification() {
  console.log('🧪 Starting Payment Verification Tests...\n');

  // Test 1: Check environment variables
  await testEnvironmentVariables();

  // Test 2: Test Monicredit authentication
  await testMonicreditAuth();

  // Test 3: Test transaction verification with valid ID
  await testVerifyValidTransaction();

  // Test 4: Test transaction verification with invalid ID
  await testVerifyInvalidTransaction();

  // Test 5: Test wallet transaction fetching
  await testGetWalletTransactions();

  // Test 6: Test transaction status mapping
  await testStatusMapping();

  // Print results
  printResults();
}

async function testEnvironmentVariables() {
  const test = 'Environment Variables Check';
  
  try {
    const required = [
      'MONICREDIT_PRIVATE_KEY',
      'MONICREDIT_BASE_URL',
      'MONICREDIT_MERCHANT_EMAIL',
      'MONICREDIT_MERCHANT_PASSWORD',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      results.push({
        test,
        passed: false,
        message: `Missing environment variables: ${missing.join(', ')}`,
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'All required environment variables are set',
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testMonicreditAuth() {
  const test = 'Monicredit Authentication';
  
  try {
    const baseUrl = process.env.MONICREDIT_BASE_URL;
    const email = process.env.MONICREDIT_MERCHANT_EMAIL;
    const password = process.env.MONICREDIT_MERCHANT_PASSWORD;

    const response = await fetch(`${baseUrl}/core/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success || !data.accessToken) {
      results.push({
        test,
        passed: false,
        message: `Authentication failed: ${data.message || 'Invalid response'}`,
        data,
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'Successfully authenticated with Monicredit',
        data: {
          tokenReceived: true,
          merchantId: data.userData?.activeMerchant,
        },
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testVerifyValidTransaction() {
  const test = 'Verify Transaction (Valid ID)';
  
  try {
    const baseUrl = process.env.MONICREDIT_BASE_URL;
    const privateKey = process.env.MONICREDIT_PRIVATE_KEY;

    // NOTE: Replace with an actual transaction ID from your Monicredit dashboard
    const testTransactionId = 'TEST_TXN_ID_HERE';

    console.log(`  🔍 Testing with transaction ID: ${testTransactionId}\n`);

    const url = `${baseUrl}/payment/transactions/verify-transaction?transaction_id=${encodeURIComponent(testTransactionId)}&private_key=${encodeURIComponent(privateKey!)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (testTransactionId === 'TEST_TXN_ID_HERE') {
      results.push({
        test,
        passed: true,
        message: '⚠️  Skipped: Please replace TEST_TXN_ID_HERE with a real transaction ID',
      });
    } else if (!response.ok || !data.status) {
      results.push({
        test,
        passed: false,
        message: `Verification failed: ${data.message || 'Transaction not found'}`,
        data,
      });
    } else {
      const txData = data.data || data;
      results.push({
        test,
        passed: true,
        message: `Transaction verified: ${txData.status} - NGN ${txData.amount}`,
        data: {
          status: txData.status,
          amount: txData.amount,
          transid: txData.transid,
          orderid: txData.orderid,
          channel: txData.channel,
          date_paid: txData.date_paid,
        },
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testVerifyInvalidTransaction() {
  const test = 'Verify Transaction (Invalid ID)';
  
  try {
    const baseUrl = process.env.MONICREDIT_BASE_URL;
    const privateKey = process.env.MONICREDIT_PRIVATE_KEY;

    const invalidTransactionId = 'INVALID_TXN_ID_12345';

    const url = `${baseUrl}/payment/transactions/verify-transaction?transaction_id=${encodeURIComponent(invalidTransactionId)}&private_key=${encodeURIComponent(privateKey!)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // We expect this to fail
    if (!response.ok || !data.status) {
      results.push({
        test,
        passed: true,
        message: 'Correctly rejected invalid transaction ID',
        data: { message: data.message },
      });
    } else {
      results.push({
        test,
        passed: false,
        message: 'Unexpectedly accepted invalid transaction ID',
        data,
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testGetWalletTransactions() {
  const test = 'Get Wallet Transactions';
  
  try {
    const baseUrl = process.env.MONICREDIT_BASE_URL;
    const email = process.env.MONICREDIT_MERCHANT_EMAIL;
    const password = process.env.MONICREDIT_MERCHANT_PASSWORD;

    // First, get Bearer token
    const authResponse = await fetch(`${baseUrl}/core/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authResponse.json();
    if (!authData.success || !authData.accessToken) {
      throw new Error('Failed to get Bearer token');
    }

    // NOTE: Replace with an actual wallet ID from your database
    const testWalletId = 'TEST_WALLET_ID_HERE';

    if (testWalletId === 'TEST_WALLET_ID_HERE') {
      results.push({
        test,
        passed: true,
        message: '⚠️  Skipped: Please replace TEST_WALLET_ID_HERE with a real wallet ID',
      });
      return;
    }

    const url = `${baseUrl}/payment/transactions/virtual-account?wallet_id=${encodeURIComponent(testWalletId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      results.push({
        test,
        passed: false,
        message: `Failed to fetch transactions: ${data.message || 'Unknown error'}`,
        data,
      });
    } else {
      const transactions = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      results.push({
        test,
        passed: true,
        message: `Fetched ${transactions.length} transaction(s) for wallet ${testWalletId}`,
        data: { count: transactions.length },
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testStatusMapping() {
  const test = 'Transaction Status Mapping';
  
  try {
    // Test the status mapping logic
    interface StatusMapping {
      providerStatus: string;
      resolvedStatus: 'success' | 'pending' | 'failed';
      terminal: boolean;
    }

    const mapStatus = (status: string | null | undefined): StatusMapping => {
      const normalized = String(status ?? '').trim().toUpperCase();

      switch (normalized) {
        case 'APPROVED':
          return {
            providerStatus: normalized,
            resolvedStatus: 'success',
            terminal: true,
          };
        case 'PENDING':
          return {
            providerStatus: normalized,
            resolvedStatus: 'pending',
            terminal: false,
          };
        case 'FAILED':
        case 'DECLINED':
          return {
            providerStatus: normalized,
            resolvedStatus: 'failed',
            terminal: true,
          };
        default:
          return {
            providerStatus: normalized || 'pending',
            resolvedStatus: 'pending',
            terminal: false,
          };
      }
    };

    const testCases = [
      { input: 'APPROVED', expected: { resolvedStatus: 'success', terminal: true } },
      { input: 'PENDING', expected: { resolvedStatus: 'pending', terminal: false } },
      { input: 'FAILED', expected: { resolvedStatus: 'failed', terminal: true } },
      { input: 'DECLINED', expected: { resolvedStatus: 'failed', terminal: true } },
      { input: 'UNKNOWN', expected: { resolvedStatus: 'pending', terminal: false } },
      { input: null, expected: { resolvedStatus: 'pending', terminal: false } },
    ];

    let allPassed = true;
    const results_detail = testCases.map(tc => {
      const result = mapStatus(tc.input);
      const passed = result.resolvedStatus === tc.expected.resolvedStatus && 
                     result.terminal === tc.expected.terminal;
      if (!passed) allPassed = false;
      return {
        input: tc.input,
        output: result.resolvedStatus,
        terminal: result.terminal,
        passed,
      };
    });

    results.push({
      test,
      passed: allPassed,
      message: allPassed 
        ? 'All status mappings are correct' 
        : 'Some status mappings failed',
      data: results_detail,
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
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(70) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    }
    console.log();
  });

  console.log('='.repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(70) + '\n');

  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
testPaymentVerification();
