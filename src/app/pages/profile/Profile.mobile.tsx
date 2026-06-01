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
  CheckCircle2,
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
      className='w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-4 text-brand-indigo font-semibold transition-all hover:bg-indigo-50 active:scale-[0.98] border border-gray-100 disabled:opacity-60'
    >
      {switching ? <Loader2 size={18} className='animate-spin' /> : <ArrowLeftRight size={18} />}
      สลับเป็นบัญชี{targetLabel}
      <TargetIcon size={16} className='opacity-70' />
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
    <div className='pb-6'>
      <div className='px-4 pt-6 pb-4'>
        <div className='mb-5'>
          <div>
            <p className='text-xs text-gray-400 uppercase tracking-widest font-semibold'>บัญชี</p>
            <h1 className='text-2xl text-gray-900 font-bold mt-1'>
              โปรไฟล์
            </h1>
          </div>
        </div>

        <div className='rounded-2xl p-6 bg-gradient-to-br from-brand-royal to-purple-600'>
          <div>
            <div className='flex items-start gap-4 mb-6'>
              <div className='relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/40 bg-white/10'>
                <Image
                  src={HARDCODED_CUSTOMER_PROFILE_SRC}
                  alt='avatar'
                  className='absolute inset-0 w-full h-full object-cover object-center'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-white text-lg font-bold'>
                  {currentUser.name}
                </p>
                <p className='text-white/70 text-sm mt-0.5'>{currentUser.company}</p>
                <div className='flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-white/15 w-fit'>
                  <CheckCircle2 size={16} className='text-yellow-200 shrink-0' />
                  <span className='text-white/90 text-xs font-medium'>Verified Member</span>
                </div>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <div className='text-center py-1'>
                <p className='text-white text-lg font-bold'>
                  {completedOrders}
                </p>
                <p className='text-white/70 text-xs mt-0.5'>คำสั่งซื้อ</p>
              </div>
              <div className='text-center py-1 border-l border-r border-white/20'>
                <p className='text-white text-lg font-bold'>
                  4.8
                </p>
                <p className='text-white/70 text-xs mt-0.5'>คะแนน</p>
              </div>
              <div className='text-center py-1'>
                <p className='text-white text-lg font-bold'>
                  ฿{(totalSpent / 1000).toFixed(0)}K
                </p>
                <p className='text-white/70 text-xs mt-0.5'>ใช้จ่ายรวม</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='px-4 space-y-5'>
        <div className='bg-white rounded-2xl p-5 border border-gray-200'>
          <div className='flex items-center justify-between mb-5'>
            <div className='flex items-center gap-3'>
              <Wallet size={24} className='text-brand-royal' />
              <p className='text-base text-gray-900 font-bold'>
                กระเป๋าเงิน
              </p>
            </div>
          </div>

          <div className='mb-6'>
            <p className='text-xs text-gray-500 font-medium mb-2'>ยอดคงเหลือ</p>
            <p className='text-3xl text-gray-900 font-bold'>
              {formatCurrencyNoDecimals(currentUser.walletBalance)}
            </p>
            <div className='flex items-center gap-1 mt-2'>
              <span className='text-xs text-amber-600 font-medium'>
                รอดำเนินการ: {formatCurrencyNoDecimals(currentUser.pendingBalance)}
              </span>
            </div>
          </div>

          <div className='flex gap-3 mb-6'>
            <Button
              variant='unstyled'
              className='flex-1 py-3 rounded-xl text-sm text-white font-semibold bg-brand-royal hover:bg-brand-royal/90 transition-colors'
            >
              + เติมเงิน
            </Button>
            <Button
              variant='unstyled'
              className='flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors'
            >
              ถอนเงิน
            </Button>
          </div>

          <div className='space-y-3'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-base font-bold text-gray-900'>รายการล่าสุด</h3>
              <Button
                variant='unstyled'
                type='button'
                className='inline-flex items-center gap-0.5 text-xs font-semibold text-brand-royal hover:text-brand-royal/80 transition-colors'
                onClick={() => navigate('/profile/transactions')}
              >
                ดูทั้งหมด <ChevronRight size={16} strokeWidth={2.5} />
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
                    <div>
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft
                          size={18}
                          className='text-green-600'
                        />
                      ) : (
                        <ArrowUpRight size={18} className='text-red-600' />
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
            className='bg-white rounded-2xl overflow-hidden border border-gray-200'
          >
            {section.title ? (
              <p className='text-xs text-gray-500 uppercase tracking-widest font-semibold px-5 pt-4 pb-3'>
                {section.title}
              </p>
            ) : null}
            {section.items.map((item, idx) => (
              <Button
                variant='unstyled'
                key={item.label}
                type='button'
                className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${idx > 0 ? 'border-t border-gray-200' : ''}`}
                onClick={() => {
                  if (item.to) navigate(item.to);
                }}
              >
                <div className='flex items-center gap-3'>
                  <item.icon size={20} style={{ color: item.color }} className='shrink-0' />
                  <div className='text-left min-w-0 flex-1'>
                    <p className='text-sm text-gray-900 font-medium'>
                      {item.label}
                    </p>
                    <p className='text-xs text-gray-500 mt-0.5'>{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={18} className='text-gray-300 shrink-0 ml-2' />
              </Button>
            ))}
          </div>
        ))}

        <div className='bg-white rounded-2xl overflow-hidden border border-gray-200'>
          <div className='flex items-center justify-between px-5 pt-4 pb-3'>
            <div className='flex items-center gap-2.5'>
              <Home size={20} className='text-brand-royal' />
              <p className='text-xs text-gray-500 uppercase tracking-widest font-semibold'>ที่อยู่จัดส่ง</p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setShowAddressForm((v) => !v)}
              className='flex items-center gap-1 text-xs font-semibold text-brand-royal hover:text-brand-royal/80 transition-colors'
            >
              <Plus size={16} /> เพิ่ม
            </Button>
          </div>
          {showAddressForm && (
            <div className='px-5 pb-4 flex gap-2 border-t border-gray-200'>
              <Input
                type='text'
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder='กรอกที่อยู่จัดส่ง...'
                className='flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-royal/30 focus:border-transparent'
              />
              <Button
                variant='unstyled'
                type='button'
                onClick={addAddress}
                disabled={addingAddress || !newAddress.trim()}
                className='px-4 py-2.5 text-sm font-semibold text-white rounded-lg bg-brand-royal hover:bg-brand-royal/90 disabled:opacity-50 transition-colors'
              >
                {addingAddress ? '...' : 'บันทึก'}
              </Button>
            </div>
          )}
          {addressesLoading ? (
            <p className='text-xs text-gray-400 text-center py-4'>กำลังโหลด...</p>
          ) : addresses.length === 0 ? (
            <p className='text-xs text-gray-400 text-center py-4'>ยังไม่มีที่อยู่</p>
          ) : (
            <div className='divide-y divide-gray-200'>
              {addresses.map((addr) => (
                <div key={addr.id} className='flex items-start gap-3 px-5 py-4'>
                  <MapPin size={16} className='text-brand-royal mt-0.5 shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-800 capitalize'>{addr.label}</p>
                    <p className='text-xs text-gray-500 mt-0.5 line-clamp-2'>{addr.detail}</p>
                  </div>
                  {addr.isDefault && (
                    <span className='text-xs font-semibold text-brand-royal bg-purple-50 px-2 py-1 rounded-full shrink-0'>
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
          className='w-full flex items-center justify-center gap-2 bg-white rounded-2xl py-4 text-red-600 font-semibold transition-all hover:bg-red-50 active:scale-[0.98] border border-gray-200'
        >
          <LogOut size={18} />
          ออกจากระบบ
        </Button>

        <p className='text-center text-xs text-gray-400 pb-4'>
          ManuConnect v1.0.0 · สมาชิกตั้งแต่ {currentUser.memberSince}
        </p>
      </div>
    </div>
  );
}
