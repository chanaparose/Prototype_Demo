import { useQuery } from '@tanstack/react-query';
import { walletApi, type WalletResponse } from '@/services/api/userApi';

export const myWalletKey = ['wallets', 'me'] as const;

/**
 * ดึงยอดกระเป๋าเงินของผู้ใช้ปัจจุบัน (good_fund / pending_fund)
 * - good_fund   = เงินที่ใช้ได้/ถอนได้
 * - pending_fund = เงินที่รอยืนยัน (escrow) รอเงื่อนไขปิดออเดอร์
 */
export function useMyWallet(enabled = true) {
  const q = useQuery<WalletResponse>({
    queryKey: myWalletKey,
    queryFn: () => walletApi.getMe(),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    goodFund: Number(q.data?.good_fund ?? 0),
    pendingFund: Number(q.data?.pending_fund ?? 0),
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}
