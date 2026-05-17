/**
 * Model Types — Domain models used throughout the application
 * These are transformed from API response types by mappers
 */

export interface IUser {
  id: string | number;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  role: 'CT' | 'FT' | 'AD';
  isActive: boolean;
  createdAt: string;
}

export interface IAuthToken {
  token: string;
  expiresIn?: number;
  type?: string;
}

export interface IAuthResponse {
  user: IUser;
  token: IAuthToken;
}

export interface IPaginatedList<TItem> {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface IFactory {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  image?: string;
  tags?: string[];
}

export interface IRFQ {
  id: string | number;
  title: string;
  description?: string;
  quantity: number;
  status: 'open' | 'closed' | 'cancelled';
  createdAt: string;
  deadline?: string;
}

export interface IQuotation {
  id: string | number;
  rfqId: string | number;
  factory: IFactory;
  price: number;
  leadTime: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface IOrder {
  id: string | number;
  rfq?: IRFQ;
  quotation?: IQuotation;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface ILoadingState {
  isLoading: boolean;
  error?: string;
}

export interface IPageState<TItem> extends ILoadingState {
  data: IPaginatedList<TItem>;
}
