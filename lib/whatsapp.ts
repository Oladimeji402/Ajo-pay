type WhatsappResult = {
  sent: boolean;
  skipped: boolean;
  reason?: string;
};

type ReceiptData = {
  memberName: string;
  amount: string;
  groupName: string;
  cycle: string;
  date: string;
};

type GroupReceiptResult = {
  queued: boolean;
  skipped: boolean;
  acceptedTo: string[];
  reason?: string;
};

function getWhatsappConfig() {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME ?? "subtechajosolution_contribution_receipt";
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE_CODE ?? "en";

  return {
    token,
    phoneNumberId,
    templateName,
    languageCode,
    configured: Boolean(token && phoneNumberId),
  };
}

export function isWhatsappConfigured() {
  return getWhatsappConfig().configured;
}

export async function sendWhatsappTextMessage(to: string, message: string): Promise<WhatsappResult> {
  const { configured, token, phoneNumberId } = getWhatsappConfig();

  if (!configured || !token || !phoneNumberId) {
    return {
      sent: false,
      skipped: true,
      reason: "Missing WhatsApp Cloud API configuration.",
    };
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp API error: ${body}`);
  }

  return {
    sent: true,
    skipped: false,
  };
}

async function sendWhatsappTemplateMessage(to: string, data: ReceiptData): Promise<void> {
  const { configured, token, phoneNumberId, templateName, languageCode } = getWhatsappConfig();

  if (!configured || !token || !phoneNumberId) {
    throw new Error("Missing WhatsApp Cloud API configuration.");
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.memberName },
              { type: "text", text: data.amount },
              { type: "text", text: data.groupName },
              { type: "text", text: data.cycle },
              { type: "text", text: data.date },
            ],
          },
        ],
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp template API error: ${body}`);
  }
}

export async function sendGroupReceipt(phoneNumbers: string[], receiptData: ReceiptData): Promise<GroupReceiptResult> {
  const { configured } = getWhatsappConfig();
  if (!configured) {
    return {
      queued: false,
      skipped: true,
      acceptedTo: [],
      reason: "Missing WhatsApp Cloud API configuration.",
    };
  }

  const uniqueRecipients = Array.from(
    new Set(
      phoneNumbers
        .map((phone) => phone.trim())
        .filter((phone) => phone.length > 0),
    ),
  );

  if (uniqueRecipients.length === 0) {
    return {
      queued: false,
      skipped: true,
      acceptedTo: [],
      reason: "No recipient phone numbers provided.",
    };
  }

  const results = await Promise.allSettled(
    uniqueRecipients.map((recipient) => sendWhatsappTemplateMessage(recipient, receiptData)),
  );

  const acceptedTo = uniqueRecipients.filter((_, index) => results[index].status === "fulfilled");

  return {
    queued: acceptedTo.length > 0,
    skipped: false,
    acceptedTo,
  };
}
