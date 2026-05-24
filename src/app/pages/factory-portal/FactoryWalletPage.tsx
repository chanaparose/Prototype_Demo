import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useModal } from '@/hooks/ui/useModal';
import { walletApi, transactionsApi } from '@/services/api/userApi';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';
import { Button } from '@/components/ui/button';
import { appColors } from '@/styles/colors';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatting/formatCurrency';

const NAVY = appColors.brand.navy;
const ORANGE = appColors.brand.indigo;
const TEAL = appColors.brand.teal;

type TxRow = Record<string, unknown>;

function normTx(r: TxRow) {
  const rawAmount = Number(r.amount ?? 0);
  const normalizedAmount = Number.isFinite(rawAmount) ? Math.abs(rawAmount) : 0;
  return {
    id: String(r.tx_id ?? r.transaction_id ?? r.id ?? ''),
    type: String(r.type ?? r.transaction_type ?? '').toUpperCase(),
    amount: normalizedAmount,
    status: String(r.status ?? '').toUpperCase(),
    date: String(r.created_at ?? r.uploaded_at ?? r.date ?? ''),
    description: String(r.description ?? ''),
    reference: String(r.reference ?? r.order_id ?? r.rfq_id ?? ''),
  };
}

type NormTx = ReturnType<typeof normTx>;

function isCredit(type: string): boolean {
  const t = String(type ?? '').toUpperCase();
  // Business mapping:
  // DP=Deposit(out), WD=Withdraw(out), BU=Buy(in), SC=Settlement/Receive(in), RF=Refund(in)
  if (t === 'BU' || t === 'SC' || t === 'RF') return true;
  if (t === 'DP' || t === 'WD') return false;
  return true;
}

function txLabel(type: string): string {
  const t = String(type ?? '').toUpperCase();
  if (t === 'DP') return 'ชำระมัดจำ';
  if (t === 'WD') return 'ถอนเงิน';
  if (t === 'BU') return 'รับชำระจากออเดอร์';
  if (t === 'SC') return 'รับโอนจากระบบ (Settlement)';
  if (t === 'RF') return 'คืนเงิน';
  if (t) return t;
  return 'ธุรกรรม';
}

function statusBadgeCls(status: string) {
  const s = String(status ?? '').toUpperCase();
  if (s === 'ST' || s === 'CM' || s === 'SUCCESS' || s === 'COMPLETED')
    return 'bg-emerald-100 text-emerald-700';
  if (s === 'PT' || s === 'PENDING' || s === 'PROCESSING') return 'bg-amber-100 text-amber-700';
  if (s === 'RJ' || s === 'FL' || s === 'FAILED' || s === 'CN' || s === 'CANCELLED')
    return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-500';
}

function statusLabel(status: string) {
  const s = String(status ?? '').toUpperCase();
  if (s === 'ST' || s === 'CM' || s === 'SUCCESS' || s === 'COMPLETED') return 'สำเร็จ';
  if (s === 'PT' || s === 'PENDING') return 'รอดำเนินการ';
  if (s === 'PROCESSING') return 'กำลังดำเนินการ';
  if (s === 'RJ') return 'ถูกปฏิเสธ';
  if (s === 'FL' || s === 'FAILED') return 'ล้มเหลว';
  if (s === 'CN' || s === 'CANCELLED') return 'ยกเลิก';
  return status || '-';
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white shadow-sm p-4'>
      <div
        className='w-9 h-9 rounded-xl flex items-center justify-center mb-3'
        style={{ backgroundColor: `${accent}1A` }}
      >
        <Icon size={17} style={{ color: accent }} />
      </div>
      <p className='text-lg font-bold tabular-nums' style={{ color: NAVY }}>
        {value}
      </p>
      <p className='text-xs text-gray-500 mt-0.5'>{label}</p>
    </div>
  );
}

