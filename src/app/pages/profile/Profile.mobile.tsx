import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight,
  Shield,
  HelpCircle,
  LogOut,
  Star,
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
import { parseWalletTransaction, type WalletTransactionView } from '@/utils/walletTransaction';

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
      className='flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-3 text-sm font-semibold text-brand-indigo transition-all hover:bg-indigo-50 active:scale-[0.98] disabled:opacity-60'
    >
      {switching ? <Loader2 size={18} className='animate-spin' /> : <ArrowLeftRight size={18} />}
      สลับเป็นบัญชี{targetLabel}
      <TargetIcon size={16} className='opacity-70' />
    </Button>
  );
}

function mapAddressTypeLabel(type: string): string {
  switch (type.toUpperCase()) {
    case 'S': return 'ที่อยู่จัดส่ง';
    case 'B': return 'ที่อยู่ออกใบกำกับ';
    case 'H': return 'บ้าน';
    case 'W': return 'ที่ทำงาน';
    default: return type || 'ที่อยู่';
  }
}

function buildFullAddress(r: Record<string, unknown>): string {
  const parts = [
    String(r.address_detail ?? r.detail ?? ''),
    String(r.sub_district_name ?? ''),
    String(r.district_name ?? ''),
    String(r.province_name ?? ''),
    String(r.zip_code ?? ''),
  ].filter(Boolean);
  return parts.join(' ');
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
  const isCustomer = role === 'CT' || role === 'CUSTOMER';
  const completedOrders = data.orders.filter((o) => o.status === 'completed').length;
  const totalSpent = data.orders.reduce((s, o) => s + o.depositPaid, 0);

  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionView[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  type Address = { id: string; label: string; detail: string; fullAddress: string; isDefault: boolean };
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
            label: mapAddressTypeLabel(String(r.address_type ?? r.label ?? '')),
            detail: String(r.address_detail ?? r.detail ?? ''),
            fullAddress: buildFullAddress(r),
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
              label: mapAddressTypeLabel(String(r.address_type ?? r.label ?? '')),
              detail: String(r.address_detail ?? r.detail ?? ''),
              fullAddress: buildFullAddress(r),
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
            .map((row) => parseWalletTransaction(row, isCustomer))
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
      <div className='flex min-h-[60vh] items-center justify-center bg-[var(--brand-page)]'>
        <p className='text-sm text-gray-400'>กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className='min-h-[100dvh] bg-[var(--brand-page)] pb-20 lg:min-h-0 lg:pb-8'>
      {/* Mobile title */}
      <div className='border-b border-gray-100 bg-white lg:hidden'>
        <div className='px-4 pt-3 pb-2'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
            บัญชี
          </p>
          <h1 className='text-lg font-bold leading-tight text-[var(--brand-navy)]'>โปรไฟล์</h1>
        </div>
      </div>

      {/* Desktop title */}
      <header className='sticky top-0 z-20 hidden border-b border-gray-100 bg-white lg:block'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-3 px-8 py-4 2xl:px-10'>
          <div className='min-w-0'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange-deep)]'>
              บัญชี
            </p>
            <h1 className='text-lg font-bold leading-tight text-[var(--brand-navy)]'>โปรไฟล์</h1>
          </div>
        </div>
      </header>

      <div className='mx-auto w-full max-w-6xl space-y-3 px-4 pt-3 lg:space-y-4 lg:px-8 lg:pt-6 2xl:px-10'>
        <div className='rounded-xl border border-gray-100 bg-white px-4 py-3'>
          <div className='flex items-center gap-3'>
            <div className='relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-[var(--brand-lavender)]'>
              <Image
                src={profileAvatarSrc}
                alt='avatar'
                className='absolute inset-0 h-full w-full object-cover object-center'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1.5'>
                <p className='truncate text-sm font-bold text-[var(--brand-navy)]'>
                  {currentUser.name}
                </p>
                <CheckCircle2 size={14} className='shrink-0 text-brand-orange' />
              </div>
              <p className='truncate text-xs text-gray-500'>{currentUser.company}</p>
            </div>
          </div>

          <div className='mt-3 grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-3'>
            <div className='min-w-0 px-1 text-center'>
              <p className='text-sm font-bold tabular-nums text-[var(--brand-navy)]'>
                {completedOrders}
              </p>
              <p className='mt-0.5 text-[10px] text-gray-400'>คำสั่งซื้อ</p>
            </div>
            <div className='min-w-0 px-1 text-center'>
              <p className='text-sm font-bold tabular-nums text-[var(--brand-navy)]'>4.8</p>
              <p className='mt-0.5 text-[10px] text-gray-400'>คะแนน</p>
            </div>
            <div className='min-w-0 px-1 text-center'>
              <p className='text-sm font-bold tabular-nums text-[var(--brand-navy)]'>
                ฿{(totalSpent / 1000).toFixed(0)}K
              </p>
              <p className='mt-0.5 text-[10px] text-gray-400'>ใช้จ่ายรวม</p>
            </div>
          </div>
        </div>

        <div className='overflow-hidden rounded-xl border border-gray-100 bg-white'>
          <div className='flex items-center justify-between border-b border-gray-100 px-4 py-3'>
            <div className='flex items-center gap-2'>
              <ReceiptText size={16} className='shrink-0 text-brand-violet-deep' />
              <p className='text-sm font-bold text-[var(--brand-navy)]'>ประวัติธุรกรรม</p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              className='inline-flex items-center gap-0.5 text-xs font-semibold text-brand-violet-deep transition-colors hover:text-brand-violet-deep/80'
              onClick={() => navigate('/profile/transactions')}
            >
              ดูทั้งหมด <ChevronRight size={14} strokeWidth={2.5} />
            </Button>
          </div>

          <div className='px-4 pb-3'>
            {txLoading ? (
              <p className='py-5 text-center text-xs text-gray-400'>กำลังโหลด...</p>
            ) : walletTransactions.length === 0 ? (
              <div className='flex flex-col items-center gap-2 py-6'>
                <ReceiptText size={28} className='text-gray-200' />
                <p className='text-xs text-gray-400'>ยังไม่มีรายการธุรกรรม</p>
              </div>
            ) : (
              walletTransactions.map((tx, idx) => {
                const rowClass = `flex items-center justify-between py-2.5 ${idx < walletTransactions.length - 1 ? 'border-b border-gray-100' : ''}`;

                if (tx.isOrderHistory) {
                  const content = (
                    <div className='flex w-full items-center justify-between gap-2 text-left'>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-left text-sm text-gray-800'>{tx.label}</p>
                        <p className='mt-0.5 text-left text-[10px] text-gray-400'>{tx.date}</p>
                      </div>
                      <div className='flex shrink-0 items-center gap-1'>
                        {tx.amount > 0 && (
                          <p
                            className={`whitespace-nowrap text-sm font-semibold tabular-nums ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}
                          >
                            {tx.type === 'credit' ? '+' : '-'}
                            {formatCurrencyNoDecimals(tx.amount)}
                          </p>
                        )}
                        {tx.orderHref ? (
                          <ChevronRight size={16} className='text-gray-300' />
                        ) : null}
                      </div>
                    </div>
                  );

                  return tx.orderHref ? (
                    <Button
                      key={tx.id}
                      variant='unstyled'
                      type='button'
                      className={`${rowClass} w-full text-left transition-colors hover:bg-gray-50`}
                      onClick={() => navigate(tx.orderHref!)}
                    >
                      {content}
                    </Button>
                  ) : (
                    <div key={tx.id} className={rowClass}>
                      {content}
                    </div>
                  );
                }

                return (
                  <div key={tx.id} className={rowClass}>
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft size={13} className='text-green-600' />
                        ) : (
                          <ArrowUpRight size={13} className='text-red-500' />
                        )}
                      </div>
                      <div className='min-w-0'>
                        <p className='max-w-[180px] truncate text-sm font-medium text-gray-800'>
                          {tx.label}
                        </p>
                        <p className='mt-0.5 text-[10px] text-gray-400'>{tx.date}</p>
                      </div>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatCurrencyNoDecimals(tx.amount)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {menuSections.map((section, sectionIndex) => (
          <div
            key={section.title ?? `section-${sectionIndex}`}
            className='overflow-hidden rounded-xl border border-gray-100 bg-white'
          >
            {section.title ? (
              <p className='px-4 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                {section.title}
              </p>
            ) : null}
            {section.items.map((item, idx) => (
              <Button
                variant='unstyled'
                key={item.label}
                type='button'
                className={`flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 ${idx > 0 ? 'border-t border-gray-100' : ''}`}
                onClick={() => {
                  if (item.to) navigate(item.to);
                }}
              >
                <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                  <item.icon size={18} style={{ color: item.color }} className='shrink-0' />
                  <div className='min-w-0 flex-1 text-left'>
                    <p className='text-sm font-medium text-gray-900'>{item.label}</p>
                    <p className='mt-0.5 text-[11px] text-gray-400'>{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={16} className='ml-2 shrink-0 text-gray-300' />
              </Button>
            ))}
          </div>
        ))}

        <div className='overflow-hidden rounded-xl border border-gray-100 bg-white'>
          <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center gap-2'>
              <Home size={16} className='text-brand-violet-deep' />
              <p className='text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                ที่อยู่จัดส่ง
              </p>
            </div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setShowAddressForm((v) => !v)}
              className='flex items-center gap-1 text-xs font-semibold text-brand-violet-deep transition-colors hover:text-brand-violet-deep/80'
            >
              <Plus size={14} /> เพิ่ม
            </Button>
          </div>
          {showAddressForm && (
            <div className='flex gap-2 border-t border-gray-100 px-4 py-3'>
              <Input
                type='text'
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder='กรอกที่อยู่จัดส่ง...'
                className='flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-none focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-violet-deep/30'
              />
              <Button
                variant='unstyled'
                type='button'
                onClick={addAddress}
                disabled={addingAddress || !newAddress.trim()}
                className='rounded-lg bg-brand-violet-deep px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-violet-deep/90 disabled:opacity-50'
              >
                {addingAddress ? '...' : 'บันทึก'}
              </Button>
            </div>
          )}
          {addressesLoading ? (
            <p className='py-4 text-center text-xs text-gray-400'>กำลังโหลด...</p>
          ) : addresses.length === 0 ? (
            <p className='py-4 text-center text-xs text-gray-400'>ยังไม่มีที่อยู่</p>
          ) : (
            <div className='divide-y divide-gray-100'>
              {addresses.map((addr) => (
                <div key={addr.id} className='flex items-start gap-2.5 px-4 py-3'>
                  <MapPin size={14} className='mt-0.5 shrink-0 text-brand-violet-deep' />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-gray-800'>{addr.label}</p>
                    <p className='mt-0.5 line-clamp-2 text-[11px] text-gray-400'>{addr.fullAddress || addr.detail}</p>
                  </div>
                  {addr.isDefault && (
                    <span className='shrink-0 rounded-md border border-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-brand-violet-deep'>
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
          className='flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]'
        >
          <LogOut size={16} />
          ออกจากระบบ
        </Button>

        <p className='pb-2 text-center text-[10px] text-gray-400'>
          ManuConnect v1.0.0 · สมาชิกตั้งแต่ {currentUser.memberSince}
        </p>
      </div>
    </div>
  );
}
