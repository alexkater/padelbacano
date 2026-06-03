import type { IPaymentGateway, PaymentRequest, PaymentResult } from "@/core/ports/payment-gateway";

/**
 * PSE (Pagos Seguros en Línea) — Débito de cuenta bancaria colombiana.
 * 
 * Flujo real:
 * 1. Cliente selecciona PSE → redirigido a su banco
 * 2. Cliente autentica y autoriza el débito
 * 3. Banco notifica al comercio vía callback
 * 4. Fondos se acreditan en 1-2 días hábiles
 * 
 * Integraciones reales: PlacetoPay, PayU, ePayco, Wompi
 * 
 * ENV requeridas: PSE_MERCHANT_ID, PSE_API_KEY, PSE_API_SECRET
 */
export class PSEGateway implements IPaymentGateway {
  readonly provider = "pse" as const;
  readonly displayName = "PSE — Débito Bancario";

  async initiatePayment(request: PaymentRequest, config: Record<string, string>): Promise<PaymentResult> {
    const apiKey = config.PSE_API_KEY || process.env.PSE_API_KEY;
    if (!apiKey) {
      return { success: true, gatewayRef: `PSE-DEMO-${request.reference}`, redirectUrl: `https://demo.pse.com.co/pay?ref=${request.reference}&amount=${request.amount}` };
    }
    // TODO: Real PSE API integration (ePayco / PayU / Wompi)
    return { success: true, gatewayRef: `PSE-${request.reference}`, redirectUrl: `https://checkout.ePayco.co/pse?ref=${request.reference}` };
  }

  async verifyPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }

  async refundPayment(gatewayRef: string): Promise<PaymentResult> {
    return { success: true, gatewayRef };
  }
}
