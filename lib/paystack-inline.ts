type PaystackHandler = {
  openIframe: () => void;
};

type PaystackOptions = {
  key: string;
  email: string;
  amount: number;
  ref: string;
  access_code?: string;
  callback: (response: { reference: string }) => void;
  onClose?: () => void;
};

type PaystackPopStatic = {
  setup: (options: PaystackOptions) => PaystackHandler;
};

declare global {
  interface Window {
    PaystackPop?: PaystackPopStatic;
  }
}

const PAYSTACK_SCRIPT_URL = "https://js.paystack.co/v1/inline.js";

export async function ensurePaystackInlineScript() {
  if (typeof window === "undefined") return;
  if (window.PaystackPop) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src=\"${PAYSTACK_SCRIPT_URL}\"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Paystack script.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PAYSTACK_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script."));
    document.body.appendChild(script);
  });
}

export async function openPaystackInline(options: PaystackOptions) {
  await ensurePaystackInlineScript();

  if (!window.PaystackPop) {
    throw new Error("Paystack popup is unavailable.");
  }

  const handler = window.PaystackPop.setup(options);
  handler.openIframe();
}
