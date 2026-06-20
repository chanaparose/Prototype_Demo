import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, AlertTriangle } from 'lucide-react';
import { adminCustomerApi } from '@/services/api/adminApi';
import type { IAdminCustomerListItemResponse } from '@/services/api/types/admin.types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { formatCompactNumber, formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { pickScalarNumber } from '@/utils/pickScalarString';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function toCurrency(n: number) {
  return formatCurrencyNoDecimals(pickScalarNumber(n) ?? 0);
}

const LIMIT = 20;

export function AdminCustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(0);

  const [customers, setCustomers] = useState<IAdminCustomerListItemResponse[]>([]);
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
        const data = res as unknown as {
          customers: IAdminCustomerListItemResponse[];
          total: number;
        };
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

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, isActive]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl lg:text-3xl font-bold text-slate-900'>ลูกค้าทั้งหมด</h2>
        </div>
        {!loading && (
          <span className='text-sm text-slate-500 font-medium'>
            {formatCompactNumber(total)} คน
          </span>
        )}
      </div>

      <div className='flex flex-wrap gap-3'>
        <div className='relative flex-1 min-w-[200px] max-w-sm'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
          <Input
            type='text'
            placeholder='ค้นหา email / ชื่อ...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
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

      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      )}

      <AdminTableContainer>
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
                <AdminTableHead>
                  ID
                </AdminTableHead>
                <AdminTableHead>
                  ชื่อ / Email
                </AdminTableHead>
                <AdminTableHead className='text-right'>
                  ออเดอร์
                </AdminTableHead>
                <AdminTableHead>
                  ยอดรวม
                </AdminTableHead>
                <AdminTableHead>
                  Wallet
                </AdminTableHead>
                <AdminTableHead className='text-center'>
                  สถานะ
                </AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody className='divide-y divide-slate-50'>
              {loading ? (
                <TableSkeletonRows columns={6} rows={5} />
              ) : customers.length === 0 ? (
                <AdminTableRow>
                  <AdminTableCell colSpan={6} className='px-4 py-12 text-center text-sm text-slate-400'>
                    ไม่พบข้อมูลลูกค้า
                  </AdminTableCell>
                </AdminTableRow>
              ) : (
                customers.map((c) => (
                  <AdminTableRow
                    key={c.user_id}
                    className='hover:bg-purple-50/40 cursor-pointer transition-colors'
                    onClick={() => navigate(`/admin/customers/${c.user_id}`)}
                  >
                    <AdminTableCell className='px-4 py-3 text-slate-400 text-xs font-mono'>
                      #{c.user_id}
                    </AdminTableCell>
                    <AdminTableCell className='px-4 py-3'>
                      <p className='font-medium text-slate-900 truncate max-w-[180px]'>
                        {c.first_name} {c.last_name}
                      </p>
                      <p className='text-xs text-slate-400 truncate max-w-[180px]'>{c.email}</p>
                    </AdminTableCell>
                    <AdminTableCell className='px-4 py-3 text-right tabular-nums text-slate-700'>
                      {c.total_orders}
                    </AdminTableCell>
                    <AdminTableCell className='px-4 py-3 tabular-nums font-semibold text-slate-900'>
                      {toCurrency(c.total_spend)}
                    </AdminTableCell>
                    <AdminTableCell className='px-4 py-3 tabular-nums text-slate-600'>
                      {toCurrency(c.wallet_balance)}
                    </AdminTableCell>
                    <AdminTableCell className='px-4 py-3 text-center'>
                      <Badge variant={c.is_active ? 'success' : 'inactive'} size='sm'>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
      </AdminTableContainer>

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
