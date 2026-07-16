import { DisputeQueueSection } from '@/components/features/admin/DisputeQueueSection';

export function AdminDisputesPage() {
  return (
    <div className='space-y-6 lg:space-y-8'>
      <div>
        <h2 className='text-2xl lg:text-3xl font-bold text-slate-900'>คำร้อง / ขอคืนเงิน</h2>
        <p className='text-xs text-slate-400 mt-0.5'>
          ตรวจสอบคำร้องจากลูกค้า (ไม่ได้รับสินค้า / สินค้าไม่ตรงปก / อื่นๆ) แล้วคืนเงินเต็มจำนวนหรือปฏิเสธ
        </p>
      </div>
      <DisputeQueueSection />
    </div>
  );
}
