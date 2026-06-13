import React from 'react';
import { Button } from '@/components/ui/button';

interface DismissRfqButtonProps {
  rfqId: number;
  rfqCode?: string;
  canDismiss: boolean;
  isDismissed?: boolean;
  onDismiss: () => Promise<void>;
  onUndismiss?: () => Promise<void>;
  disabledReason?: string;
}

export function DismissRfqButton({
  rfqId,
  rfqCode,
  canDismiss,
  isDismissed = false,
  onDismiss,
  onUndismiss,
  disabledReason,
}: DismissRfqButtonProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<{ sec: number } | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setInterval(() => {
      setToast((prev) => {
        if (!prev) return null;
        if (prev.sec <= 1) return null;
        return { sec: prev.sec - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [toast]);

  const labelCode = rfqCode || `#${rfqId}`;

  const doDismiss = async () => {
    setBusy(true);
    try {
      await onDismiss();
      if (onUndismiss) setToast({ sec: 5 });
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const doUndo = async () => {
    if (!onUndismiss) return;
    setBusy(true);
    try {
      await onUndismiss();
      setToast(null);
    } finally {
      setBusy(false);
    }
  };

  if (isDismissed) return null;

  return (
    <>
      <Button
        variant='unstyled'
        type='button'
        title={!canDismiss ? disabledReason : 'ไม่สนใจ RFQ นี้'}
        disabled={!canDismiss || busy}
        onClick={() => setConfirmOpen(true)}
        className='w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50'
      >
        ไม่สนใจ RFQ นี้
      </Button>

      {confirmOpen ? (
        <div className='fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4'>
          <div className='w-full max-w-md rounded-lg bg-white border border-gray-100 p-4'>
            <h3 className='text-base font-bold text-gray-900'>ไม่สนใจ RFQ นี้?</h3>
            <p className='text-sm text-gray-600 mt-2'>
              RFQ {labelCode} จะไม่แสดงในรายการของคุณอีก คุณสามารถยกเลิกได้ภายหลังผ่านเมนู "RFQ
              ที่ข้ามไปแล้ว"
            </p>
            <div className='mt-4 flex justify-end gap-2'>
              <Button
                variant='unstyled'
                type='button'
                onClick={() => setConfirmOpen(false)}
                className='px-3 py-2 rounded-lg border border-gray-200 text-sm'
              >
                ยกเลิก
              </Button>
              <Button
                variant='unstyled'
                type='button'
                disabled={busy}
                onClick={() => void doDismiss()}
                className='px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50'
              >
                ไม่สนใจ RFQ นี้
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className='fixed bottom-4 right-4 z-[60] rounded-lg bg-gray-900 text-white px-3 py-2 text-sm shadow-md'>
          <div className='flex items-center gap-2'>
            <span>ซ่อน RFQ {labelCode} แล้ว</span>
            {onUndismiss ? (
              <Button
                variant='unstyled'
                type='button'
                className='underline'
                onClick={() => void doUndo()}
              >
                ยกเลิก ({toast.sec}s)
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
