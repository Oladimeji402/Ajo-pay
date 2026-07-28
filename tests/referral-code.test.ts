import assert from "node:assert/strict";
import {
  buildReferralSignupUrl,
  normalizeReferralCode,
  validateCustomReferralCode,
} from "../lib/referrals/referral-code";

function testNormalizeReferralCode() {
  assert.equal(normalizeReferralCode(" mk-abc123 "), "MK-ABC123");
  assert.equal(normalizeReferralCode(""), null);
  assert.equal(normalizeReferralCode(null), null);
  assert.equal(normalizeReferralCode(undefined), null);
}

function testBuildReferralSignupUrl() {
  assert.equal(
    buildReferralSignupUrl("https://app.example.com", "MK-ABC123"),
    "https://app.example.com/signup?ref=MK-ABC123",
  );
  assert.equal(
    buildReferralSignupUrl("https://app.example.com/", "MK-ABC123"),
    "https://app.example.com/signup?ref=MK-ABC123",
  );
}

function testValidateCustomReferralCode() {
  assert.equal(validateCustomReferralCode("adeola").ok, true);
  assert.equal(validateCustomReferralCode("ADEOLA2026").ok, true);
  assert.equal(validateCustomReferralCode("MK-CHIKE").ok, true);
  assert.equal(validateCustomReferralCode("AB").ok, false);
  assert.equal(validateCustomReferralCode("123ABC").ok, false);
  assert.equal(validateCustomReferralCode("BAD_CODE").ok, false);
  const good = validateCustomReferralCode(" joy2026 ");
  assert.equal(good.ok, true);
  if (good.ok) assert.equal(good.code, "JOY2026");
}

testNormalizeReferralCode();
testBuildReferralSignupUrl();
testValidateCustomReferralCode();

console.log("referral-code tests passed");
