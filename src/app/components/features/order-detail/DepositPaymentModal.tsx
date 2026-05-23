import React, { useEffect, useState, useRef, type ReactNode } from 'react';
import { Wallet, QrCode, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { runAsyncAction } from '@/utils/asyncAction';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/services/api/ordersApi';
import { walletApi } from '@/services/api/userApi';
import { AppDialog } from '@/components/ui/app-dialog';
import { ModalFooter } from '@/shared/ui/modals/ModalFooter';
import {
  ACCENT_ORANGE_DEEP,
  BORDER_WARM,
  CTA_GRADIENT,
  DEEP_PURPLE,
  PEACH_MIST,
  PLUM,
} from '@/components/features/rfq-and-orders/constants';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { walletKeys } from '@/lib/queryKeys';
import { redirectTo } from '@/utils/navigation/redirect';
import { mapWalletSummary } from '@/domain/wallet/mappers/mapWallet';
import { APP_ROUTES } from '@/constants/routes';

export type DepositPaymentMethod = 'WALLET' | 'PROMPTPAY' | 'BANK';

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;

  onSuccess?: () => void | Promise<void>;
};

function genIdempotencyKey(orderId: string) {
  const r =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as Crypto & { randomUUID: () => string }).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `pay-dp-${orderId}-${r}`;
}

function useMyWallet(open: boolean) {
  return useQuery({
    queryKey: walletKeys.me(),
    queryFn: async () => {
      const wallet = mapWalletSummary(await walletApi.getMe());
      return {
        good_fund: wallet.goodFund,
        pending_fund: wallet.pendingFund,
      };
    },
    enabled: open,
    staleTime: 10_000,
  });
}

