export type MapRfqStatusOptions = {
  quoteCount?: number;
  hasAcceptedQuote?: boolean;
};

export function mapRfqStatusFromApi(code: string, options: MapRfqStatusOptions = {}): string {
  const u = String(code ?? '')
    .trim()
    .toUpperCase();
  const hasQuotes = (options.quoteCount ?? 0) > 0;
  const hasAccepted = options.hasAcceptedQuote ?? false;

  if (u === 'OP' || u === 'OPEN' || u === '') {
    return hasQuotes ? 'offers_received' : 'pending';
  }
  if (u === 'CL') {
    return hasAccepted ? 'completed' : 'closed';
  }
  if (u === 'CC') return 'expired';
  if (u === 'EX' || u === 'EXPIRED') return 'expired';

  const lower = String(code).toLowerCase();
  const known = [
    'pending',
    'offers_received',
    'reviewing',
    'completed',
    'cancelled',
    'expired',
    'closed',
  ] as const;
  if ((known as readonly string[]).includes(lower)) return lower;
  return lower || 'pending';
}
