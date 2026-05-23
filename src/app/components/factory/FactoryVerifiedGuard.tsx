import React from 'react';
import { Link, Outlet } from 'react-router';
import { Lock } from 'lucide-react';
import { asRecord } from '@/lib/apiShape';
import { useAuth } from '@/stores/useAuthStore';

export type FactoryVerifyStatus = 'AP' | 'PD' | 'RJ';

export function factoryVerifyStatus(user: { verify_status?: string } | null): FactoryVerifyStatus {
  const s = String(user?.verify_status ?? 'AP').toUpperCase();
  if (s === 'PD' || s === 'RJ') return s;
  return 'AP';
}

// หน้าที่ต้อง verify_status = AP — ไม่ผ่านแสดง placeholder (FACTORY_UI_SPEC §11)
export function FactoryVerifiedGuard() {
  const { user } = useAuth();
  const st = factoryVerifyStatus(user);
  if (st === 'AP') return <Outlet />;
  return <FactoryPendingPlaceholder status={st} />;
}

function FactoryPendingPlaceholder({ status }: { status: 'PD' | 'RJ' }) {
  const { user } = useAuth();
  const reason = String(
    asRecord(user).verify_rejection_reason ?? asRecord(user).rejection_reason ?? '',
  ).trim();

  return (
    <div className='max-w-lg mx-auto py-10 sm:py-14 px-4'>
      <div className='rounded-2xl border border-violet-200 bg-violet-50/70 p-6 sm:p-8 text-center shadow-sm'>
        <Lock className='w-10 h-10 mx-auto text-violet-600 mb-3' strokeWidth={2} aria-hidden />
        <h2 className='text-lg font-bold text-gray-900 mb-2'>
          {status === 'RJ' ? 'บัญชีโรงงานไม่ผ่านการตรวจสอบ' : 'โรงงานอยู่ระหว่างตรวจสอบ'}
        </h2>
        <p className='text-sm text-gray-600 leading-relaxed mb-5'>
          {status === 'RJ'
            ? reason || 'กรุณาปรับข้อมูลและส่งตรวจสอบใหม่จากหน้าโปรไฟล์'
            : 'เมื่อแอดมินอนุมัติแล้ว คุณจะใช้งาน Showcase, กระดาน RFQ, ใบเสนอราคา และออเดอร์ได้'}
        </p>
        <Link
          to='/factory/profile'
          className='inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95'
          style={{
            background: 'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-violet) 100%)',
          }}
        >
          {status === 'RJ' ? 'แก้ไขและส่งใหม่' : 'ไปที่โปรไฟล์'}
        </Link>
      </div>
    </div>
  );
}
