type MonicreditConfig = {
  baseUrl: string;
  privateKey: string;
  merchantEmail: string;
  merchantPassword: string;
};

export class MonicreditHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MonicreditHttpError";
    this.status = status;
  }
}

type MonicreditEnvelope<T> = {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  token?: string;
  access_token?: string;
  accessToken?: string;
};

type MonicreditLoginData = {
  token?: string;
  access_token?: string;
  accessToken?: string;
};

export type MonicreditVirtualAccountData = {
  wallet_id?: string;
  customer_id?: string;
  customer_email?: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  reference?: string;
  virtual_accounts?: Array<{
    id?: string;
    wallet_id?: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
  }>;
};

export type MonicreditWalletTransaction = {
  id?: number;
  wallet_id?: string;
  order_id?: string | null;
  amount?: number | string;
  type?: string;
  status?: string;
  balance?: number | string;
  tracking_reference?: string;
  description?: string;
  date?: string;
};

type MonicreditWalletTransactionsData = {
  data?: MonicreditWalletTransaction[];
};

let cachedMerchantToken: { token: string; expiresAt: number } | null = null;

function getMonicreditConfig(): MonicreditConfig {
  const privateKey = process.env.MONICREDIT_PRIVATE_KEY;
  const merchantEmail = process.env.MONICREDIT_MERCHANT_EMAIL;
  const merchantPassword = process.env.MONICREDIT_MERCHANT_PASSWORD;
  const baseUrl = process.env.MONICREDIT_BASE_URL ?? "https://live.backend.monicredit.com/api/v1";

  if (!privateKey) throw new Error("Missing MONICREDIT_PRIVATE_KEY environment variable.");
  if (!merchantEmail) throw new Error("Missing MONICREDIT_MERCHANT_EMAIL environment variable.");
  if (!merchantPassword) throw new Error("Missing MONICREDIT_MERCHANT_PASSWORD environment variable.");

  return {
    baseUrl,
    privateKey,
    merchantEmail,
    merchantPassword,
  };
}

async function monicreditRequest<T>(path: string, init?: RequestInit): Promise<MonicreditEnvelope<T>> {
  const { baseUrl } = getMonicreditConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = (await response.json()) as MonicreditEnvelope<T>;
  if (!response.ok) {
    throw new MonicreditHttpError(json.message ?? "Monicredit request failed.", response.status);
  }

  return json;
}

function extractToken(payload: MonicreditEnvelope<MonicreditLoginData>) {
  const dataToken = payload.data?.token ?? payload.data?.access_token ?? payload.data?.accessToken;
  const token = payload.token ?? payload.access_token ?? payload.accessToken ?? dataToken;
  if (!token) {
    throw new Error(payload.message ?? "Monicredit login succeeded but returned no access token.");
  }
  return token;
}

export async function getMonicreditBearerToken() {
  const now = Date.now();
  if (cachedMerchantToken && cachedMerchantToken.expiresAt > now + 15_000) {
    return cachedMerchantToken.token;
  }

  const { merchantEmail, merchantPassword } = getMonicreditConfig();
  const payload = await monicreditRequest<MonicreditLoginData>("/core/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: merchantEmail,
      password: merchantPassword,
    }),
  });

  const token = extractToken(payload);
  cachedMerchantToken = {
    token,
    // Monicredit docs do not expose token TTL clearly; use a short cache window.
    expiresAt: now + 9 * 60 * 1000,
  };
  return token;
}

export async function createMonicreditVirtualAccount(params: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const { privateKey } = getMonicreditConfig();
  const payload = await monicreditRequest<MonicreditVirtualAccountData>("/payment/virtual-account/create", {
    method: "POST",
    body: JSON.stringify({
      private_key: privateKey,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      email: params.email,
    }),
  });

  if (!payload.status && payload.success === false) {
    throw new Error(payload.message ?? "Could not create Monicredit virtual account.");
  }

  return payload.data ?? {};
}

export async function getMonicreditWalletTransactions(params: {
  bearerToken: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  type?: "credit" | "debit";
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("from", params.fromDate);
  if (params.toDate) query.set("to", params.toDate);
  if (params.search) query.set("search", params.search);
  query.set("type", params.type ?? "credit");
  query.set("status", params.status ?? "APPROVED");

  const path = `/banking/wallet/transactions?${query.toString()}`;

  const payload = await monicreditRequest<MonicreditWalletTransactionsData>(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.bearerToken}`,
    },
  });

  if (!payload.status && payload.success === false) {
    throw new Error(payload.message ?? "Could not fetch Monicredit wallet transactions.");
  }

  return payload.data?.data ?? [];
}
