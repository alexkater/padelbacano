import type { PaymentMethod, Transaction, PaymentProvider, TransactionStatus } from "../entities/payment";

export interface IPaymentRepository {
  listMethods(clubId: string): Promise<PaymentMethod[]>;
  enableMethod(clubId: string, provider: PaymentProvider, config: Record<string, string>): Promise<PaymentMethod>;
  createTransaction(input: { clubId: string; bookingId?: string; userId: string; amount: number; currency: string; method: PaymentProvider }): Promise<Transaction>;
  updateStatus(id: string, status: TransactionStatus, gatewayRef?: string): Promise<Transaction>;
  getByBooking(bookingId: string): Promise<Transaction | null>;
  listByClub(clubId: string): Promise<Transaction[]>;
  getTotalRevenue(clubId: string, from: Date, to: Date): Promise<number>;
}
