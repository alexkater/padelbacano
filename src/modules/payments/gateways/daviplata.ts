import type { IPaymentGateway, PaymentRequest, PaymentResult } from "@/core/ports/payment-gateway";

/**
 * Daviplata — Billetera digital colombiana (Banco Davivienda).
 * Similar a Nequi: QR + confirmación en app.
 */
export class DaviplataGateway implements IPaymentGateway {
  readonly provider = "daviplata" as const;
  readonly displayName = "Daviplata — Billetera Digital";

  async initiatePayment(request: PaymentRequest, config: Record<string, string>): Promise<PaymentResult> {
    return { success: true, gatewayRef: `DAVIPLATA-${request.reference}`, qrCode: `https://demo.daviplata.com/qr/${request.reference}` };
  }

  async verifyPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }

  async refundPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }
}
