import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi } from '@/services/api/adminApi';
import { extractAdminFactoryRows, mapAdminFactory } from '@/domain/admin/mappers/mapAdminFactory';
import type { AdminFactory, FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableContainer,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
  TableSkeletonRows,
} from '@/components/admin/AdminTable';

export type { FactoryApprovalStatus } from '@/domain/admin/types/adminFactory.model';

type AdminBadgeVariant = NonNullable<React.ComponentProps<typeof Badge>['variant']>;

const STATUS_META: Record<FactoryApprovalStatus, { label: string; variant: AdminBadgeVariant }> = {
  pending: { label: 'รอ Approve', variant: 'pending' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  suspended: { label: 'Suspended', variant: 'inactive' },
};

const STATUS_TABS: { key: 'all' | FactoryApprovalStatus; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอ Approve' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
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
  const [allFactories, setAllFactories] = useState<AdminFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFactories = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await adminApi.listFactories({
        search: search.trim() || undefined,
        page: 1,
        page_size: 100,
      });
      const mapped = extractAdminFactoryRows(raw).map(mapAdminFactory);
      setAllFactories(mapped);
      setFactories(
        statusTab === 'all'
          ? mapped
          : mapped.filter((factory) => factory.approval_status === statusTab),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลโรงงานไม่สำเร็จ');
      setFactories([]);
      setAllFactories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      void loadFactories();
    }, 250);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setFactories(
      statusTab === 'all'
        ? allFactories
        : allFactories.filter((factory) => factory.approval_status === statusTab),
    );
  }, [allFactories, statusTab]);

  const counts = useMemo(() => {
    const next: Record<string, number> = {
      all: allFactories.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    };
    allFactories.forEach((f) => {
      next[f.approval_status] += 1;
    });
    return next;
  }, [allFactories]);

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div>
        <p className='text-xs text-slate-400 font-medium'>Admin / โรงงาน</p>
        <h2 className='text-2xl lg:text-3xl font-bold text-slate-900 mt-1'>จัดการโรงงาน</h2>
      </div>

      <div className='space-y-3'>
        <div className='relative max-w-sm'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <Input
            type='text'
            placeholder='ค้นหาชื่อโรงงาน, อีเมล, เจ้าของ...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500'
          />
        </div>

        <div className='flex gap-1 flex-wrap'>
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <Button
                variant='unstyled'
                key={tab.key}
                type='button'
                onClick={() => setStatusTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-600 border border-purple-100 hover:bg-purple-50 hover:border-purple-200'
                }`}
              >
                {tab.label}
                <Badge
                  variant={active ? 'active' : 'outline'}
                  size='sm'
                  className={active ? '' : 'border-purple-100 bg-white text-purple-600'}
                >
                  {count}
                </Badge>
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

      <AdminTableContainer>
        <AdminTable className='min-w-[860px]'>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead>โรงงาน</AdminTableHead>
              <AdminTableHead>เจ้าของ</AdminTableHead>
              <AdminTableHead>อีเมล</AdminTableHead>
              <AdminTableHead>โทรศัพท์</AdminTableHead>
              <AdminTableHead>วันที่สมัคร</AdminTableHead>
              <AdminTableHead>สถานะ</AdminTableHead>
              <AdminTableHead className='text-right'>Actions</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {loading ? (
              <TableSkeletonRows columns={7} rows={3} />
            ) : factories.length === 0 ? (
              <AdminTableRow>
                <AdminTableCell colSpan={7} className='py-12 text-center text-sm text-slate-400'>
                  ไม่พบโรงงานที่ตรงกับเงื่อนไข
                </AdminTableCell>
              </AdminTableRow>
            ) : (
              factories.map((factory) => {
                const { label, variant } = STATUS_META[factory.approval_status];
                return (
                  <AdminTableRow key={factory.id}>
                    <AdminTableCell>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0'>
                            {factory.factory_name.charAt(0)}
                          </div>
                          <div>
                            <Button
                              variant='unstyled'
                              type='button'
                              onClick={() => navigate(`/admin/factories/${factory.factory_id}`)}
                              className='font-semibold text-slate-900 hover:text-slate-700 hover:underline text-sm text-left'
                            >
                              {factory.factory_name}
                            </Button>
                            <p className='text-[11px] text-slate-400 mt-0.5'>
                              {factory.province} · {factory.business_type}
                            </p>
                          </div>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-700'>
                        {factory.owner_name}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-500'>
                        {factory.email}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-500 tabular-nums'>
                        {factory.phone}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3 text-sm text-slate-400 tabular-nums'>
                        {formatThaiDate(factory.registered_at)}
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3'>
                        <Badge variant={variant} size='sm'>
                          {label}
                        </Badge>
                      </AdminTableCell>
                      <AdminTableCell className='px-4 py-3'>
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
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })
              )}
            </AdminTableBody>
          </AdminTable>
      </AdminTableContainer>

      {loading && (
        <div className='fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600'>
          <Loader2 className='w-3 h-3 animate-spin' />
          กำลังโหลดข้อมูลโรงงาน
        </div>
      )}
    </div>
  );
}
