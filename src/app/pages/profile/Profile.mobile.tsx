import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Star,
  Heart,
  FileText,
  Settings,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  MapPin,
  Plus,
  Home,
  ArrowLeftRight,
  Factory,
  Loader2,
  CheckCircle2,
  ReceiptText,
} from 'lucide-react';
import { useData } from '@/stores/useDataStore';
import { useAuth, useAuthStore } from '@/stores/useAuthStore';
import { getAvailableRoles } from '@/services/api/authApi';
import { profileApi } from '@/services/api/userApi';
import { addressesApi } from '@/services/api/masterApi';
import { resolveCustomerAvatarSrc } from '@/utils/customerAvatar';
import { Button } from '@/components/ui/button';
import { formatCurrencyNoDecimals } from '@/utils/formatting/formatCurrency';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';

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
  const { logout, user: authUser } = useAuth();
  const currentUser = data.currentUser;
  const role = String(
    (currentUser as { role?: unknown; user_type?: unknown } | null)?.role ??
      (currentUser as { user_type?: unknown } | null)?.user_type ??
      '',
  ).toUpperCase();
  const isFactory = role === 'FT' || role === 'FACTORY';
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

  const profileAvatarSrc = resolveCustomerAvatarSrc(
    currentUser?.id ?? authUser?.id,
    192,
  );

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
    <div className={isFactory ? 'w-full min-w-0 space-y-4 pb-8' : 'pb-6'}>
      {isFactory ? (
        <FactoryPageHeader
          title='โปรไฟล์'
          subtitle='Factory / โปรไฟล์'
          icon={User}
          variant='minimal'
        />
      ) : (
        <header className='sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-md'>
          <div className='mx-auto max-w-6xl px-4 py-4 lg:px-8'>
            <p className='text-xs font-semibold uppercase tracking-wider text-gray-400'>บัญชี</p>
            <h1 className='text-2xl font-bold text-gray-900 mt-1'>โปรไฟล์</h1>
          </div>
        </header>
      )}

      <div
        className={
          isFactory
            ? 'grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] xl:items-start'
            : 'mx-auto w-full max-w-6xl space-y-5 px-4 pt-6 lg:px-8'
        }
      >
        <div className='w-full rounded-2xl border border-purple-500/30 bg-gradient-to-br from-brand-royal to-purple-600 p-5 shadow-sm'>
          <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-4'>
            <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/40 bg-white/10 sm:h-[4.5rem] sm:w-[4.5rem]'>
              <Image
                src={profileAvatarSrc}
                alt='avatar'
                className='absolute inset-0 h-full w-full object-cover object-center'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-lg font-bold text-white break-words'>{currentUser.name}</p>
              <p className='mt-0.5 text-sm text-white/70 break-words'>{currentUser.company}</p>
              <div className='mt-2 flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1'>
                <CheckCircle2 size={16} className='shrink-0 text-yellow-200' />
                <span className='text-xs font-medium text-white/90'>Verified Member</span>
              </div>
            </div>
          </div>

          <div className='mt-5 grid grid-cols-3 divide-x divide-white/20 rounded-xl border border-white/15 bg-white/10'>
            <div className='min-w-0 px-2 py-3 text-center sm:px-3'>
              <p className='text-lg font-bold text-white tabular-nums'>{completedOrders}</p>
              <p className='mt-0.5 text-xs text-white/70'>คำสั่งซื้อ</p>
            </div>
            <div className='min-w-0 px-2 py-3 text-center sm:px-3'>
              <p className='text-lg font-bold text-white tabular-nums'>4.8</p>
              <p className='mt-0.5 text-xs text-white/70'>คะแนน</p>
            </div>
            <div className='min-w-0 px-2 py-3 text-center sm:px-3'>
              <p className='text-lg font-bold text-white tabular-nums'>
                ฿{(totalSpent / 1000).toFixed(0)}K
              </p>
              <p className='mt-0.5 text-xs text-white/70'>ใช้จ่ายรวม</p>
            </div>
          </div>
        </div>
        {/* Transaction Section */}
        <div className='bg-white rounded-2xl border border-gray-200 overflow-hidden'>
          <div className='flex items-center justify-between px-5 pt-5 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center'>
                <ReceiptText size={18} className='text-brand-royal' />
              </div>
              <p className='text-base font-bold text-gray-900'>ประวัติธุรกรรม</p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              className='inline-flex items-center gap-0.5 text-xs font-semibold text-brand-royal hover:text-brand-royal/80 transition-colors'
              onClick={() => navigate('/profile/transactions')}
            >
              ดูทั้งหมด <ChevronRight size={16} strokeWidth={2.5} />
            </Button>
          </div>

          <div className='px-5 pb-5 space-y-1'>
            {txLoading ? (
              <p className='text-xs text-gray-400 text-center py-6'>กำลังโหลด...</p>
            ) : walletTransactions.length === 0 ? (
              <div className='flex flex-col items-center gap-2 py-8'>
                <ReceiptText size={32} className='text-gray-200' />
                <p className='text-xs text-gray-400'>ยังไม่มีรายการธุรกรรม</p>
              </div>
            ) : (
              walletTransactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between py-3 ${idx < walletTransactions.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft size={15} className='text-green-600' />
                      ) : (
                        <ArrowUpRight size={15} className='text-red-500' />
                      )}
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-800 truncate max-w-[180px]'>
                        {tx.label}
                      </p>
                      <p className='text-[11px] text-gray-400 mt-0.5'>{tx.date}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-bold shrink-0 ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                    }`}
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
            <div className='px-5 py-4 flex gap-2 border-t border-gray-200'>
              <Input
                type='text'
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder='กรอกที่อยู่จัดส่ง...'
                className='flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 shadow-none focus:outline-none focus:ring-2 focus:ring-brand-royal/30 focus:border-transparent'
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

        <p className='pb-4 text-center text-xs text-gray-400'>
          ManuConnect v1.0.0 · สมาชิกตั้งแต่ {currentUser.memberSince}
        </p>
      </div>
    </div>
  );
}
