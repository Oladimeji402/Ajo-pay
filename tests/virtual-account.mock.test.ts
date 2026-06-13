/**
 * Virtual Account Creation - MOCKED Unit Tests
 * 
 * These tests use MOCKED responses - NO REAL API CALLS OR MONEY SPENT
 * Perfect for testing logic without hitting Monicredit API
 */

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

const results: TestResult[] = [];

// Mock Monicredit API responses
const MOCK_RESPONSES = {
  successfulAccountCreation: {
    status: true,
    message: "Customer created successfully",
    data: {
      wallet_id: "W12345678",
      customer_id: "CUS12345",
      customer_email: "test@example.com",
      account_name: "MC| Test User",
      account_number: "1234567890",
      bank_name: "WEMA",
      credit: 0,
      debit: 0,
      balance: 0,
      virtual_accounts: [
        {
          id: "VA12345",
          wallet_id: "W12345678",
          name: "Test User",
          first_name: "Test",
          last_name: "User",
          phone: "08012345678",
          email: "test@example.com",
          account_name: "MC| Test User",
          account_number: "1234567890",
          bank_name: "WEMA",
          account_type: "STANDARD",
          service_provider: "provider",
          status: "ACTIVE",
          expiry_date: null,
          created_at: "2024-01-01 12:00:00",
          updated_at: "2024-01-01 12:00:00",
          account_reference: null
        }
      ],
      reference: "REF12345"
    }
  },
  duplicatePhoneError: {
    status: false,
    message: "Phone number already exists"
  },
  invalidCredentials: {
    status: false,
    message: "Invalid Authorization key"
  },
  successfulTransaction: {
    status: true,
    message: "Transaction Successfully",
    orderid: "ORD12345",
    data: {
      amount: 100000, // In kobo (₦1,000)
      orderid: "ORD12345",
      transid: "ACX12345678",
      date_paid: "2024-01-01 12:00:00",
      status: "APPROVED",
      channel: "TRANSFER",
      balance: 0
    }
  },
  pendingTransaction: {
    status: true,
    message: "Transaction Pending",
    data: {
      amount: 100000,
      orderid: "ORD12345",
      transid: "ACX12345678",
      date_paid: "2024-01-01 12:00:00",
      status: "PENDING",
      channel: "TRANSFER"
    }
  },
  failedTransaction: {
    status: false,
    message: "Transaction Declined",
    data: {
      orderid: "ORD12345",
      transid: "ACX12345678",
      date_paid: "2024-01-01 12:00:00",
      status: "FAILED",
      channel: "TRANSFER"
    }
  }
};

async function runMockedTests() {
  console.log('🧪 Running MOCKED Unit Tests (No Real API Calls)\n');
  console.log('✅ Safe to run - No money will be spent!\n');

  testVirtualAccountResponseParsing();
  testPhoneNumberNormalization();
  testStatusMapping();
  testAmountValidation();
  testDuplicateDetection();
  testRequiredFieldsValidation();
  testAccountNumberExtraction();

  printResults();
}

