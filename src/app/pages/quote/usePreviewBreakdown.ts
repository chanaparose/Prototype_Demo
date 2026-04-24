import React from 'react';
import { quotationApi, type QuotationBreakdown, type QuotationCreateInput } from '../../services/api';

export function usePreviewBreakdown(state: Partial<QuotationCreateInput>) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [breakdown, setBreakdown] = React.useState<QuotationBreakdown | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const next = await quotationApi.preview(state);
        if (mounted) setBreakdown(next);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'preview failed');
      } finally {
        if (mounted) setLoading(false);
      }
    }, 400);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [JSON.stringify(state)]);

  return { loading, error, breakdown };
}
