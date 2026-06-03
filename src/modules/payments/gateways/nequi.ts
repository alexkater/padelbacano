import type { IPaymentGateway, PaymentRequest, PaymentResult } from "@/core/ports/payment-gateway";

/**
 * Nequi — Billetera digital colombiana (Bancolombia).
 * 
 * Flujo real:
 * 1. Se genera un código QR o link de pago
 * 2. Cliente escanea con la app Nequi
 * 3. Cliente confirma el pago en su app
 * 4. Notificación de confirmación vía webhook
 * 
 * Integración real: API Nequi Connect (Bancolombia)
 * Requiere: NEQUI_CLIENT_ID, NEQUI_CLIENT_SECRET, NEQUI_API_KEY
 */
export class NequiGateway implements IPaymentGateway {
  readonly provider = "nequi" as const;
  readonly displayName = "Nequi — Billetera Digital";

  async initiatePayment(request: PaymentRequest, config: Record<string, string>): Promise<PaymentResult> {
    const apiKey = config.NEQUI_API_KEY || process.env.NEQUI_API_KEY;
    if (!apiKey) {
      return { success: true, gatewayRef: `NEQUI-DEMO-${request.reference}`, qrCode: `https://demo.nequi.com.co/qr/${request.reference}` };
    }
    return { success: true, gatewayRef: `NEQUI-${request.reference}`, qrCode: `https://api.nequi.com.co/qr?ref=${request.reference}` };
  }

  async verifyPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }

  async refundPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }
}