export function DepositPaymentModal({ open, onClose, orderId, amount, onSuccess }: Props) {
  const wallet = useMyWallet(open);
  const good = wallet.data?.good_fund ?? 0;
  const insufficient = good < amount;
  const [method, setMethod] = useState<DepositPaymentMethod>('WALLET');
  const [submitting, setSubmitting] = useState(false);
  const idemRef = useRef<string>('');

  useEffect(() => {
    if (open) {
      idemRef.current = genIdempotencyKey(orderId);
      setMethod('WALLET');
    }
  }, [open, orderId]);

  const canSubmitWallet = method === 'WALLET' && !insufficient && !wallet.isPending;
  const canSubmit = method === 'WALLET' ? canSubmitWallet : true;

  const handleSubmit = async () => {
    if (submitting || !canSubmit) return;
    await runAsyncAction(
      async () => {
        await ordersApi.createPayment(orderId, {
          type: 'DP',
          amount,
          payment_method: method,
          idempotency_key: idemRef.current || genIdempotencyKey(orderId),
        });
        if (method === 'WALLET') {
          toast.success('ชำระเงินด้วย Wallet สำเร็จ');
          await onSuccess?.();
          onClose();
        } else {
          // Legacy off-ledger flow: BE returns intent (PromptPay QR / bank instructions).

          toast.success('สร้างรายการชำระแล้ว กรุณาทำตามขั้นตอนการชำระเงิน');
          onClose();
        }
      },
      {
        onStart: () => setSubmitting(true),
        onSettled: () => setSubmitting(false),
        onError: (_message, err) => {
          const e = err as {
            status?: number;
            body?: { error_code?: string; message?: string; shortfall?: number; topup_url?: string };
          };
          const code = e?.body?.error_code;
          if (code === 'INSUFFICIENT_WALLET_BALANCE') {
            toast.error(
              `ยอด Wallet ไม่พอ ขาดอีก ${formatCurrency(Number(e.body?.shortfall ?? 0))}`,
            );
          } else if (code === 'DEPOSIT_EXPIRED') {
            toast.error('หมดกำหนดชำระเงินแล้ว');
          } else if (code === 'DEPOSIT_ALREADY_PAID') {
            toast.error('คำสั่งซื้อนี้ชำระเงินแล้ว');
            void onSuccess?.();
            onClose();
          } else if (code === 'AMOUNT_MISMATCH') {
            toast.error('ยอดไม่ตรงกับที่ระบบกำหนด กรุณารีเฟรชหน้า');
          } else {
            const msg = e?.body?.message ?? (err instanceof Error ? err.message : 'ชำระเงินไม่สำเร็จ');
            toast.error(msg);
          }
        },
      },
    );
  };

  const shortfall = Math.max(0, amount - good);

  return (
    <AppDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title='ชำระเงินเต็มจำนวน'
      variant='sheet'
      footer={
        <ModalFooter
          layout='stack'
          leading={
            method === 'WALLET' && insufficient && !wallet.isPending ? (
              <Button
                variant='unstyled'
                type='button'
                onClick={() => {
                  onClose();
                  redirectTo(APP_ROUTES.walletTopup);
                }}
                className='w-full rounded-xl py-3 text-sm font-semibold text-white'
                style={{ background: PLUM }}
              >
                เติมเงินเข้า Wallet
              </Button>
            ) : null
          }
          primary={{
            label:
              method === 'WALLET'
                ? `ยืนยันชำระด้วย Wallet · ${formatCurrency(amount)}`
                : 'ดำเนินการต่อ',
            loadingLabel: 'กำลังดำเนินการ…',
            loading: submitting,
            disabled: !canSubmit || submitting,
            onClick: handleSubmit,
            style: { background: CTA_GRADIENT },
            fullWidth: true,
          }}
        />
      }
    >
      <div
        className='rounded-2xl border p-4 mb-4'
        style={{ borderColor: BORDER_WARM, background: PEACH_MIST }}
      >
        <p className='text-[11px]' style={{ color: ACCENT_ORANGE_DEEP }}>
          ยอดที่ต้องชำระ
        </p>
        <p className='mt-0.5 text-2xl font-semibold tabular-nums' style={{ color: DEEP_PURPLE }}>
          {formatCurrency(amount)}
        </p>
      </div>

      <div className='pb-2'>
        <p className='text-xs font-semibold text-gray-600 mb-2'>เลือกวิธีชำระ</p>

        <MethodRow
          selected={method === 'WALLET'}
          onSelect={() => setMethod('WALLET')}
          icon={<Wallet size={18} style={{ color: PLUM }} />}
          title='Wallet ของฉัน'
          subtitle={
            wallet.isPending ? 'กำลังโหลดยอดคงเหลือ…' : `คงเหลือ ${formatCurrency(good)}`
          }
          warning={
            method === 'WALLET' && !wallet.isPending && insufficient
              ? `ยอดไม่พอ ขาดอีก ${formatCurrency(shortfall)}`
              : null
          }
        />

        <MethodRow
          selected={method === 'PROMPTPAY'}
          onSelect={() => setMethod('PROMPTPAY')}
          icon={<QrCode size={18} style={{ color: PLUM }} />}
          title='PromptPay QR'
          subtitle='สแกน QR ผ่านแอปธนาคาร'
        />

        <MethodRow
          selected={method === 'BANK'}
          onSelect={() => setMethod('BANK')}
          icon={<Landmark size={18} style={{ color: PLUM }} />}
          title='โอนผ่านบัญชีธนาคาร'
          subtitle='แนบสลิปหลังชำระเงิน'
        />
      </div>
    </AppDialog>
  );
}

function MethodRow({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  warning,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  warning?: string | null;
}) {
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={onSelect}
      className='w-full flex items-center gap-3 rounded-2xl border p-3 mb-2 text-left transition-colors'
      style={{
        borderColor: selected ? PLUM : BORDER_WARM,
        background: selected ? '#F5F3FF' : 'white',
      }}
    >
      <span
        className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
        style={{ background: '#F5F3FF' }}
      >
        {icon}
      </span>
      <span className='flex-1 min-w-0'>
        <span className='block text-sm font-semibold' style={{ color: DEEP_PURPLE }}>
          {title}
        </span>
        <span className='block text-xs text-gray-500 mt-0.5 truncate'>{subtitle}</span>
        {warning ? (
          <span className='block text-[11px] font-semibold text-red-600 mt-0.5'>{warning}</span>
        ) : null}
      </span>
      <span
        className='w-4 h-4 rounded-full border-2 shrink-0'
        style={{
          borderColor: selected ? PLUM : '#D1D5DB',
          background: selected ? PLUM : 'transparent',
        }}
      />
    </Button>
  );
}
