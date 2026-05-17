import { Badge } from '@/components/ui/badge';

type Props = {
  status?: string | null;
};

const STATUS_META: Record<string, { label: string; variant: 'pending' | 'success' | 'error' | 'default' }> =
  {
    PD: { label: 'รอตรวจสอบ', variant: 'pending' },
    AP: { label: 'อนุมัติแล้ว', variant: 'success' },
    RJ: { label: 'ถูกปฏิเสธ', variant: 'error' },
  };

export function CertStatusBadge({ status }: Props) {
  const key = String(status ?? '').toUpperCase();
  const meta = STATUS_META[key] ?? { label: key || '—', variant: 'default' as const };

  return (
    <Badge variant={meta.variant} size='sm'>
      {meta.label}
    </Badge>
  );
}
