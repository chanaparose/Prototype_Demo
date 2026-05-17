export interface IUser {
  id: number | string;
  role: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar: string;
  walletBalance: number;
  pendingBalance: number;
  memberSince: string;
  factory_id?: number | string;
  factoryId?: number | string;
  verify_status?: string;
  [key: string]: unknown;
}
