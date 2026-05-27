import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight,
  Bell,
  Wallet,
  Shield,
  HelpCircle,
  LogOut,
  Star,
  Heart,
  Package,
  FileText,
  Settings,
  User,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  MapPin,
  Plus,
  Home,
  ArrowLeftRight,
  Factory,
  Loader2,
} from 'lucide-react';
import { useData } from '@/stores/useDataStore';
import { useAuth, useAuthStore } from '@/stores/useAuthStore';
import { getAvailableRoles } from '@/services/api/authApi';
import { profileApi } from '@/services/api/userApi';
import { addressesApi } from '@/services/api/masterApi';
import { HARDCODED_CUSTOMER_PROFILE_SRC } from '@/constants/customerProfile';
import { Button } from '@/components/ui/button';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';

type ProfileMenuItem = {
  icon: typeof User;
  label: string;
  sub: string;
  color: string;
  bg: string;
  /** customer app route (relative to site root) */
  to?: string;
};

const menuSections: { title?: string; items: ProfileMenuItem[] }[] = [
  {
    items: [
      {
        icon: User,
        label: 'ข้อมูลส่วนตัว',
        sub: 'แก้ไขโปรไฟล์',
        color: 'var(--brand-royal)',
        bg: '#EDE9FF',
        to: '/profile/edit',
      },
      {
        icon: Star,
        label: 'รีวิวของฉัน',
        sub: 'รีวิวที่ให้กับโรงงาน',
        color: 'var(--status-warning)',
        bg: 'var(--status-warning-soft)',
        to: '/profile/reviews',
      },
      {
        icon: Bell,
        label: 'การแจ้งเตือน',
        sub: 'จัดการการแจ้งเตือน',
        color: 'var(--status-info)',
        bg: 'var(--status-info-soft)',
        to: '/notifications',
      },
    ],
  },
  {
    title: 'ธุรกิจ',
    items: [
      {
        icon: FileText,
        label: 'คำขอราคา & คำสั่งซื้อ ทั้งหมด',
        sub: 'ดูประวัติการขอใบเสนอราคา',
        color: '#8B5CF6',
        bg: '#EDE9FF',
        to: '/orders',
      },
      {
        icon: Heart,
        label: 'รายการโปรด',
        sub: 'สินค้า / โปรโมชัน / ไอเดีย ที่บันทึกไว้',
        color: '#EC4899',
        bg: '#FCE7F3',
        to: '/profile/favorites',
      },
    ],
  },
  {
    title: 'อื่นๆ',
    items: [
      {
        icon: Shield,
        label: 'ความปลอดภัย',
        sub: 'รหัสผ่านและความเป็นส่วนตัว',
        color: 'var(--neutral-subtle)',
        bg: 'var(--neutral-muted)',
      },
      {
        icon: HelpCircle,
        label: 'ช่วยเหลือ',
        sub: 'FAQ และติดต่อ Support',
        color: 'var(--neutral-subtle)',
        bg: 'var(--neutral-muted)',
      },
      {
        icon: Settings,
        label: 'ตั้งค่า',
        sub: 'ภาษา, การแสดงผล',
        color: 'var(--neutral-subtle)',
        bg: 'var(--neutral-muted)',
      },
    ],
  },
];

type WalletTransaction = {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit';
};

function mapTxLabel(row: Record<string, unknown>): string {
  const txType = String(row.transaction_type ?? row.type ?? '').toUpperCase();
  const refType = String(row.reference_type ?? '').toLowerCase();
  const refId = Number(row.reference_id ?? 0);
  if (txType === 'BU') {
    if (refType === 'order' && Number.isFinite(refId) && refId > 0)
      return `สั่งซื้อ Order #${refId}`;
    return 'สั่งซื้อ';
  }
  if (txType === 'DP') return 'มัดจำ';
  if (txType === 'WD') return 'ถอนเงิน';
  if (txType === 'SC') return 'รับเงิน';
  if (txType === 'RF') return 'คืนเงิน';
  return String(row.description ?? row.type_label ?? row.label ?? row.note ?? 'รายการ');
}

