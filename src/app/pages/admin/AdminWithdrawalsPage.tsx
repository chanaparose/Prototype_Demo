import { WithdrawalQueueSection } from '@/components/features/admin/WithdrawalQueueSection';

export function AdminWithdrawalsPage() {
  return (
    <div className='space-y-6 lg:space-y-8'>
      <div>
        <h2 className='text-2xl lg:text-3xl font-bold text-slate-900'>คำขอถอนเงินโรงงาน</h2>
        <p className='text-xs text-slate-400 mt-0.5'>
          โอนเงินให้โรงงานพร้อมแนบสลิปภายใน 1-2 วันทำการ
        </p>
      </div>
      <WithdrawalQueueSection />
    </div>
  );
}
