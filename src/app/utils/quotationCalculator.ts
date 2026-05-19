import type { IQuotationBreakdown } from '@/services/api/types/rfq.types';

export interface CommissionConfig {
  vat_rate: number;
  commission_rate: number;
}

export interface QuotationInputs {
  pricePerPiece: number;
  quantity: number;
  shippingCost?: number;
  packagingCost?: number;
  toolingMoldCost?: number;
  discountAmount?: number;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateQuotationBreakdown(
  config: CommissionConfig,
  inputs: QuotationInputs,
): IQuotationBreakdown | null {
  const { pricePerPiece, quantity } = inputs;
  if (pricePerPiece <= 0 || quantity <= 0) return null;

  const shipping = inputs.shippingCost ?? 0;
  const packaging = inputs.packagingCost ?? 0;
  const tooling = inputs.toolingMoldCost ?? 0;
  const discount = inputs.discountAmount ?? 0;

  const lineTotal = roundMoney(pricePerPiece * quantity);
  const subtotal = roundMoney(lineTotal - discount);
  const preVatBase = roundMoney(subtotal + shipping + packaging + tooling);
  const vatAmount = roundMoney(preVatBase * config.vat_rate / 100);
  const grandTotal = roundMoney(preVatBase + vatAmount);
  const commissionAmount = roundMoney(grandTotal * config.commission_rate / 100);
  const factoryNet = roundMoney(grandTotal - commissionAmount);

  return {
    subtotal,
    shipping_cost: roundMoney(shipping),
    packaging_cost: roundMoney(packaging),
    tooling_mold_cost: roundMoney(tooling),
    vat_rate: config.vat_rate,
    vat_amount: vatAmount,
    grand_total: grandTotal,
    factory_net_receivable: factoryNet,
    platform_commission_rate: config.commission_rate,
    platform_commission_amount: commissionAmount,
  };
}
