/**
 * Test script for MonieCredit Bank APIs
 * Run with: node --env-file=.env -r tsx/cjs scripts/test-monicredit-banks.ts
 * Or: Load .env manually and run: npx tsx scripts/test-monicredit-banks.ts
 */

import { listMonicreditBanks, resolveMonicreditAccount } from "../lib/monicredit";

async function testMonicreditBankAPIs() {
  console.log("🔍 Testing MonieCredit Bank APIs...\n");

  // Check if environment variables are loaded
  if (!process.env.MONICREDIT_PRIVATE_KEY) {
    console.error("❌ Error: Environment variables not loaded!");
    console.log("\n📝 To run this test:");
    console.log("   1. Make sure .env file exists with MonieCredit credentials");
    console.log("   2. Run: node --env-file=.env -r tsx/cjs scripts/test-monicredit-banks.ts");
    console.log("   Or manually export the variables before running this script\n");
    process.exit(1);
  }

  try {
    // Test 1: List Banks
    console.log("1️⃣ Testing Bank List API...");
    const banks = await listMonicreditBanks();
    console.log(`✅ Successfully fetched ${banks.length} banks`);
    console.log("Sample banks:");
    banks.slice(0, 5).forEach((bank) => {
      console.log(`   - ${bank.name} (${bank.code})`);
    });
    console.log("");

    // Test 2: Name Enquiry (Account Verification)
    // You'll need to replace these with valid test account details
    console.log("2️⃣ Testing Name Enquiry API...");
    console.log("⚠️  To test account verification, update this script with valid account details");
    
    // Example usage (uncomment and add valid details to test):
    /*
    const testBankCode = "058"; // GTBank code
    const testAccountNumber = "0123456789"; // Replace with valid account
    
    console.log(`   Verifying account: ${testAccountNumber} at bank code: ${testBankCode}`);
    const accountDetails = await resolveMonicreditAccount({
      accountNumber: testAccountNumber,
      bankCode: testBankCode,
    });
    
    console.log("✅ Account verification successful:");
    console.log(`   Account Name: ${accountDetails.account_name}`);
    console.log(`   Account Number: ${accountDetails.account_number}`);
    console.log(`   Bank Code: ${accountDetails.bank_code}`);
    */

    console.log("\n✨ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testMonicreditBankAPIs();
