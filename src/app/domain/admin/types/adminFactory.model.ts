export type FactoryApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface AdminFactory {
  id: string;
  factory_id: number;
  factory_name: string;
  owner_name: string;
  email: string;
  phone: string;
  registered_at: string;
  approval_status: FactoryApprovalStatus;
  business_type: string;
  province: string;
  is_verified: boolean;
}
