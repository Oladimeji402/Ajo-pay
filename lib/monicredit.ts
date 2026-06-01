/**
 * MonieCredit API Integration
 * Documentation: https://monicredit.gitbook.io/mc-api
 */

type MonicreditResponse<T> = {
  status: boolean;
  message?: string;
  data?: T;
};

type MonicreditAuthResponse = {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  is_aggregator: string;
  platform: string;
  userData: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    activeMerchant: string;
    activeAccount: string;
    [key: string]: unknown;
  };
  twofa_enable: string;
  setPin: boolean;
};

type MonicreditBankData = {
  id: number;
  name: string;
  code: string;
  slug: string | null;
  bank_shortname: string;
  logo: string;
};

type MonicreditNameEnquiryData = {
  account_name: string;
  account_number: string;
  bank_code: string;
  status: number;
};

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

function getMonicreditConfig() {
  const privateKey = process.env.MONICREDIT_PRIVATE_KEY;
  const baseUrl = process.env.MONICREDIT_BASE_URL;
  const email = process.env.MONICREDIT_MERCHANT_EMAIL;
  const password = process.env.MONICREDIT_MERCHANT_PASSWORD;

  if (!privateKey || !baseUrl || !email || !password) {
    throw new Error(
      "Missing MonieCredit environment variables. Required: MONICREDIT_PRIVATE_KEY, MONICREDIT_BASE_URL, MONICREDIT_MERCHANT_EMAIL, MONICREDIT_MERCHANT_PASSWORD"
    );
  }

  return {
    privateKey,
    baseUrl,
    email,
    password,
  };
}

/**
 * Authenticate with MonieCredit and get Bearer token
 */
async function getMonicreditToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 300000) {
    return cachedToken;
  }

  const { baseUrl, email, password } = getMonicreditConfig();

  const response = await fetch(`${baseUrl}/core/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MonieCredit authentication failed (${response.status}): ${errorText}`);
  }

  const json = (await response.json()) as MonicreditAuthResponse;

  if (!json.success || !json.accessToken) {
    throw new Error("MonieCredit authentication failed - invalid response.");
  }

  cachedToken = json.accessToken;
  // Set expiration time (default to 1 hour if not provided)
  tokenExpiresAt = Date.now() + 3600 * 1000; // 1 hour

  return cachedToken;
}

/**
 * Make authenticated request to MonieCredit API
 */
async function monicreditRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl } = getMonicreditConfig();
  const token = await getMonicreditToken();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = (await response.json()) as MonicreditResponse<T>;

  if (!response.ok || !json.status) {
    throw new Error(json.message || "MonieCredit request failed.");
  }

  if (!json.data) {
    throw new Error("MonieCredit response missing data.");
  }

  return json.data;
}

/**
 * Get list of supported Nigerian banks
 * Endpoint: GET /banking/bank-list
 */
export async function listMonicreditBanks() {
  const banks = await monicreditRequest<MonicreditBankData[]>("/banking/bank-list");
  
  // Filter out banks with null/undefined names and sort
  return banks
    .filter((bank) => bank && bank.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Verify and validate account holder details
 * Endpoint: GET /banking/wallet/name-enquiry
 */
export async function resolveMonicreditAccount(params: { accountNumber: string; bankCode: string }) {
  const accountNumber = encodeURIComponent(params.accountNumber);
  const bankCode = encodeURIComponent(params.bankCode);

  const data = await monicreditRequest<MonicreditNameEnquiryData>(
    `/banking/wallet/name-enquiry?bank_code=${bankCode}&account_no=${accountNumber}`
  );

  // Validate the response
  if (data.status !== 1) {
    throw new Error("Account verification failed. Please check the account number and bank code.");
  }

  return {
    account_name: data.account_name,
    account_number: data.account_number,
    bank_code: data.bank_code,
  };
}
