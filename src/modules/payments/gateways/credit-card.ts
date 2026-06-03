import type { IPaymentGateway, PaymentRequest, PaymentResult } from "@/core/ports/payment-gateway";

/**
 * Tarjeta de crédito/débito — Visa, Mastercard, Amex.
 * 
 * Integración real: ePayco, PayU, Wompi, Stripe
 * Requiere: CARD_MERCHANT_ID, CARD_API_KEY
 */
export class CreditCardGateway implements IPaymentGateway {
  readonly provider = "credit_card" as const;
  readonly displayName = "Tarjeta de Crédito/Débito";

  async initiatePayment(request: PaymentRequest, config: Record<string, string>): Promise<PaymentResult> {
    const apiKey = config.CARD_API_KEY || process.env.CARD_API_KEY;
    if (!apiKey) {
      return { success: true, gatewayRef: `CARD-DEMO-${request.reference}` };
    }
    return { success: true, gatewayRef: `CARD-${request.reference}` };
  }

  async verifyPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }

  async refundPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }
}