function normTransaction(r: Record<string, unknown>, isCustomer: boolean): WalletTransaction {
  const amount = Number(r.amount ?? 0);
  const direction = String(r.direction ?? '').toLowerCase();
  const txTypeRaw = String(r.transaction_type ?? r.type ?? '').toUpperCase();
  let type: 'credit' | 'debit';
  if (amount < 0) type = 'debit';
  else if (amount > 0) type = 'credit';
  else if (isCustomer && txTypeRaw === 'BU') type = 'debit';
  else if (direction === 'in') type = 'credit';
  else if (direction === 'out') type = 'debit';
  else {
    const txType = String(r.transaction_type ?? r.type ?? '').toLowerCase();
    type = txType === 'credit' || txType === 'topup' || txType === 'refund' ? 'credit' : 'debit';
  }
  const rawDate = String(r.created_at ?? r.date ?? '');
  let date = rawDate;
  if (rawDate && !Number.isNaN(Date.parse(rawDate))) {
    date = new Date(rawDate).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return {
    id: String(r.tx_id ?? r.transaction_id ?? r.id ?? ''),
    label: mapTxLabel(r),
    amount: Math.abs(amount),
    date,
    type,
  };
}

function MobileRoleSwitcher() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const switchRole = useAuthStore((s) => s.switchRole);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [switching, setSwitching] = React.useState(false);
  const loaded = React.useRef(false);
  const isFactory = String(user?.role ?? '').toUpperCase() === 'FT';

  React.useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    getAvailableRoles()
      .then((r) => setRoles(r.roles))
      .catch(() => {});
  }, []);

  if (!roles.includes('CT') || !roles.includes('FT')) return null;

  const targetRole = isFactory ? 'CT' : 'FT';
  const targetLabel = isFactory ? 'ลูกค้า' : 'โรงงาน';
  const TargetIcon = isFactory ? User : Factory;

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      await switchRole(targetRole);
      navigate(targetRole === 'FT' ? '/factory' : '/', { replace: true });
      window.location.reload();
    } catch {
      setSwitching(false);
    }
  };

  return (
    <Button
      variant='unstyled'
      disabled={switching}
      onClick={() => void handleSwitch()}
      className='w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-4 shadow-sm text-sm transition-all active:scale-[0.98]'
      style={{ color: 'var(--brand-indigo)', fontWeight: 600 }}
    >
      {switching ? <Loader2 size={18} className='animate-spin' /> : <ArrowLeftRight size={18} />}
      สลับเป็นบัญชี{targetLabel}
      <TargetIcon size={16} className='opacity-60' />
    </Button>
  );
}

