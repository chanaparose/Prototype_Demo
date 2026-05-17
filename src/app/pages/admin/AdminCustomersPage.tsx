import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Search, AlertTriangle } from 'lucide-react';
import { adminCustomerApi, type AdminCustomerListItem } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function toCurrency(n: number) {
  return `฿${Number(n || 0).toLocaleString('th-TH')}`;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className='px-4 py-3'>
              <div className='h-4 bg-slate-100 rounded animate-pulse' />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const LIMIT = 20;

export function AdminCustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(0);

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError('');

    adminCustomerApi
      .list({ search: debouncedSearch, is_active: isActive, limit: LIMIT, offset: page * LIMIT })
      .then((res) => {
        if (ac.signal.aborted) return;
        const data = res as unknown as { customers: AdminCustomerListItem[]; total: number };
        setCustomers(data.customers ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'โหลดข้อมูลลูกค้าไม่สำเร็จ');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [debouncedSearch, isActive, page]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, isActive]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center'>
            <Users size={18} className='text-indigo-600' />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-slate-900'>ลูกค้าทั้งหมด</h2>
            <p className='text-xs text-slate-400 mt-0.5'>จัดการและตรวจสอบข้อมูลลูกค้า</p>
          </div>
        </div>
        {!loading && (
          <span className='text-sm text-slate-500 font-medium'>
            {total.toLocaleString('th-TH')} คน
          </span>
        )}
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-3'>
        <div className='relative flex-1 min-w-[200px] max-w-sm'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <Input
            type='text'
            placeholder='ค้นหา email / ชื่อ...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
          />
        </div>
        <Select
          value={isActive === undefined ? '' : String(isActive)}
          onValueChange={(next) => setIsActive(next === '__empty' ? undefined : next === 'true')}
        >
          <SelectTrigger className='w-full sm:w-36 rounded-lg'>
            <SelectValue placeholder='ทุกสถานะ' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__empty'>ทุกสถานะ</SelectItem>
            <SelectItem value='true'>Active</SelectItem>
            <SelectItem value='false'>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-slate-50 border-b border-slate-200'>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                  ID
                </th>
                <th className='px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                  ชื่อ / Email
                </th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                  ออเดอร์
                </th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                  ยอดรวม
                </th>
                <th className='px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                  Wallet
                </th>
                <th className='px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50'>
              {loading ? (
                <TableSkeleton />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className='px-4 py-12 text-center text-sm text-slate-400'>
                    ไม่พบข้อมูลลูกค้า
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.user_id}
                    className='hover:bg-indigo-50/40 cursor-pointer transition-colors'
                    onClick={() => navigate(`/admin/customers/${c.user_id}`)}
                  >
                    <td className='px-4 py-3 text-slate-400 text-xs font-mono'>#{c.user_id}</td>
                    <td className='px-4 py-3'>
                      <p className='font-medium text-slate-900 truncate max-w-[180px]'>
                        {c.first_name} {c.last_name}
                      </p>
                      <p className='text-xs text-slate-400 truncate max-w-[180px]'>{c.email}</p>
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums text-slate-700'>
                      {c.total_orders}
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums font-semibold text-slate-900'>
                      {toCurrency(c.total_spend)}
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums text-slate-600'>
                      {toCurrency(c.wallet_balance)}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      {c.is_active ? (
                        <span className='inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700'>
                          Active
                        </span>
                      ) : (
                        <span className='inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500'>
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='unstyled'
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className='px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors'
          >
            ← ก่อนหน้า
          </Button>
          <span className='text-sm text-slate-500 px-2'>
            หน้า {page + 1} / {totalPages}
          </span>
          <Button
            variant='unstyled'
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className='px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors'
          >
            ถัดไป →
          </Button>
        </div>
      )}
    </div>
  );
}
