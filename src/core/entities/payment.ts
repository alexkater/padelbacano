export const PAYMENT_PROVIDERS = ["pse", "nequi", "daviplata", "credit_card", "cash"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const TRANSACTION_STATUSES = ["pending", "completed", "failed", "refunded"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export type PaymentMethod = {
  id: string;
  clubId: string;
  provider: PaymentProvider;
  name: string;
  isEnabled: boolean;
  config: Record<string, string>;
  createdAt: Date;
};

export type Transaction = {
  id: string;
  clubId: string;
  bookingId: string | null;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentProvider;
  status: TransactionStatus;
  gatewayRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};
