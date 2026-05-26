import { Input } from '@/components/ui/input';

import React from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, LogIn, MapPin, Plus, Truck } from 'lucide-react';
import { addressesApi, masterApi } from '@/services/api/masterApi';
import { mapAddressFromApi, type MappedAddress } from '@/domain/shared/mappers/mapAddressFromApi';
import { mapShippingMethodsList } from '@/domain/master/mappers/mapShippingMethod';
import { AddressFormModal, type AddressFormPayload } from '@/components/factory/AddressFormModal';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import { Button } from '@/components/ui/button';

type ShippingMethod = {
  id: number;
  name: string;
};

const SHIPPING_ICONS: Record<number, string> = {
  1: '🏭',
  2: '🚚',
  3: '📦',
  4: '🚛',
};

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
  onLoaded?: (addressMap: Record<number, string>, shippingMap: Record<number, string>) => void;
  isGuest?: boolean;
};

const FALLBACK_SHIPPING: ShippingMethod[] = [
  { id: 1, name: 'ลูกค้ารับเองที่โรงงาน' },
  { id: 2, name: 'ขนส่งเอกชน' },
  { id: 3, name: 'ขนส่งหมู่บ้าน / ไปรษณีย์' },
  { id: 4, name: 'รถบรรทุกโรงงาน' },
];

