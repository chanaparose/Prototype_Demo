export type CustomerShippingInfo = {
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
};

export type OrderRfqSummary = {
  quantity: number;
  unit_name: string;
};
