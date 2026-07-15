import React from 'react';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/utils/formatting/formatCurrency';

type Props = {
  /** PromptPay proxy id — เบอร์โทร (0812345678), เลขบัตร ปชช. 13 หลัก หรือ e-wallet id */
  promptPayId: string;
  /** ยอดที่ต้องโอน — จะถูกล็อกไว้ใน QR ผู้จ่ายแก้ไม่ได้ */
  amount: number;
  accountName?: string;
  size?: number;
};

/**
 * PromptPay QR (มาตรฐาน EMVCo) ที่ล็อกยอดโอนไว้ให้เลย
 * — ผู้ใช้สแกนด้วยแอปธนาคารแล้วยอดจะถูกกรอกอัตโนมัติ ไม่ต้องพิมพ์เอง
 */
export function PromptPayQR({ promptPayId, amount, accountName, size = 196 }: Props) {
  const payload = React.useMemo(() => {
    const id = promptPayId.replace(/[\s-]/g, '');
    if (!id || !(amount > 0)) return '';
    try {
      return generatePayload(id, { amount });
    } catch {
      return '';
    }
  }, [promptPayId, amount]);

  if (!payload) return null;

  return (
    <div className='flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4'>
      <span className='text-[13px] font-bold tracking-wide text-[#113d69]'>
        PromptPay
      </span>
      <div className='rounded-xl bg-white p-2'>
        <QRCodeSVG value={payload} size={size} level='M' marginSize={0} />
      </div>
      {accountName ? (
        <p className='text-sm font-semibold text-slate-800'>{accountName}</p>
      ) : null}
      <p className='text-lg font-semibold tabular-nums text-slate-900'>{formatCurrency(amount)}</p>
      <p className='text-[11px] text-slate-400 text-center leading-relaxed'>
        สแกนด้วยแอปธนาคาร — ยอดโอนถูกล็อกไว้แล้ว ไม่ต้องกรอกเอง
      </p>
    </div>
  );
}
