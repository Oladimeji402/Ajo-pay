import assert from "node:assert/strict";
import { buildReferralSignupUrl, normalizeReferralCode } from "../lib/referrals/referral-code";

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

testNormalizeReferralCode();
testBuildReferralSignupUrl();

console.log("referral-code tests passed");