export function Step3Commercial({ draft, setDraft, onLoaded, isGuest = false }: Readonly<Props>) {
  const navigate = useNavigate();

  /* addresses */
  const [addresses, setAddresses] = React.useState<MappedAddress[]>([]);
  const [addrLoading, setAddrLoading] = React.useState(!isGuest);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const autoSelected = React.useRef(false);

  const [shippingMethods, setShippingMethods] = React.useState<ShippingMethod[]>(FALLBACK_SHIPPING);

  const onLoadedRef = React.useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const loadAddresses = React.useCallback(async (): Promise<MappedAddress[]> => {
    setAddrLoading(true);
    try {
      const raw = await addressesApi.list();
      const arr = (
        Array.isArray(raw)
          ? raw
          : Array.isArray((raw as Record<string, unknown>)?.data)
            ? ((raw as Record<string, unknown>).data as unknown[])
            : []
      ) as Record<string, unknown>[];
      const mapped = arr.map(mapAddressFromApi).filter((a): a is MappedAddress => a != null);
      setAddresses(mapped);
      return mapped;
    } catch {
      setAddresses([]);
      return [];
    } finally {
      setAddrLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Guests don't have addresses — skip API call entirely
    if (isGuest) return;

    let shippingMapResult: Record<number, string> = {};
    let addressMapResult: Record<number, string> = {};

    // โหลด addresses + auto-select default
    void loadAddresses().then((mapped) => {
      addressMapResult = Object.fromEntries(
        mapped.map((a) => {
          const label = [a.addressDetail, a.subDistrict, a.district, a.province, a.zipCode]
            .filter(Boolean)
            .join(', ');
          return [a.id, label || `ที่อยู่ #${a.id}`];
        }),
      );
      onLoadedRef.current?.(addressMapResult, shippingMapResult);

      if (autoSelected.current || draft.delivery_address_id) return;
      const def = mapped.find((a) => a.isDefault) ?? mapped[0];
      if (def) {
        setDraft({ delivery_address_id: def.id });
        autoSelected.current = true;
      }
    });

    void masterApi
      .getShippingMethods()
      .then((raw) => {
        const normalized = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as Record<string, unknown>)?.data)
            ? ((raw as Record<string, unknown>).data as unknown[])
            : [];
        const mapped = mapShippingMethodsList(normalized);
        if (mapped.length > 0) setShippingMethods(mapped);
        shippingMapResult = Object.fromEntries(mapped.map((m) => [m.id, m.name]));
        onLoadedRef.current?.(addressMapResult, shippingMapResult);
      })
      .catch(() => {
        setShippingMethods(FALLBACK_SHIPPING);
      });
  }, [loadAddresses, setDraft]);

  const handleAddAddress = React.useCallback(
    async (payload: AddressFormPayload) => {
      setSaving(true);
      try {
        const created = await addressesApi.create(payload);
        if (!created || typeof created !== 'object') {
          throw new Error('Invalid API response from address creation');
        }
        const createdId = Number(
          (created as Record<string, unknown>).address_id ??
            (created as Record<string, unknown>).id ??
            0,
        );
        const latest = await loadAddresses();
        const selectId =
          (createdId > 0 ? createdId : null) ??
          latest.find((a) => a.isDefault)?.id ??
          latest[latest.length - 1]?.id ??
          0;
        if (selectId > 0) setDraft({ delivery_address_id: selectId });
        setModalOpen(false);
      } finally {
        setSaving(false);
      }
    },
    [loadAddresses, setDraft],
  );

  return (
    <div className='space-y-5'>
      <div>
        <p className='text-[13px] font-bold text-gray-700 mb-2 flex items-center gap-1.5'>
          <MapPin size={14} className='text-violet-500' />
          ที่อยู่จัดส่งสินค้า <span className='text-red-400 ml-0.5'>*</span>
        </p>

        {isGuest ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate('/login?redirect=/create-rfq')}
            className='flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/60 px-4 py-4 text-left transition-all hover:bg-violet-50 active:scale-[0.99]'
          >
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100'>
              <LogIn size={18} className='text-violet-500' />
            </div>
            <div>
              <p className='text-sm font-semibold text-violet-700'>ล็อกอินเพื่อเลือกที่อยู่จัดส่ง</p>
              <p className='text-xs text-violet-500 mt-0.5'>
                กรอกข้อมูลสินค้าได้เลย — ระบุที่อยู่ได้หลังจากล็อกอิน
              </p>
            </div>
          </Button>
        ) : addrLoading ? (
          <div className='space-y-2'>
            <div className='h-14 rounded-xl bg-gray-100 animate-pulse' />
            <div className='h-14 rounded-xl bg-gray-100 animate-pulse opacity-50' />
          </div>
        ) : addresses.length === 0 ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setModalOpen(true)}
            className='w-full border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all'
          >
            <div className='w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center'>
              <Plus size={20} className='text-violet-500' />
            </div>
            <span className='text-[13px] font-semibold text-gray-600'>เพิ่มที่อยู่จัดส่ง</span>
            <span className='text-[10px] text-gray-400'>จำเป็นต้องมีที่อยู่สำหรับจัดส่งสินค้า</span>
          </Button>
        ) : (
          <div className='flex flex-col gap-2'>
            {addresses.map((addr) => {
              const active = draft.delivery_address_id === addr.id;
              const label = [
                addr.addressDetail,
                addr.subDistrict,
                addr.district,
                addr.province,
                addr.zipCode,
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <Button
                  variant='unstyled'
                  key={addr.id}
                  type='button'
                  onClick={() => setDraft({ delivery_address_id: addr.id })}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 active:scale-[0.98]'
                  }`}
                >
                  <div className='flex items-start gap-2.5'>
                    <MapPin
                      size={15}
                      className={`shrink-0 mt-0.5 ${active ? 'text-violet-500' : 'text-gray-400'}`}
                    />
                    <div className='flex-1 min-w-0'>
                      <p
                        className={`text-[12px] leading-relaxed ${active ? 'text-violet-800 font-semibold' : 'text-gray-600'}`}
                      >
                        {label}
                      </p>
                      {addr.isDefault && (
                        <span className='inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600'>
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                    {active && (
                      <CheckCircle2 size={17} className='text-violet-500 shrink-0 mt-0.5' />
                    )}
                  </div>
                </Button>
              );
            })}
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setModalOpen(true)}
              className='w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all'
            >
              <Plus size={14} />
              เพิ่มที่อยู่ใหม่
            </Button>
          </div>
        )}
      </div>

      <div>
        <p className='text-[13px] font-bold text-gray-700 mb-2 flex items-center gap-1.5'>
          <Truck size={14} className='text-violet-500' />
          วิธีจัดส่งที่ต้องการ <span className='text-red-400 ml-0.5'>*</span>
        </p>
        <p className='text-[11px] text-gray-400 mb-2'>
          โรงงานจะเห็นข้อมูลนี้เพื่อออกใบเสนอราคาที่ถูกต้อง
        </p>
        <div className='flex flex-col gap-1.5'>
          {shippingMethods.map((method) => {
            const active = draft.shipping_method_id === method.id;
            return (
              <Button
                variant='unstyled'
                key={method.id}
                type='button'
                onClick={() => setDraft({ shipping_method_id: method.id })}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  active
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 active:scale-[0.98]'
                }`}
              >
                <span className='text-lg leading-none shrink-0'>
                  {SHIPPING_ICONS[method.id] ?? '📦'}
                </span>
                <span
                  className={`text-[13px] font-medium flex-1 ${active ? 'text-violet-800' : 'text-gray-600'}`}
                >
                  {method.name}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active ? 'border-violet-500' : 'border-gray-300'}`}
                >
                  {active && <div className='w-2.5 h-2.5 rounded-full bg-violet-500' />}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <p className='text-[13px] font-bold text-gray-700 mb-2'>ระยะเวลาผลิตที่ต้องการ (วัน)</p>
        <Input
          type='number'
          min={1}
          value={draft.target_lead_time_days ?? ''}
          onChange={(e) => setDraft({ target_lead_time_days: Number(e.target.value) || undefined })}
          placeholder='ระยะเวลาผลิตที่ต้องการ (วัน)'
          className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
        />
      </div>

      <AddressFormModal
        open={modalOpen}
        mode='create'
        saving={saving}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        onSubmit={handleAddAddress}
      />
    </div>
  );
}
