/**
 * NIN (National Identification Number) and BVN (Bank Verification Number) validation utilities
 */

/**
 * Validates NIN format (11 digits)
 */
export function isValidNIN(nin: string): boolean {
  if (!nin || typeof nin !== 'string') return false;
  const cleaned = nin.trim();
  return /^\d{11}$/.test(cleaned);
}

/**
 * Validates BVN format (11 digits)
 */
export function isValidBVN(bvn: string): boolean {
  if (!bvn || typeof bvn !== 'string') return false;
  const cleaned = bvn.trim();
  return /^\d{11}$/.test(cleaned);
}

/**
 * Formats NIN/BVN for display (adds spaces for readability)
 * Example: 12345678901 -> 123 4567 8901
 */
export function formatVerificationNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`;
}

/**
 * Normalizes NIN/BVN input (removes non-digits, limits to 11 characters)
 */
export function normalizeVerificationNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

/**
 * Basic checksum validation for NIN
 * Note: This is a simplified validation. Real NIN validation requires NIMC API
 */
export function validateNINChecksum(nin: string): boolean {
  if (!isValidNIN(nin)) return false;
  
  // NIN uses a Luhn-like algorithm
  const digits = nin.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[10];
}

/**
 * Basic checksum validation for BVN
 * Note: This is a simplified validation. Real BVN validation requires bank API
 */
export function validateBVNChecksum(bvn: string): boolean {
  if (!isValidBVN(bvn)) return false;
  
  // BVN uses a weighted checksum algorithm
  const digits = bvn.split('').map(Number);
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3];
  
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }
  
  const checkDigit = sum % 10;
  return checkDigit === digits[10];
}

/**
 * Validates NIN with checksum
 */
export function validateNIN(nin: string): { valid: boolean; error?: string } {
  if (!nin || !nin.trim()) {
    return { valid: false, error: 'NIN is required' };
  }
  
  if (!isValidNIN(nin)) {
    return { valid: false, error: 'NIN must be exactly 11 digits' };
  }
  
  if (!validateNINChecksum(nin)) {
    return { valid: false, error: 'Invalid NIN checksum. Please verify your NIN' };
  }
  
  return { valid: true };
}

/**
 * Validates BVN with checksum
 */
export function validateBVN(bvn: string): { valid: boolean; error?: string } {
  if (!bvn || !bvn.trim()) {
    return { valid: false, error: 'BVN is required' };
  }
  
  if (!isValidBVN(bvn)) {
    return { valid: false, error: 'BVN must be exactly 11 digits' };
  }
  
  if (!validateBVNChecksum(bvn)) {
    return { valid: false, error: 'Invalid BVN checksum. Please verify your BVN' };
  }
  
  return { valid: true };
}