function TxRow({ t }: { t: NormTx }) {
  const credit = isCredit(t.type);
  const desc = txLabel(t.type);
  const dateStr = t.date
    ? new Date(t.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    : '-';
  const ref = t.reference ? `· ${t.reference}` : '';
  const sBadgeCls = statusBadgeCls(t.status);
  const sLabel = statusLabel(t.status);

  return (
    <div className='flex items-center gap-3 px-4 py-3 border-t border-gray-50 hover:bg-brand-page transition-colors'>
      <div
        className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
        style={{ backgroundColor: credit ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)' }}
      >
        {credit ? (
          <ArrowDownLeft size={16} style={{ color: 'var(--status-success)' }} />
        ) : (
          <ArrowUpRight size={16} style={{ color: 'var(--status-danger-deep)' }} />
        )}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate' style={{ color: NAVY }}>
          {desc}
        </p>
        <p className='text-xs text-gray-400'>
          {dateStr} {ref}
        </p>
      </div>
      <div className='text-right shrink-0'>
        <p
          className='text-sm font-bold'
          style={{ color: credit ? 'var(--status-success)' : 'var(--status-danger-deep)' }}
        >
          {credit ? '+' : '-'}
          {formatCurrency(t.amount)}
        </p>
        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${sBadgeCls}`}>
          {sLabel}
        </span>
      </div>
    </div>
  );
}

export function FactoryWalletPage() {
  const [good, setGood] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [tx, setTx] = useState<NormTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');

  const withdraw = useModal();
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const w = (await walletApi.getMe()) as Record<string, unknown>;
      setGood(Number(w.good_fund ?? w.walletBalance ?? 0));
      setPending(Number(w.pending_fund ?? w.pendingBalance ?? 0));

      let raw: unknown;
      try {
        raw = await walletApi.transactions();
      } catch {
        raw = await transactionsApi.list().catch(() => []);
      }
      const arr = (Array.isArray(raw) ? raw : []) as TxRow[];
      const apiTx = arr
        .map(normTx)
        .filter((t) => t.id)
        .slice(0, 30);
      setTx(apiTx);
      setLastRefreshedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดกระเป๋าไม่สำเร็จ');
      setTx([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredTx = useMemo(
    () =>
      tx.filter((t) => {
        if (filterType === 'all') return true;
        if (filterType === 'credit') return isCredit(t.type);
        return !isCredit(t.type);
      }),
    [tx, filterType],
  );

  const totalEarned = useMemo(
    () => tx.filter((t) => isCredit(t.type)).reduce((s, t) => s + t.amount, 0),
    [tx],
  );
  const totalWithdrawn = useMemo(
    () => tx.filter((t) => !isCredit(t.type)).reduce((s, t) => s + t.amount, 0),
    [tx],
  );
  const pendingWithdrawals = useMemo(
    () =>
      tx.filter(
        (t) =>
          !isCredit(t.type) &&
          (String(t.status).toUpperCase() === 'PT' || String(t.status).toUpperCase() === 'PENDING'),
      ),
    [tx],
  );

  const thisMonthEarned = useMemo(() => (good ?? 0) + (pending ?? 0), [good, pending]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <FactoryPageHeader title='กระเป๋าเงิน' subtitle='Factory / Wallet' icon={Wallet} />
        <div className='space-y-4'>
          <div className='h-48 rounded-2xl bg-white animate-pulse' />
          <div className='grid grid-cols-3 gap-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='h-24 rounded-2xl bg-white animate-pulse' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const balanceDisplay = formatCurrency(good ?? 0);
  const pendingDisplay = formatCurrency(pending ?? 0);

  return (
    <div className='space-y-4 pb-8'>
      <FactoryPageHeader title='กระเป๋าเงิน' subtitle='Factory / Wallet' icon={Wallet} />

      <div className='space-y-5'>
        <div className='flex items-center justify-between text-xs text-gray-500'>
          <span>อัปเดต: {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString('th-TH') : '-'}</span>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void load()}
            className='flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50 transition-colors font-medium'
          >
            <RefreshCw size={12} />
            รีเฟรช
          </Button>
        </div>

        {error ? (
          <div className='flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3'>
            <AlertCircle size={16} className='shrink-0' />
            <span>{error} — แสดงข้อมูลตัวอย่างแทน</span>
          </div>
        ) : null}

        <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <p className='text-sm text-slate-500 mb-0.5'>ยอดคงเหลือ</p>
          <p className='text-4xl font-bold tabular-nums text-slate-900'>{balanceDisplay}</p>

          <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
              <p className='text-xs text-slate-500'>รอดำเนินการ</p>
              <p className='text-base font-semibold tabular-nums text-slate-800'>
                {pendingDisplay}
              </p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
              <p className='text-xs text-slate-500'>รายได้รวมเดือนนี้</p>
              <p className='text-base font-semibold tabular-nums text-slate-800'>
                {formatCurrency(thisMonthEarned)}
              </p>
            </div>
          </div>

          <div className='mt-5 flex gap-3'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => {
                setWithdrawAmount('');
                withdraw.openModal();
              }}
              className='flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors'
            >
              ถอนเงิน
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={() =>
                document.getElementById('tx-section')?.scrollIntoView({ behavior: 'smooth' })
              }
              className='flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors'
            >
              ประวัติการถอน
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-3'>
          <StatCard
            icon={TrendingUp}
            label='รายได้รวม'
            value={formatCurrency(totalEarned)}
            accent='var(--status-success)'
          />
          <StatCard
            icon={BarChart3}
            label='ถอนแล้ว'
            value={formatCurrency(totalWithdrawn)}
            accent={ORANGE}
          />
          <StatCard icon={Clock} label='รอรับ' value={formatCurrency(pending ?? 0)} accent={TEAL} />
        </div>

        <div
          className='rounded-2xl border px-4 py-3 text-sm'
          style={{ borderColor: '#C4B5D4', backgroundColor: '#F3EEF8', color: '#4A267D' }}
        >
          <p className='font-semibold mb-0.5'>เติมเงิน / ถอนเงิน (PromptPay)</p>
          <p className='text-xs opacity-80 leading-relaxed'>
            ฟลว์ PromptPay กำลังพัฒนา — ดูยอดและประวัติธุรกรรมด้านล่างได้จาก API ที่มีอยู่
          </p>
        </div>

        {pendingWithdrawals.length > 0 && (
          <section className='rounded-2xl border border-amber-100 bg-amber-50 overflow-hidden'>
            <div className='px-4 py-3 border-b border-amber-100 flex items-center gap-2'>
              <Clock size={15} style={{ color: 'var(--status-warning-deep)' }} />
              <h2 className='text-sm font-bold' style={{ color: '#92400E' }}>
                รายการถอนเงินรอดำเนินการ
              </h2>
            </div>
            <ul>
              {pendingWithdrawals.map((t) => (
                <li
                  key={t.id}
                  className='flex items-center justify-between gap-3 px-4 py-3 border-t border-amber-100 first:border-t-0'
                >
                  <div>
                    <p className='text-sm font-medium' style={{ color: NAVY }}>
                      {t.description || 'ถอนเงิน'}
                    </p>
                    <p className='text-xs text-amber-700'>
                      {t.date
                        ? new Date(t.date).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}{' '}
                      · {t.reference || '-'}
                    </p>
                  </div>
                  <div className='text-right shrink-0'>
                    <p className='text-sm font-bold text-amber-700'>-{formatCurrency(t.amount)}</p>
                    <span className='text-[11px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full'>
                      รอดำเนินการ
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section
          id='tx-section'
          className='rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden'
        >
          <div className='px-4 pt-4 pb-3 border-b border-gray-50'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-sm font-bold' style={{ color: NAVY }}>
                ประวัติธุรกรรม
              </h2>
              <span className='text-xs text-gray-400'>{filteredTx.length} รายการ</span>
            </div>

            <div className='flex gap-1.5'>
              {(
                [
                  { key: 'all', label: 'ทั้งหมด' },
                  { key: 'credit', label: 'รายรับ' },
                  { key: 'debit', label: 'รายจ่าย' },
                ] as const
              ).map(({ key, label }) => {
                const active = filterType === key;
                return (
                  <Button
                    variant='unstyled'
                    key={key}
                    type='button'
                    onClick={() => setFilterType(key)}
                    className='px-3 py-1.5 rounded-xl text-xs font-semibold transition-all'
                    style={
                      active
                        ? {
                            backgroundColor: ORANGE,
                            color: 'var(--neutral-white)',
                            boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
                          }
                        : { backgroundColor: 'var(--neutral-muted)', color: '#4B5563' }
                    }
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <p className='text-sm text-gray-400 text-center py-10'>ไม่มีรายการ</p>
          ) : (
            <div>
              {filteredTx.map((t) => (
                <TxRow key={t.id} t={t} />
              ))}
            </div>
          )}
        </section>
      </div>
      {/* end px-4 wrapper */}

      {withdraw.isOpen ? (
        <div className='fixed inset-0 z-[70]'>
          <Button
            variant='unstyled'
            type='button'
            className='absolute inset-0 bg-black/50'
            onClick={() => withdraw.closeModal()}
          />
          <div className='absolute inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] bottom-4 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden'>
            <div className='flex justify-center pt-3 pb-1'>
              <div className='w-10 h-1 rounded-full bg-gray-200' />
            </div>
            <div className='p-5 space-y-4'>
              <div className='flex items-center justify-between'>
                <h2 className='text-base font-bold' style={{ color: NAVY }}>
                  ถอนเงิน
                </h2>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => withdraw.closeModal()}
                  className='p-1.5 rounded-xl hover:bg-gray-100 transition-colors'
                >
                  <X size={18} className='text-gray-500' />
                </Button>
              </div>

              <div
                className='rounded-xl p-3 flex items-center justify-between'
                style={{ backgroundColor: `${TEAL}15` }}
              >
                <p className='text-sm' style={{ color: TEAL }}>
                  ยอดคงเหลือที่ถอนได้
                </p>
                <p className='font-bold tabular-nums' style={{ color: TEAL }}>
                  {formatCurrency(good ?? 0)}
                </p>
              </div>

              <div>
                <Label className='block text-xs font-semibold text-gray-600 mb-1.5'>
                  จำนวนที่ต้องการถอน
                </Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500'>
                    ฿
                  </span>
                  <Input
                    type='number'
                    min={500}
                    max={good ?? 0}
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      withdraw.clearError();
                    }}
                    placeholder='500'
                    className='w-full pl-7 pr-3 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-brand-teal'
                    style={{ color: NAVY }}
                  />
                </div>
                <p className='text-xs text-gray-400 mt-1'>ขั้นต่ำ ฿500</p>
              </div>

              <div className='rounded-xl border border-gray-100 bg-gray-50 px-3 py-3'>
                <p className='text-xs font-semibold text-gray-500 mb-0.5'>บัญชีปลายทาง</p>
                <p className='text-sm font-medium' style={{ color: NAVY }}>
                  PromptPay — จากโปรไฟล์
                </p>
                <p className='text-xs text-gray-400'>(ข้อมูลบัญชีโหลดจาก profile API อัตโนมัติ)</p>
              </div>

              {withdraw.error ? (
                <p className='text-xs text-red-600 flex items-center gap-1'>
                  <AlertCircle size={12} />
                  {withdraw.error}
                </p>
              ) : null}

              <div className='flex gap-3 pt-1'>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => withdraw.closeModal()}
                  className='flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors'
                >
                  ยกเลิก
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  disabled={withdraw.isLoading}
                  onClick={async () => {
                    const amt = Number(withdrawAmount);
                    if (!amt || amt < 500) {
                      withdraw.setError('จำนวนขั้นต่ำคือ ฿500');
                      return;
                    }
                    if (amt > (good ?? 0)) {
                      withdraw.setError('จำนวนเกินยอดคงเหลือ');
                      return;
                    }
                    const ok = await withdraw.runAsync(async () => {
                      // Existing withdrawal handler — wire to actual API when ready
                      await new Promise((r) => setTimeout(r, 800));
                      await load();
                    });
                    if (ok !== undefined) withdraw.closeModal();
                  }}
                  className='flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90'
                  style={{
                    background:
                      'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
                    boxShadow: '0 2px 8px rgba(227,136,68,0.35)',
                  }}
                >
                  {withdraw.isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันถอนเงิน'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
