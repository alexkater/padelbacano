import type { PaymentProvider } from "../entities/payment";

/** Resultado de un intento de pago */
export type PaymentResult = {
  success: boolean;
  gatewayRef?: string;
  redirectUrl?: string; // PSE/redirección bancaria
  qrCode?: string;      // Nequi/Daviplata QR
  error?: string;
};

/** Datos necesarios para iniciar un pago */
export type PaymentRequest = {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  reference: string; // ID de transacción interno
};

/**
 * Interfaz abstracta para pasarelas de pago.
 * Cada proveedor (PSE, Nequi, Daviplata, tarjeta) implementa esta interfaz.
 * El módulo de pagos selecciona el adapter según el método elegido.
 */
export interface IPaymentGateway {
  readonly provider: PaymentProvider;
  readonly displayName: string;

  /** Iniciar un pago. Retorna URL de redirección o QR según el método. */
  initiatePayment(request: PaymentRequest, config: Record<string, string>): Promise<PaymentResult>;

  /** Verificar el estado de un pago (para PSE/callback) */
  verifyPayment(gatewayRef: string, config: Record<string, string>): Promise<PaymentResult>;

  /** Reembolsar un pago */
  refundPayment(gatewayRef: string, config: Record<string, string>): Promise<PaymentResult>;
}
