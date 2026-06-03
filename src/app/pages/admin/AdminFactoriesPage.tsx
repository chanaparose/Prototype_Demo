import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi } from '@/services/api/adminApi';
import { extractAdminFactoryRows, mapAdminFactory } from '@/domain/admin/mappers/mapAdminFactory';
import type { AdminFactory, FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeletonRows,
} from '@/components/ui/table';

export type { FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';

const STATUS_META: Record<FactoryApprovalStatus, { label: string; cls: string }> = {
  pending: { label: 'รอ Approve', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  suspended: { label: 'Suspended', cls: 'bg-slate-100 text-slate-600' },
};

const STATUS_TABS: { key: 'all' | FactoryApprovalStatus; label: string; apiStatus?: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอ Approve', apiStatus: 'PE' },
  { key: 'approved', label: 'Approved', apiStatus: 'AP' },
  { key: 'rejected', label: 'Rejected', apiStatus: 'RJ' },
  { key: 'suspended', label: 'Suspended', apiStatus: 'SU' },
];

function formatThaiDate(input: string): string {
  if (!input) return '-';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function AdminFactoriesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | FactoryApprovalStatus>('all');
  const [factories, setFactories] = useState<AdminFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFactories = async () => {
    setLoading(true);
    setError('');
    try {
      const apiStatus = STATUS_TABS.find((t) => t.key === statusTab)?.apiStatus;
      const raw = await adminApi.listFactories({
        approval_status: apiStatus,
        search: search.trim() || undefined,
        page: 1,
        page_size: 100,
      });
      setFactories(extractAdminFactoryRows(raw).map(mapAdminFactory));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลโรงงานไม่สำเร็จ');
      setFactories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      void loadFactories();
    }, 250);
    return () => clearTimeout(id);
  }, [statusTab, search]);

  const counts = useMemo(() => {
    const next: Record<string, number> = {
      all: factories.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    };
    factories.forEach((f) => {
      next[f.approval_status] += 1;
    });
    return next;
  }, [factories]);

  return (
    <div className='space-y-6'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / โรงงาน</p>
        <h2 className='text-2xl font-bold text-slate-900 mt-1'>จัดการโรงงาน</h2>
      </div>

      <div className='bg-white rounded-xl border border-slate-200 p-4 shadow-sm'>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
            <Input
              type='text'
              placeholder='ค้นหาชื่อโรงงาน, อีเมล, เจ้าของ...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
        </div>

        <div className='flex gap-1 mt-3 flex-wrap'>
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <Button
                variant='unstyled'
                key={tab.key}
                type='button'
                onClick={() => setStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      )}

      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table className='w-full text-sm min-w-[860px]'>
            <TableHeader>
              <TableRow className='bg-slate-50 border-b border-slate-200'>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  โรงงาน
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  เจ้าของ
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  อีเมล
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  โทรศัพท์
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  วันที่สมัคร
                </TableHead>
                <TableHead className='text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  สถานะ
                </TableHead>
                <TableHead className='text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='divide-y divide-slate-100'>
              {loading ? (
                <TableSkeletonRows columns={7} rows={3} />
              ) : factories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='py-12 text-center text-sm text-slate-400'>
                    ไม่พบโรงงานที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                factories.map((factory) => {
                  const { label, cls } = STATUS_META[factory.approval_status];
                  return (
                    <TableRow key={factory.id} className='hover:bg-slate-50 transition-colors'>
                      <TableCell className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0'>
                            {factory.factory_name.charAt(0)}
                          </div>
                          <div>
                            <Button
                              variant='unstyled'
                              type='button'
                              onClick={() => navigate(`/admin/factories/${factory.factory_id}`)}
                              className='font-semibold text-indigo-600 hover:text-indigo-800 hover:underline text-sm text-left'
                            >
                              {factory.factory_name}
                            </Button>
                            <p className='text-[11px] text-slate-400 mt-0.5'>
                              {factory.province} · {factory.business_type}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-slate-700'>
                        {factory.owner_name}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-slate-500'>
                        {factory.email}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-slate-500 tabular-nums'>
                        {factory.phone}
                      </TableCell>
                      <TableCell className='px-4 py-3 text-sm text-slate-400 tabular-nums'>
                        {formatThaiDate(factory.registered_at)}
                      </TableCell>
                      <TableCell className='px-4 py-3'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
                        >
                          {label}
                        </span>
                      </TableCell>
                      <TableCell className='px-4 py-3'>
                        <div className='flex items-center justify-end gap-1.5'>
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={() => navigate(`/admin/factories/${factory.factory_id}`)}
                            className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors'
                          >
                            <Eye size={13} />
                            ดู
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {loading && (
        <div className='fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm'>
          <Loader2 className='w-3 h-3 animate-spin' />
          กำลังโหลดข้อมูลโรงงาน
        </div>
      )}
    </div>
  );
}
