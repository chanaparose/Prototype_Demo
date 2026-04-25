import React from 'react';
import { X, Wallet, QrCode, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, walletApi } from '../../../services/api';
import {
  ACCENT_ORANGE_DEEP,
  BORDER_WARM,
  CTA_GRADIENT,
  DEEP_PURPLE,
  PEACH_MIST,
  PLUM,
} from '../rfq-and-orders/constants';

export type DepositPaymentMethod = 'WALLET' | 'PROMPTPAY' | 'BANK';

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  /** Called after a successful wallet payment so the page can refetch order/production. */
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
    queryKey: ['wallet', 'me'],
    queryFn: async () => {
      const w = (await walletApi.getMe()) as Record<string, unknown>;
      return {
        good_fund: Number(w.good_fund ?? w.walletBalance ?? 0) || 0,
        pending_fund: Number(w.pending_fund ?? w.pendingBalance ?? 0) || 0,
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
  const [method, setMethod] = React.useState<DepositPaymentMethod>('WALLET');
  const [submitting, setSubmitting] = React.useState(false);
  const idemRef = React.useRef<string>('');

  React.useEffect(() => {
    if (open) {
      idemRef.current = genIdempotencyKey(orderId);
      setMethod('WALLET');
    }
  }, [open, orderId]);

  if (!open) return null;

  const canSubmitWallet = method === 'WALLET' && !insufficient && !wallet.isPending;
  const canSubmit = method === 'WALLET' ? canSubmitWallet : true;

  const handleSubmit = async () => {
    if (submitting || !canSubmit) return;
    setSubmitting(true);
    try {
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
        // Without a dedicated payment page, we just inform user and close.
        toast.success('สร้างรายการชำระแล้ว กรุณาทำตามขั้นตอนการชำระเงิน');
        onClose();
      }
    } catch (err) {
      const e = err as { status?: number; body?: { error_code?: string; message?: string; shortfall?: number; topup_url?: string } };
      const code = e?.body?.error_code;
      if (code === 'INSUFFICIENT_WALLET_BALANCE') {
        toast.error(`ยอด Wallet ไม่พอ ขาดอีก ฿${Number(e.body?.shortfall ?? 0).toLocaleString('th-TH')}`);
      } else if (code === 'DEPOSIT_EXPIRED') {
        toast.error('หมดกำหนดชำระเงินแล้ว');
      } else if (code === 'DEPOSIT_ALREADY_PAID') {
        toast.error('คำสั่งซื้อนี้ชำระเงินแล้ว');
        await onSuccess?.();
        onClose();
      } else if (code === 'AMOUNT_MISMATCH') {
        toast.error('ยอดไม่ตรงกับที่ระบบกำหนด กรุณารีเฟรชหน้า');
      } else {
        const msg = e?.body?.message ?? (err instanceof Error ? err.message : 'ชำระเงินไม่สำเร็จ');
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shortfall = Math.max(0, amount - good);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="เลือกวิธีชำระเงิน"
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold" style={{ color: DEEP_PURPLE }}>
            ชำระเงินเต็มจำนวน
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#F3F4F6' }}
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <div
          className="mx-5 mb-4 rounded-2xl border p-4"
          style={{ borderColor: BORDER_WARM, background: PEACH_MIST }}
        >
          <p className="text-[11px]" style={{ color: ACCENT_ORANGE_DEEP }}>
            ยอดที่ต้องชำระ
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums" style={{ color: DEEP_PURPLE }}>
            ฿{amount.toLocaleString('th-TH')}
          </p>
        </div>

        <div className="px-5 pb-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">เลือกวิธีชำระ</p>

          <MethodRow
            selected={method === 'WALLET'}
            onSelect={() => setMethod('WALLET')}
            icon={<Wallet size={18} style={{ color: PLUM }} />}
            title="Wallet ของฉัน"
            subtitle={
              wallet.isPending
                ? 'กำลังโหลดยอดคงเหลือ…'
                : `คงเหลือ ฿${good.toLocaleString('th-TH')}`
            }
            warning={
              method === 'WALLET' && !wallet.isPending && insufficient
                ? `ยอดไม่พอ ขาดอีก ฿${shortfall.toLocaleString('th-TH')}`
                : null
            }
          />

          <MethodRow
            selected={method === 'PROMPTPAY'}
            onSelect={() => setMethod('PROMPTPAY')}
            icon={<QrCode size={18} style={{ color: PLUM }} />}
            title="PromptPay QR"
            subtitle="สแกน QR ผ่านแอปธนาคาร"
          />

          <MethodRow
            selected={method === 'BANK'}
            onSelect={() => setMethod('BANK')}
            icon={<Landmark size={18} style={{ color: PLUM }} />}
            title="โอนผ่านบัญชีธนาคาร"
            subtitle="แนบสลิปหลังชำระเงิน"
          />
        </div>

        <div className="px-5 pb-5 pt-3">
          {method === 'WALLET' && insufficient && !wallet.isPending ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = '/wallet/topup';
              }}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white mb-2"
              style={{ background: PLUM }}
            >
              เติมเงินเข้า Wallet
            </button>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: CTA_GRADIENT }}
          >
            {submitting
              ? 'กำลังดำเนินการ…'
              : method === 'WALLET'
                ? `ยืนยันชำระด้วย Wallet · ฿${amount.toLocaleString('th-TH')}`
                : 'ดำเนินการต่อ'}
          </button>
        </div>
      </div>
    </div>
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
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  warning?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 rounded-2xl border p-3 mb-2 text-left transition-colors"
      style={{
        borderColor: selected ? PLUM : BORDER_WARM,
        background: selected ? '#F5F3FF' : 'white',
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: '#F5F3FF' }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold" style={{ color: DEEP_PURPLE }}>
          {title}
        </span>
        <span className="block text-xs text-gray-500 mt-0.5 truncate">{subtitle}</span>
        {warning ? (
          <span className="block text-[11px] font-semibold text-red-600 mt-0.5">{warning}</span>
        ) : null}
      </span>
      <span
        className="w-4 h-4 rounded-full border-2 shrink-0"
        style={{
          borderColor: selected ? PLUM : '#D1D5DB',
          background: selected ? PLUM : 'transparent',
        }}
      />
    </button>
  );
}
