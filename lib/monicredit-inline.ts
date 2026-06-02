/**
 * monicredit Inline Payment Integration
 * Documentation: https://monicredit.gitbook.io/mc-api/collection/accept-payment-inline
 */

type MonicreditCustomer = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type MonicreditSplitDetail = {
  sub_account_code: string;
  fee_percentage: number;
  fee_flat: number;
};

type MonicreditItem = {
  item: string;
  unit_cost: string;
  revenue_head_code: string;
  split_details?: MonicreditSplitDetail[];
};

type MonicreditPaymentOptions = {
  public_key: string;
  order_id: string;
  customer: MonicreditCustomer;
  fee_bearer: "client" | "merchant";
  items: MonicreditItem[];
  callback: (response: MonicreditPaymentResponse) => void;
  onClose: () => void;
};

type MonicreditPaymentResponse = {
  reference_code: string;
  transaction_id: string;
  status: string;
  amount: number;
  [key: string]: unknown;
};

type MonicreditHandler = {
  openIframe: () => void;
};

type PayDirectStatic = {
  invoice: (options: MonicreditPaymentOptions) => MonicreditHandler;
};

declare global {
  interface Window {
    PayDirect?: PayDirectStatic;
  }
}

// Use live script for production
const MONICREDIT_SCRIPT_URL = "https://live.monicredit.com/js/live.js";

/**
 * Ensure monicredit inline script is loaded
 */
export async function ensureMonicreditInlineScript() {
  if (typeof window === "undefined") return;
  if (window.PayDirect) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${MONICREDIT_SCRIPT_URL}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load monicredit script.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = MONICREDIT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load monicredit script."));
    document.body.appendChild(script);
  });
}

/**
 * Open monicredit inline payment modal
 */
export async function openMonicreditInline(options: MonicreditPaymentOptions) {
  await ensureMonicreditInlineScript();

  if (!window.PayDirect) {
    throw new Error("monicredit PayDirect is unavailable.");
  }

  const handler = window.PayDirect.invoice(options);
  handler.openIframe();
}
