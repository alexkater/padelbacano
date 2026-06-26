import type { WhatsAppNotification } from "@/core/ports/notification-port";

type WhatsAppConfig = {
  token: string;
  phoneNumberId: string;
};

function getConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

export async function sendWhatsAppMessage(notification: WhatsAppNotification): Promise<boolean> {
  const provider = process.env.WHATSAPP_PROVIDER ?? (getConfig() ? "api" : "log");

  // Mock provider: simulate success for deterministic E2E tests
  if (provider === "mock") {
    console.info("[whatsapp:mock] Mock WhatsApp message (would send to", notification.to, ")", { template: notification.templateName });
    return true;
  }

  const config = getConfig();
  if (!config) {
    console.warn("[whatsapp] WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured — skipping send");
    return false;
  }

  const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: notification.to,
        type: "template",
        template: {
          name: notification.templateName,
          language: { code: "es_CO" },
          components: [
            {
              type: "body",
              parameters: Object.entries(notification.params).map(([_, value]) => ({
                type: "text",
                text: value,
              })),
            },
          ],
        },
      }),
    });

    const body = await response.json() as { messages?: unknown[]; error?: { message: string } };

    if (!response.ok) {
      console.warn("[whatsapp] API error:", body.error?.message ?? "unknown");
      return false;
    }

    return Array.isArray(body.messages) && body.messages.length > 0;
  } catch (error) {
    console.warn("[whatsapp] Network error:", error instanceof Error ? error.message : error);
    return false;
  }
}
