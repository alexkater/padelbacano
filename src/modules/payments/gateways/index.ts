import type { IPaymentGateway } from "@/core/ports/payment-gateway";
import type { PaymentProvider } from "@/core/entities/payment";
import { PSEGateway } from "./pse";
import { NequiGateway } from "./nequi";
import { DaviplataGateway } from "./daviplata";
import { CreditCardGateway } from "./credit-card";
import { CashGateway } from "./cash";

const gateways: Record<PaymentProvider, IPaymentGateway> = {
  pse: new PSEGateway(),
  nequi: new NequiGateway(),
  daviplata: new DaviplataGateway(),
  credit_card: new CreditCardGateway(),
  cash: new CashGateway(),
};

export function getPaymentGateway(provider: PaymentProvider): IPaymentGateway {
  return gateways[provider];
}

export function listGateways(): IPaymentGateway[] {
  return Object.values(gateways);
}

export { PSEGateway, NequiGateway, DaviplataGateway, CreditCardGateway, CashGateway };
