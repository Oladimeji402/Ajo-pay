import crypto from "crypto";

type PaystackInitializeParams = {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
};

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackVerifyData = {
  status: string;
  reference: string;
  amount: number;
  paid_at?: string;
  channel?: string;
  gateway_response?: string;
  currency?: string;
  customer?: {
    email?: string;
  };
  metadata?: Record<string, unknown>;
};

type PaystackBankData = {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
};

type PaystackResolveAccountData = {
  account_number: string;
  account_name: string;
  bank_id: number;
};

function getPaystackConfig() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing PAYSTACK_SECRET_KEY environment variable.");
  }

  return {
    secretKey,
    baseUrl: "https://api.paystack.co",
  };
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { secretKey, baseUrl } = getPaystackConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = (await response.json()) as PaystackResponse<T>;

  if (!response.ok || !json.status) {
    throw new Error(json.message || "Paystack request failed.");
  }

  return json.data;
}

export async function initializePaystackTransaction(params: PaystackInitializeParams) {
  return paystackRequest<PaystackInitializeData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      metadata: params.metadata ?? {},
      callback_url: params.callbackUrl,
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  const encodedReference = encodeURIComponent(reference);
  return paystackRequest<PaystackVerifyData>(`/transaction/verify/${encodedReference}`);
}

export async function listPaystackBanks() {
  const banks = await paystackRequest<PaystackBankData[]>("/bank?country=nigeria&currency=NGN");
  return banks
    .filter((bank) => bank.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolvePaystackAccount(params: { accountNumber: string; bankCode: string }) {
  const accountNumber = encodeURIComponent(params.accountNumber);
  const bankCode = encodeURIComponent(params.bankCode);
  return paystackRequest<PaystackResolveAccountData>(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
}

export function isValidPaystackSignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) return false;

  const { secretKey } = getPaystackConfig();
  const digest = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");

  const digestBuffer = Buffer.from(digest, "utf8");
  const signatureBuffer = Buffer.from(signatureHeader, "utf8");

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}
