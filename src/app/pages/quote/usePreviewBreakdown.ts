import { useEffect, useState } from 'react';
import { quotationApi } from '@/services/api/rfqApi';
import type { IQuotationBreakdown, IQuotationCreateRequest } from '@/services/api/types/rfq.types';
import { runAsyncAction } from '@/utils/asyncAction';

export function usePreviewBreakdown(state: Partial<IQuotationCreateRequest>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [breakdown, setBreakdown] = useState<IQuotationBreakdown | null>(null);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      void runAsyncAction(async () => {
        const next = await quotationApi.preview(state);
        if (mounted) setBreakdown(next);
      }, {
        onStart: () => {
          if (!mounted) return;
          setLoading(true);
          setError('');
        },
        onError: (message) => {
          if (mounted) setError(message);
        },
        onSettled: () => {
          if (mounted) setLoading(false);
        },
        fallbackMessage: 'preview failed',
      });
    }, 400);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [JSON.stringify(state)]);

  return { loading, error, breakdown };
}