export function ProfileMobile() {
  const navigate = useNavigate();
  const data = useData();
  const { logout } = useAuth();
  const currentUser = data.currentUser;
  const role = String(
    (currentUser as { role?: unknown; user_type?: unknown } | null)?.role ??
      (currentUser as { user_type?: unknown } | null)?.user_type ??
      '',
  ).toUpperCase();
  const isCustomer = role === 'CT' || role === 'CUSTOMER';
  const completedOrders = data.orders.filter((o) => o.status === 'completed').length;
  const totalSpent = data.orders.reduce((s, o) => s + o.depositPaid, 0);

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  type Address = { id: string; label: string; detail: string; isDefault: boolean };
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);

  const addAddress = async () => {
    if (!newAddress.trim() || addingAddress) return;
    setAddingAddress(true);
    try {
      await addressesApi.create({
        address_type: 'S',
        address_detail: newAddress.trim(),
        sub_district_id: 0,
        district_id: 0,
        province_id: 0,
        zip_code: '',
        is_default: addresses.length === 0,
      });
      setNewAddress('');
      setShowAddressForm(false);
      // refetch
      const raw = (await addressesApi.list()) as Record<string, unknown>[];
      setAddresses(
        raw
          .map((r) => ({
            id: String(r.address_id ?? r.id ?? ''),
            label: String(r.address_type ?? r.label ?? 'ที่อยู่'),
            detail: String(r.address_detail ?? r.detail ?? ''),
            isDefault: Boolean(r.is_default ?? false),
          }))
          .filter((a) => a.id),
      );
    } catch {
      // silent fail
    } finally {
      setAddingAddress(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    addressesApi
      .list()
      .then((raw) => {
        if (cancelled) return;
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        setAddresses(
          arr
            .map((r) => ({
              id: String(r.address_id ?? r.id ?? ''),
              label: String(r.address_type ?? r.label ?? 'ที่อยู่'),
              detail: String(r.address_detail ?? r.detail ?? ''),
              isDefault: Boolean(r.is_default ?? false),
            }))
            .filter((a) => a.id),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTxLoading(true);
    profileApi
      .transactions({ page: 1, limit: 20, type: 'all' })
      .then((raw) => {
        if (cancelled) return;
        const data = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
        setWalletTransactions(
          data
            .map((row) => normTransaction(row, isCustomer))
            .filter((t) => t.id)
            .slice(0, 5),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

  if (!currentUser) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-400 text-sm'>กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className='pb-4'>
      <div className='px-4 pt-5 mb-5'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <p className='text-[10px] text-gray-400 uppercase tracking-wider'>บัญชี</p>
            <h1 className='text-gray-900' style={{ fontWeight: 700 }}>
              โปรไฟล์
            </h1>
          </div>
        </div>

        <div
          className='rounded-3xl p-5 relative overflow-hidden'
          style={{
            background: 'linear-gradient(135deg, var(--brand-royal) 0%, #8B5CF6 60%, #A78BFA 100%)',
          }}
        >
          <div className='absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 bg-white' />
          <div className='absolute right-4 bottom-0 w-16 h-16 rounded-full opacity-15 bg-white' />
          <div className='relative z-10'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/30 bg-brand-lavender-muted'>
                <Image
                  src={HARDCODED_CUSTOMER_PROFILE_SRC}
                  alt='avatar'
                  className='absolute inset-0 w-full h-full object-cover object-center'
                />
              </div>
              <div>
                <p className='text-white' style={{ fontWeight: 700 }}>
                  {currentUser.name}
                </p>
                <p className='text-white/70 text-xs'>{currentUser.company}</p>
                <div
                  className='flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full w-fit'
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <span className='text-yellow-300 text-[10px]'>✓</span>
                  <span className='text-white text-[10px]'>Verified Member</span>
                </div>
              </div>
            </div>
            <div className='flex gap-4'>
              <div className='text-center'>
                <p className='text-white' style={{ fontWeight: 700 }}>
                  {completedOrders}
                </p>
                <p className='text-white/70 text-[10px]'>คำสั่งซื้อ</p>
              </div>
              <div className='w-px bg-white/30' />
              <div className='text-center'>
                <p className='text-white' style={{ fontWeight: 700 }}>
                  4.8
                </p>
                <p className='text-white/70 text-[10px]'>คะแนน</p>
              </div>
              <div className='w-px bg-white/30' />
              <div className='text-center'>
                <p className='text-white' style={{ fontWeight: 700 }}>
                  ฿{(totalSpent / 1000).toFixed(0)}K
                </p>
                <p className='text-white/70 text-[10px]'>ใช้จ่ายรวม</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='px-4 space-y-4'>
        <div className='bg-white rounded-2xl p-4 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <div
                className='w-9 h-9 rounded-xl flex items-center justify-center'
                style={{ background: '#EDE9FF' }}
              >
                <Wallet size={18} style={{ color: 'var(--brand-royal)' }} />
              </div>
              <p className='text-sm text-gray-900' style={{ fontWeight: 700 }}>
                กระเป๋าเงิน
              </p>
            </div>
          </div>

          <div className='mb-4'>
            <p className='text-[10px] text-gray-400 mb-1'>ยอดคงเหลือ</p>
            <p className='text-2xl text-gray-900' style={{ fontWeight: 700 }}>
              {formatCurrencyNoDecimals(currentUser.walletBalance)}
            </p>
            <div className='flex items-center gap-1 mt-1'>
              <span className='text-[10px]' style={{ color: 'var(--status-warning)' }}>
                รอดำเนินการ: {formatCurrencyNoDecimals(currentUser.pendingBalance)}
              </span>
            </div>
          </div>

          <div className='flex gap-2 mb-4'>
            <Button
              variant='unstyled'
              className='flex-1 py-2.5 rounded-xl text-xs text-white'
              style={{ background: 'var(--brand-royal)', fontWeight: 600 }}
            >
              + เติมเงิน
            </Button>
            <Button
              variant='unstyled'
              className='flex-1 py-2.5 rounded-xl text-xs border'
              style={{
                borderColor: 'var(--brand-royal)',
                color: 'var(--brand-royal)',
                fontWeight: 600,
              }}
            >
              ถอนเงิน
            </Button>
          </div>

          <div className='space-y-2.5'>
            <div className='flex justify-between items-end mb-4'>
              <h3 className='text-base font-bold text-slate-800'>รายการล่าสุด</h3>
              <Button
                variant='unstyled'
                type='button'
                className='inline-flex items-center gap-1 text-xs font-semibold text-brand-royal-dark'
                onClick={() => navigate('/profile/transactions')}
              >
                ดูทั้งหมด <ChevronRight size={14} strokeWidth={2.5} />
              </Button>
            </div>
            {txLoading ? (
              <p className='text-xs text-gray-400 text-center py-3'>กำลังโหลด...</p>
            ) : walletTransactions.length === 0 ? (
              <p className='text-xs text-gray-400 text-center py-3'>ยังไม่มีรายการ</p>
            ) : (
              walletTransactions.map((tx) => (
                <div key={tx.id} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    <div
                      className='w-8 h-8 rounded-xl flex items-center justify-center'
                      style={{
                        background: tx.type === 'credit' ? '#DCFCE7' : 'var(--status-danger-soft)',
                      }}
                    >
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft
                          size={14}
                          style={{ color: 'var(--status-success-bright)' }}
                        />
                      ) : (
                        <ArrowUpRight size={14} style={{ color: 'var(--status-danger)' }} />
                      )}
                    </div>
                    <div>
                      <p
                        className='text-xs text-gray-700 truncate max-w-[160px]'
                        style={{ fontWeight: 500 }}
                      >
                        {tx.label}
                      </p>
                      <p className='text-[10px] text-gray-400'>{tx.date}</p>
                    </div>
                  </div>
                  <p
                    className='text-xs shrink-0'
                    style={{
                      fontWeight: 700,
                      color:
                        tx.type === 'credit'
                          ? 'var(--status-success-bright)'
                          : 'var(--status-danger)',
                    }}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatCurrencyNoDecimals(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {menuSections.map((section, sectionIndex) => (
          <div
            key={section.title ?? `section-${sectionIndex}`}
            className='bg-white rounded-2xl shadow-sm overflow-hidden'
          >
            {section.title ? (
              <p className='text-[10px] text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2'>
                {section.title}
              </p>
            ) : null}
            {section.items.map((item, idx) => (
              <Button
                variant='unstyled'
                key={item.label}
                type='button'
                className='w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors'
                style={{ borderTop: idx > 0 ? '1px solid var(--neutral-surface)' : 'none' }}
                onClick={() => {
                  if (item.to) navigate(item.to);
                }}
              >
                <div className='flex items-center gap-3'>
                  <div
                    className='w-9 h-9 rounded-xl flex items-center justify-center'
                    style={{ background: item.bg }}
                  >
                    <item.icon size={17} style={{ color: item.color }} />
                  </div>
                  <div className='text-left'>
                    <p className='text-sm text-gray-900' style={{ fontWeight: 500 }}>
                      {item.label}
                    </p>
                    <p className='text-[10px] text-gray-400'>{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={16} className='text-gray-300' />
              </Button>
            ))}
          </div>
        ))}

        <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
          <div className='flex items-center justify-between px-4 pt-3 pb-2'>
            <div className='flex items-center gap-2'>
              <Home size={15} style={{ color: 'var(--brand-royal)' }} />
              <p className='text-[10px] text-gray-400 uppercase tracking-wider'>ที่อยู่จัดส่ง</p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setShowAddressForm((v) => !v)}
              className='flex items-center gap-0.5 text-[10px] font-semibold text-brand-royal'
            >
              <Plus size={12} /> เพิ่ม
            </Button>
          </div>
          {showAddressForm && (
            <div className='px-4 pb-3 flex gap-2'>
              <Input
                type='text'
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder='กรอกที่อยู่จัดส่ง...'
                className='flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-royal/30'
              />
              <Button
                variant='unstyled'
                type='button'
                onClick={addAddress}
                disabled={addingAddress || !newAddress.trim()}
                className='px-3 py-2 text-xs font-semibold text-white rounded-xl disabled:opacity-50'
                style={{ background: 'var(--brand-royal)' }}
              >
                {addingAddress ? '...' : 'บันทึก'}
              </Button>
            </div>
          )}
          {addressesLoading ? (
            <p className='text-xs text-gray-400 text-center py-3'>กำลังโหลด...</p>
          ) : addresses.length === 0 ? (
            <p className='text-xs text-gray-400 text-center pb-3'>ยังไม่มีที่อยู่</p>
          ) : (
            <div className='divide-y divide-gray-50'>
              {addresses.map((addr) => (
                <div key={addr.id} className='flex items-start gap-3 px-4 py-3'>
                  <MapPin size={14} className='text-brand-royal mt-0.5 shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs font-semibold text-gray-700 capitalize'>{addr.label}</p>
                    <p className='text-[11px] text-gray-500 truncate'>{addr.detail}</p>
                  </div>
                  {addr.isDefault && (
                    <span className='text-[9px] font-bold text-brand-royal bg-violet-50 px-1.5 py-0.5 rounded-full shrink-0'>
                      หลัก
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <MobileRoleSwitcher />

        <Button
          variant='unstyled'
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
          className='w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-4 shadow-sm text-sm transition-all active:scale-[0.98]'
          style={{ color: 'var(--status-danger)', fontWeight: 600 }}
        >
          <LogOut size={18} />
          ออกจากระบบ
        </Button>

        <p className='text-center text-[10px] text-gray-400 pb-2'>
          ManuConnect v1.0.0 · สมาชิกตั้งแต่ {currentUser.memberSince}
        </p>
      </div>
    </div>
  );
}
