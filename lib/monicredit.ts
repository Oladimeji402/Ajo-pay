/**
 * MonieCredit API Integration
 * Documentation: https://monicredit.gitbook.io/mc-api
 */

// ============================================================================
// TYPES
// ============================================================================

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

type MonicreditVirtualAccountData = {
  wallet_id: string;
  customer_id: string;
  customer_email: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  credit: number;
  debit: number;
  balance: number;
  virtual_accounts?: Array<{
    id: string;
    wallet_id: string;
    name: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    account_name: string;
    account_number: string;
    bank_name: string;
    account_type: string;
    service_provider: string;
    status: string;
    expiry_date: string | null;
    created_at: string;
    updated_at: string;
    account_reference: string | null;
  }>;
  reference: string;
};

type MonicreditTransactionData = {
  amount: number;
  orderid: string;
  transid: string;
  date_paid: string;
  status: "APPROVED" | "PENDING" | "FAILED" | "DECLINED";
  channel: string;
  currency?: string;
  balance?: number;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class MonicreditHttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: unknown
  ) {
    super(message);
    this.name = "MonicreditHttpError";
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

function getMonicreditConfig() {
  const privateKey = process.env.MONICREDIT_PRIVATE_KEY;
  const baseUrl = process.env.MONICREDIT_BASE_URL;
  const email = process.env.MONICREDIT_MERCHANT_EMAIL;
  const password = process.env.MONICREDIT_MERCHANT_PASSWORD;
  const revenueHeadCode = process.env.MONICREDIT_REVENUE_HEAD_CODE;

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
    revenueHeadCode: revenueHeadCode || "",
  };
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

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
    throw new MonicreditHttpError(
      response.status,
      `MonieCredit authentication failed: ${errorText}`
    );
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

// ============================================================================
// HTTP CLIENT
// ============================================================================

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
    throw new MonicreditHttpError(
      response.status,
      json.message || "MonieCredit request failed.",
      json
    );
  }

  if (!json.data) {
    throw new Error("MonieCredit response missing data.");
  }

  return json.data;
}

/**
 * Make request using private key (for virtual account creation)
 */
async function monicreditPrivateKeyRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { baseUrl, privateKey } = getMonicreditConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${privateKey}`,
    },
    body: JSON.stringify({
      ...body,
      private_key: privateKey,
    }),
    cache: "no-store",
  });

  const json = (await response.json()) as MonicreditResponse<T>;

  if (!response.ok || !json.status) {
    throw new MonicreditHttpError(
      response.status,
      json.message || "MonieCredit request failed.",
      json
    );
  }

  if (!json.data) {
    throw new Error("MonieCredit response missing data.");
  }

  return json.data;
}

// ============================================================================
// BANKING APIs
// ============================================================================

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

// ============================================================================
// VIRTUAL ACCOUNT APIs
// ============================================================================

/**
 * Create a virtual account for a customer
 * Endpoint: POST /payment/virtual-account/create
 * Documentation: https://monicredit.gitbook.io/mc-api/customer-wallet/create-customer-virtual-account
 */
export async function createMonicreditVirtualAccount(params: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nin?: string;
  bvn?: string;
}) {
  const body: Record<string, unknown> = {
    first_name: params.firstName,
    last_name: params.lastName,
    phone: params.phone,
    email: params.email,
  };

  // Add NIN and BVN if provided
  if (params.nin) body.nin = params.nin;
  if (params.bvn) body.bvn = params.bvn;

  return monicreditPrivateKeyRequest<MonicreditVirtualAccountData>(
    "/payment/virtual-account/create",
    body
  );
}

// ============================================================================
// PAYMENT COLLECTION APIs
// ============================================================================

/**
 * Get MonieCredit public key for inline payment
 */
export function getMonicreditPublicKey(): string {
  const { privateKey } = getMonicreditConfig();
  // Convert private key to public key (PRI_LIVE_xxx -> PUB_LIVE_xxx)
  return privateKey.replace(/^PRI_/, "PUB_");
}

/**
 * Get MonieCredit Revenue Head code
 */
export function getMonicreditRevenueHeadCode(): string {
  const { revenueHeadCode } = getMonicreditConfig();
  if (!revenueHeadCode) {
    throw new Error("MONICREDIT_REVENUE_HEAD_CODE environment variable is required for payment collection");
  }
  return revenueHeadCode;
}

/**
 * Get MonieCredit Bearer token (alias for getMonicreditToken)
 * Used for wallet transaction queries
 */
export async function getMonicreditBearerToken(): Promise<string> {
  return getMonicreditToken();
}

/**
 * Get wallet transactions for a specific wallet
 * Endpoint: GET /banking/wallet/transactions
 */
export async function getMonicreditWalletTransactions(params: {
  walletId: string;
  bearerToken: string;
  fromDate?: string;
  toDate?: string;
  type?: string;
  status?: string;
}): Promise<Array<{
  id: number;
  wallet_id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  reference: string;
  tracking_reference?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}>> {
  const { baseUrl } = getMonicreditConfig();
  
  let url = `${baseUrl}/banking/wallet/transactions?wallet_id=${encodeURIComponent(params.walletId)}`;
  
  if (params.fromDate) {
    url += `&from_date=${encodeURIComponent(params.fromDate)}`;
  }
  
  if (params.toDate) {
    url += `&to_date=${encodeURIComponent(params.toDate)}`;
  }
  
  if (params.type) {
    url += `&type=${encodeURIComponent(params.type)}`;
  }
  
  if (params.status) {
    url += `&status=${encodeURIComponent(params.status)}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.bearerToken}`,
    },
    cache: "no-store",
  });

  const json = (await response.json()) as MonicreditResponse<Array<{
    id: number;
    wallet_id: string;
    amount: number;
    type: string;
    status: string;
    description: string;
    reference: string;
    tracking_reference?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
  }>>;

  if (!response.ok || !json.status) {
    throw new MonicreditHttpError(
      response.status,
      json.message || "Failed to fetch wallet transactions.",
      json
    );
  }

  return json.data || [];
}

/**
 * Verify a payment transaction
 * Endpoint: GET /payment/transactions/verify-transaction
 * Documentation: https://monicredit.gitbook.io/mc-api/collection/verify-payment
 */
export async function verifyMonicreditTransaction(params: {
  transactionId: string;
}) {
  const { privateKey } = getMonicreditConfig();
  
  const response = await monicreditRequest<MonicreditTransactionData>(
    `/payment/transactions/verify-transaction?transaction_id=${encodeURIComponent(params.transactionId)}&private_key=${encodeURIComponent(privateKey)}`
  );

  return {
    amount: response.amount,
    orderid: response.orderid,
    transid: response.transid,
    date_paid: response.date_paid,
    status: response.status,
    channel: response.channel,
    currency: response.currency || "NGN",
    balance: response.balance,
  };
}

/**
 * Map MonieCredit transaction status to our internal status
 */
export function mapMonicreditTransactionStatus(status: string | null | undefined) {
  const normalized = String(status ?? "").trim().toUpperCase();

  switch (normalized) {
    case "APPROVED":
      return {
        providerStatus: normalized,
        resolvedStatus: "success" as const,
        terminal: true as const,
      };
    case "PENDING":
      return {
        providerStatus: normalized,
        resolvedStatus: "pending" as const,
        terminal: false as const,
      };
    case "FAILED":
    case "DECLINED":
      return {
        providerStatus: normalized,
        resolvedStatus: "failed" as const,
        terminal: true as const,
      };
    default:
      return {
        providerStatus: normalized || "pending",
        resolvedStatus: "pending" as const,
        terminal: false as const,
      };
  }
}