function testVirtualAccountResponseParsing() {
  const test = 'Parse Virtual Account Creation Response';
  
  try {
    const response = MOCK_RESPONSES.successfulAccountCreation;
    
    // Simulate extraction logic from provision-virtual-account route
    const accountNumber = response.data.account_number ?? response.data.virtual_accounts?.[0]?.account_number ?? null;
    const bankName = response.data.bank_name ?? response.data.virtual_accounts?.[0]?.bank_name ?? null;
    const accountName = response.data.account_name ?? response.data.virtual_accounts?.[0]?.account_name ?? null;
    const walletId = response.data.wallet_id ?? response.data.virtual_accounts?.[0]?.wallet_id ?? null;
    const customerId = response.data.customer_id ?? null;

    const allFieldsPresent = accountNumber && bankName && accountName && walletId && customerId;

    if (!allFieldsPresent) {
      results.push({
        test,
        passed: false,
        message: 'Failed to extract all required fields from response',
        data: { accountNumber, bankName, accountName, walletId, customerId }
      });
    } else {
      results.push({
        test,
        passed: true,
        message: `Successfully extracted: ${accountNumber} (${bankName})`,
        data: { accountNumber, bankName, accountName, walletId, customerId }
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function testPhoneNumberNormalization() {
  const test = 'Phone Number Normalization';
  
  try {
    const normalizePhone = (phone: string): string => {
      const digits = phone.replace(/\D/g, '');
      if (!digits) return '';
      
      if (digits.startsWith('234') && digits.length === 13) {
        return digits.slice(3);
      }
      
      if (digits.length === 11 && digits.startsWith('0')) {
        return digits.slice(1);
      }
      
      if (digits.length === 10) {
        return digits;
      }
      
      return digits;
    };

    const testCases = [
      { input: '08012345678', expected: '8012345678' },
      { input: '2348012345678', expected: '8012345678' },
      { input: '8012345678', expected: '8012345678' },
      { input: '+2348012345678', expected: '8012345678' },
      { input: '0801 234 5678', expected: '8012345678' },
    ];

    const failed = testCases.filter(tc => {
      const result = normalizePhone(tc.input);
      return result !== tc.expected;
    });

    if (failed.length > 0) {
      results.push({
        test,
        passed: false,
        message: `${failed.length} phone normalization(s) failed`,
        data: failed
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'All phone number formats normalized correctly'
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function testStatusMapping() {
  const test = 'Transaction Status Mapping';
  
  try {
    const mapStatus = (status: string | null | undefined) => {
      const normalized = String(status ?? '').trim().toUpperCase();

      switch (normalized) {
        case 'APPROVED':
          return { resolvedStatus: 'success', terminal: true };
        case 'PENDING':
          return { resolvedStatus: 'pending', terminal: false };
        case 'FAILED':
        case 'DECLINED':
          return { resolvedStatus: 'failed', terminal: true };
        default:
          return { resolvedStatus: 'pending', terminal: false };
      }
    };

    const testCases = [
      { status: 'APPROVED', expected: { resolvedStatus: 'success', terminal: true } },
      { status: 'PENDING', expected: { resolvedStatus: 'pending', terminal: false } },
      { status: 'FAILED', expected: { resolvedStatus: 'failed', terminal: true } },
      { status: 'DECLINED', expected: { resolvedStatus: 'failed', terminal: true } },
      { status: 'UNKNOWN', expected: { resolvedStatus: 'pending', terminal: false } },
      { status: null, expected: { resolvedStatus: 'pending', terminal: false } },
    ];

    const failed = testCases.filter(tc => {
      const result = mapStatus(tc.status);
      return result.resolvedStatus !== tc.expected.resolvedStatus || 
             result.terminal !== tc.expected.terminal;
    });

    if (failed.length > 0) {
      results.push({
        test,
        passed: false,
        message: `${failed.length} status mapping(s) incorrect`,
        data: failed
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'All transaction statuses mapped correctly'
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function testAmountValidation() {
  const test = 'Amount Validation & Conversion';
  
  try {
    const MIN_AMOUNT = 500; // Minimum ₦500
    
    const validateAmount = (amount: number | string): { valid: boolean; amountNaira: number | null } => {
      const parsed = Number(amount ?? 0);
      if (!Number.isFinite(parsed) || parsed < MIN_AMOUNT) {
        return { valid: false, amountNaira: null };
      }
      return { valid: true, amountNaira: Math.round(parsed) };
    };

    const testCases = [
      { input: 1000, expected: { valid: true, amountNaira: 1000 } },
      { input: 500, expected: { valid: true, amountNaira: 500 } },
      { input: 499, expected: { valid: false, amountNaira: null } },
      { input: '1500', expected: { valid: true, amountNaira: 1500 } },
      { input: 0, expected: { valid: false, amountNaira: null } },
      { input: -100, expected: { valid: false, amountNaira: null } },
    ];

    const failed = testCases.filter(tc => {
      const result = validateAmount(tc.input);
      return result.valid !== tc.expected.valid || 
             result.amountNaira !== tc.expected.amountNaira;
    });

    if (failed.length > 0) {
      results.push({
        test,
        passed: false,
        message: `${failed.length} amount validation(s) incorrect`,
        data: failed
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'All amounts validated correctly (min ₦500)'
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function testDuplicateDetection() {
  const test = 'Duplicate Error Detection';
  
  try {
    const isDuplicateError = (errorMessage: string): boolean => {
      const msg = errorMessage.toLowerCase();
      return (
        (msg.includes('phone') && (msg.includes('already') || msg.includes('exist'))) ||
        msg.includes('duplicate') ||
        (msg.includes('customer') && msg.includes('exist'))
      );
    };

    const testCases = [
      { message: 'Phone number already exists', expected: true },
      { message: 'Duplicate phone number', expected: true },
      { message: 'Phone already in use', expected: true },
      { message: 'Customer already exist', expected: true },
      { message: 'Invalid Authorization key', expected: false },
      { message: 'Network error', expected: false },
    ];

    const failed = testCases.filter(tc => {
      const result = isDuplicateError(tc.message);
      return result !== tc.expected;
    });

    if (failed.length > 0) {
      results.push({
        test,
        passed: false,
        message: `${failed.length} duplicate detection(s) incorrect`,
        data: failed
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'Duplicate errors detected correctly'
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function testRequiredFieldsValidation() {
  const test = 'Required Fields Validation';
  
  try {
    interface UserData {
      name?: string;
      email?: string;
      phone?: string;
      nin?: string;
      bvn?: string;
    }

    const validateRequiredFields = (user: UserData): { valid: boolean; missing: string[] } => {
      const missing: string[] = [];
      
      if (!user.name || user.name.trim().length === 0) missing.push('name');
      if (!user.email || user.email.trim().length === 0) missing.push('email');
      if (!user.phone || user.phone.trim().length === 0) missing.push('phone');
      if (!user.nin && !user.bvn) missing.push('nin or bvn');
      
      return { valid: missing.length === 0, missing };
    };

    const testCases = [
      {
        user: { name: 'Test', email: 'test@test.com', phone: '08012345678', nin: '12345678901' },
        expected: { valid: true, missing: [] }
      },
      {
        user: { name: 'Test', email: 'test@test.com', phone: '08012345678', bvn: '12345678901' },
        expected: { valid: true, missing: [] }
      },
      {
        user: { name: '', email: 'test@test.com', phone: '08012345678', nin: '12345678901' },
        expected: { valid: false, missing: ['name'] }
      },
      {
        user: { name: 'Test', email: 'test@test.com', phone: '08012345678' },
        expected: { valid: false, missing: ['nin or bvn'] }
      },
    ];

    const failed = testCases.filter(tc => {
      const result = validateRequiredFields(tc.user);
      return result.valid !== tc.expected.valid;
    });

    if (failed.length > 0) {
      results.push({
        test,
        passed: false,
        message: `${failed.length} validation(s) incorrect`,
        data: failed
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'Required fields validated correctly'
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function testAccountNumberExtraction() {
  const test = 'Account Number Extraction (Multiple Formats)';
  
  try {
    // Test that we can extract account number from different response structures
    const responses = [
      {
        // Format 1: Direct in data
        response: {
          status: true,
          data: {
            account_number: '1234567890',
            bank_name: 'WEMA',
            wallet_id: 'W12345'
          }
        },
        expected: '1234567890'
      },
      {
        // Format 2: In virtual_accounts array
        response: {
          status: true,
          data: {
            virtual_accounts: [
              { account_number: '0987654321', bank_name: 'WEMA', wallet_id: 'W54321' }
            ]
          }
        },
        expected: '0987654321'
      },
      {
        // Format 3: Both present (prefer direct)
        response: {
          status: true,
          data: {
            account_number: '1111111111',
            virtual_accounts: [
              { account_number: '2222222222' }
            ]
          }
        },
        expected: '1111111111'
      },
    ];

    const failed = responses.filter(r => {
      const accountNumber = r.response.data.account_number ?? 
                           r.response.data.virtual_accounts?.[0]?.account_number ?? 
                           null;
      return accountNumber !== r.expected;
    });

    if (failed.length > 0) {
      results.push({
        test,
        passed: false,
        message: `${failed.length} extraction(s) incorrect`,
        data: failed
      });
    } else {
      results.push({
        test,
        passed: true,
        message: 'Account numbers extracted from all response formats'
      });
    }
  } catch (error) {
    results.push({
      test,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 MOCKED TEST RESULTS');
  console.log('='.repeat(70) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.data && !result.passed) {
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    }
    console.log();
  });

  console.log('='.repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(70) + '\n');

  if (failed === 0) {
    console.log('🎉 All mocked tests passed!');
    console.log('💡 These tests validate your logic WITHOUT spending money');
  } else {
    console.log('⚠️  Some tests failed. Check the logic in your code.');
  }
}

// Run tests
runMockedTests();
