import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/services/api/httpClient';

export interface TrylyBankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  promptPay: string;
}

export interface PaymentConfig {
  /** true เมื่อ config_payment != "1" — ลูกค้าโอนเข้าบัญชี Tryly, superadmin verify slip */
  isEscrow: boolean;
  trylyBank: TrylyBankInfo;
}

const DEFAULT_CONFIG: PaymentConfig = {
  isEscrow: false,
  trylyBank: { bankName: '', accountNumber: '', accountName: '', promptPay: '' },
};

export const paymentConfigKey = ['configs', 'public'] as const;

/**
 * อ่าน payment flow config จาก GET /configs/public (whitelisted tconfig keys)
 * ระหว่างโหลด/error → default เป็น direct-pay flow (flow เดิม ปลอดภัยกว่า)
 */
export function usePaymentConfig(): PaymentConfig & { isLoading: boolean } {
  const q = useQuery({
    queryKey: paymentConfigKey,
    queryFn: () => httpClient.get<{ configs: Record<string, string> }>('/configs/public'),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  const configs = q.data?.configs;
  if (!configs) return { ...DEFAULT_CONFIG, isLoading: q.isLoading };

  const v = String(configs.config_payment ?? '1').trim();
  return {
    isEscrow: v !== '' && v !== '1',
    trylyBank: {
      bankName: String(configs.tryly_bank_name ?? '').trim(),
      accountNumber: String(configs.tryly_bank_account_no ?? '').trim(),
      accountName: String(configs.tryly_account_holder ?? '').trim(),
      promptPay: String(configs.tryly_promptpay ?? '').trim(),
    },
    isLoading: false,
  };
}
