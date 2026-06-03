import type { IPaymentGateway, PaymentRequest, PaymentResult } from "@/core/ports/payment-gateway";

export class CashGateway implements IPaymentGateway {
  readonly provider = "cash" as const;
  readonly displayName = "Efectivo (en el club)";

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    return {
      success: true,
      gatewayRef: `CASH-${request.reference}`,
    };
  }

  async verifyPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }

  async refundPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }
}
