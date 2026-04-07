const NIGERIA_COUNTRY_CODE = '234';
const NIGERIA_DIAL_CODE = '+234';
const NIGERIA_LOCAL_NUMBER_LENGTH = 10;
const NIGERIA_MOBILE_LOCAL_REGEX = /^[789]\d{9}$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeNigeriaPhoneLocalInput(value: string): string {
  return digitsOnly(value).slice(0, NIGERIA_LOCAL_NUMBER_LENGTH);
}

export function parseNigeriaPhoneToLocal(value: string | null | undefined): string {
  if (!value) return '';

  const digits = digitsOnly(value);

  if (digits.length === 13 && digits.startsWith(NIGERIA_COUNTRY_CODE)) {
    return digits.slice(3);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  if (digits.length === NIGERIA_LOCAL_NUMBER_LENGTH) {
    return digits;
  }

  return '';
}

export function isValidNigeriaPhoneLocal(localPhone: string): boolean {
  return NIGERIA_MOBILE_LOCAL_REGEX.test(localPhone);
}

export function formatNigeriaPhoneE164(localPhone: string): string {
  return `${NIGERIA_DIAL_CODE}${localPhone}`;
}
