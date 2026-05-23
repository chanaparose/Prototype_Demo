import { useQuery } from '@tanstack/react-query';
import { walletApi, transactionsApi } from '@/services/api/userApi';
import {
  mapWalletSummary,
  mapWalletTransactions,
  type WalletTransaction,
} from '@/domain/wallet/mappers/mapWallet';
import { walletKeys } from '@/lib/queryKeys';
import { getErrorMessage } from '@/lib/apiError';
import { fallbackAsync } from '@/utils/asyncAction';

export type FactoryWalletPageData = {
  good: number;
  pending: number;
  transactions: WalletTransaction[];
  refreshedAt: Date;
};

export function useFactoryWalletPage() {
  const query = useQuery({
    queryKey: walletKeys.factoryPage(),
    queryFn: async (): Promise<FactoryWalletPageData> => {
      const wallet = mapWalletSummary(await walletApi.getMe());
      const raw = await walletApi
        .transactions()
        .catch(() => fallbackAsync(transactionsApi.list(), []));
      return {
        good: wallet.goodFund,
        pending: wallet.pendingFund,
        transactions: mapWalletTransactions(raw).slice(0, 30),
        refreshedAt: new Date(),
      };
    },
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error ? getErrorMessage(query.error, 'โหลดกระเป๋าไม่สำเร็จ') : '',
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
