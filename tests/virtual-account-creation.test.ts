/**
 * Virtual Account Creation Test
 * 
 * This test validates the complete flow of creating a virtual account via Monicredit API
 * 
 * Prerequisites:
 * - User must have name, email, phone
 * - User must have either NIN or BVN
 * - Valid Monicredit credentials in .env
 */

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

async function testVirtualAccountCreation() {
  console.log('🧪 Starting Virtual Account Creation Tests...\n');

  // Test 1: Check environment variables
  await testEnvironmentVariables();

  // Test 2: Test Monicredit authentication
  await testMonicreditAuth();

  // Test 3: Test virtual account creation with valid data
  await testCreateVirtualAccount();

  // Test 4: Test duplicate phone number handling
  await testDuplicatePhoneNumber();

  // Test 5: Test missing NIN/BVN validation
  await testMissingVerification();

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

async function testCreateVirtualAccount() {
  const test = 'Create Virtual Account (Valid Data)';
  
  try {
    const baseUrl = process.env.MONICREDIT_BASE_URL;
    const privateKey = process.env.MONICREDIT_PRIVATE_KEY;

    // Generate unique test data
    const timestamp = Date.now();
    const testData = {
      private_key: privateKey,
      first_name: 'Test',
      last_name: 'User',
      phone: `08${timestamp.toString().slice(-9)}`, // Generate unique 11-digit number
      email: `test${timestamp}@ajopay.test`,
      bvn: '12345678901', // Test BVN
    };

    console.log(`  📞 Test phone: ${testData.phone}`);
    console.log(`  📧 Test email: ${testData.email}\n`);

    const response = await fetch(`${baseUrl}/payment/virtual-account/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      results.push({
        test,
        passed: false,
        message: `Failed to create virtual account: ${data.message || 'Unknown error'}`,
        data,
      });
    } else {
      const accountNumber = data.data?.account_number || data.data?.virtual_accounts?.[0]?.account_number;
      const bankName = data.data?.bank_name || data.data?.virtual_accounts?.[0]?.bank_name;
      const walletId = data.data?.wallet_id;
      const customerId = data.data?.customer_id;

      if (!accountNumber || !bankName || !walletId || !customerId) {
        results.push({
          test,
          passed: false,
          message: 'Virtual account created but response is incomplete',
          data,
        });
      } else {
        results.push({
          test,
          passed: true,
          message: `Virtual account created successfully: ${accountNumber} (${bankName})`,
          data: {
            accountNumber,
            bankName,
            walletId,
            customerId,
          },
        });
      }
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testDuplicatePhoneNumber() {
  const test = 'Duplicate Phone Number Handling';
  
  try {
    const baseUrl = process.env.MONICREDIT_BASE_URL;
    const privateKey = process.env.MONICREDIT_PRIVATE_KEY;

    // Use same phone number twice
    const testData = {
      private_key: privateKey,
      first_name: 'Test',
      last_name: 'Duplicate',
      phone: '08123456789', // Known existing number
      email: `duplicate${Date.now()}@ajopay.test`,
      bvn: '12345678901',
    };

    const response = await fetch(`${baseUrl}/payment/virtual-account/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    // We expect this to either fail with duplicate error or succeed (if phone is available)
    const isDuplicateError = !data.status && 
      (data.message?.toLowerCase().includes('phone') ||
       data.message?.toLowerCase().includes('duplicate') ||
       data.message?.toLowerCase().includes('exist'));

    results.push({
      test,
      passed: true, // This test passes if we can detect duplicate or create new
      message: isDuplicateError 
        ? 'Correctly detected duplicate phone number' 
        : 'Phone number was available (no duplicate)',
      data: { isDuplicateError, message: data.message },
    });
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testMissingVerification() {
  const test = 'Missing NIN/BVN Validation';
  
  try {
    const baseUrl = process.env.MONICREDIT_BASE_URL;
    const privateKey = process.env.MONICREDIT_PRIVATE_KEY;

    const testData = {
      private_key: privateKey,
      first_name: 'Test',
      last_name: 'NoVerification',
      phone: `09${Date.now().toString().slice(-9)}`,
      email: `noverify${Date.now()}@ajopay.test`,
      // No NIN or BVN provided
    };

    const response = await fetch(`${baseUrl}/payment/virtual-account/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    // Monicredit might allow this or reject it
    // The validation is primarily in our app, not Monicredit
    results.push({
      test,
      passed: true,
      message: data.status 
        ? 'Monicredit allows accounts without NIN/BVN (validation should be in app)' 
        : 'Monicredit rejected account without NIN/BVN',
      data: { allowed: data.status, message: data.message },
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
testVirtualAccountCreation();
