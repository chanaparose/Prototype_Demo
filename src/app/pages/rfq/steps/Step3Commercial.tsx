import { Input } from '@/components/ui/input';
import {
  RFQ_BORDER,
  RFQ_FIELD_CLASS,
  RFQ_HELP_CLASS,
  RFQ_LABEL_CLASS,
  RFQ_RADIUS,
  rfqChoiceClass,
} from '@/pages/rfq/rfqCreateWizardUi';

import React from 'react';
import { Building2, CheckCircle2, LogIn, MapPin, Package, Plus, Truck } from 'lucide-react';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
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

const SHIPPING_ICONS = {
  1: Building2,
  2: Truck,
  3: Package,
  4: Truck,
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
  const { open: openLoginModal } = useAuthModalStore();

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

  // ── Load shipping methods — ทำงานทั้ง guest และ logged-in (endpoint ไม่ต้อง auth) ──
  React.useEffect(() => {
    let active = true;
    void masterApi
      .getShippingMethods()
      .then((raw) => {
        if (!active) return;
        const normalized = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as Record<string, unknown>)?.data)
            ? ((raw as Record<string, unknown>).data as unknown[])
            : [];
        const mapped = mapShippingMethodsList(normalized);
        if (mapped.length > 0) {
          setShippingMethods(mapped);
          onLoadedRef.current?.(
            {},
            Object.fromEntries(mapped.map((m) => [m.id, m.name])),
          );
        }
      })
      .catch(() => {
        if (active) setShippingMethods(FALLBACK_SHIPPING);
      });
    return () => { active = false; };
  }, []);

  // ── Load addresses (logged-in only) ──
  React.useEffect(() => {
    if (isGuest) return;

    let active = true;
    void loadAddresses().then((mapped) => {
      if (!active) return;
      const addressMapResult = Object.fromEntries(
        mapped.map((a) => {
          const label = [a.addressDetail, a.subDistrict, a.district, a.province, a.zipCode]
            .filter(Boolean)
            .join(', ');
          return [a.id, label || `ที่อยู่ #${a.id}`];
        }),
      );
      onLoadedRef.current?.(addressMapResult, {});

      if (autoSelected.current || draft.delivery_address_id) return;
      const def = mapped.find((a) => a.isDefault) ?? mapped[0];
      if (def) {
        setDraft({ delivery_address_id: def.id });
        autoSelected.current = true;
      }
    });
    return () => { active = false; };
  }, [isGuest, loadAddresses, setDraft]);

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
    <div className='grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]'>
      <div className='min-w-0'>
        <p className={`mb-2 flex items-center gap-1.5 text-gray-700 ${RFQ_LABEL_CLASS}`}>
          <MapPin size={14} className='text-brand-violet-deep' />
          ที่อยู่จัดส่งสินค้า <span className='text-red-400 ml-0.5'>*</span>
        </p>

        {isGuest ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => openLoginModal('/create-rfq')}
            className={`flex w-full items-center gap-3 ${RFQ_RADIUS} border-[0.5px] border-dashed border-brand-violet-soft bg-white px-4 py-4 text-left transition-all hover:bg-brand-violet-soft/60 active:scale-[0.99]`}
          >
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-lavender-chip'>
              <LogIn size={18} className='text-brand-violet-deep' />
            </div>
            <div>
              <p className='text-sm font-semibold text-brand-violet-deep xl:text-[15px] 2xl:text-base'>ล็อกอินเพื่อเลือกที่อยู่จัดส่ง</p>
              <p className='text-xs text-brand-purple/70 mt-0.5 xl:text-[13px]'>
                กรอกข้อมูลสินค้าได้เลย — ระบุที่อยู่ได้หลังจากล็อกอิน
              </p>
            </div>
          </Button>
        ) : addrLoading ? (
          <div className='space-y-2'>
            <div className={`h-14 ${RFQ_RADIUS} bg-gray-100 animate-pulse`} />
            <div className={`h-14 ${RFQ_RADIUS} bg-gray-100 animate-pulse opacity-50`} />
          </div>
        ) : addresses.length === 0 ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setModalOpen(true)}
            className={`w-full ${RFQ_RADIUS} border-[0.5px] border-dashed border-gray-200 p-5 flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all`}
          >
            <div className='w-10 h-10 rounded-full bg-brand-violet-soft flex items-center justify-center'>
              <Plus size={20} className='text-brand-violet-deep' />
            </div>
            <span className='text-[13px] font-semibold text-gray-600 xl:text-[15px]'>เพิ่มที่อยู่จัดส่ง</span>
            <span className='text-[10px] text-gray-400 xl:text-[12px]'>จำเป็นต้องมีที่อยู่สำหรับจัดส่งสินค้า</span>
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
                  className={`w-full p-3.5 text-left active:scale-[0.98] ${rfqChoiceClass(active)}`}
                >
                  <div className='flex items-start gap-2.5'>
                    <MapPin
                      size={15}
                      className={`shrink-0 mt-0.5 ${active ? 'text-brand-violet-deep' : 'text-gray-400'}`}
                    />
                    <div className='flex-1 min-w-0'>
                      <p
                        className={`text-[12px] leading-relaxed xl:text-sm ${active ? 'text-brand-violet-deep font-semibold' : 'text-gray-600'}`}
                      >
                        {label}
                      </p>
                      {addr.isDefault && (
                        <span className='inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-brand-lavender-chip text-brand-violet-deep xl:text-[10px]'>
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                    {active && (
                      <CheckCircle2 size={17} className='text-brand-violet-deep shrink-0 mt-0.5' />
                    )}
                  </div>
                </Button>
              );
            })}
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setModalOpen(true)}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 ${RFQ_RADIUS} border-[0.5px] border-dashed border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all xl:text-sm`}
            >
              <Plus size={14} />
              เพิ่มที่อยู่ใหม่
            </Button>
          </div>
        )}
      </div>

      <div className='min-w-0'>
        <p className={`mb-2 flex items-center gap-1.5 text-gray-700 ${RFQ_LABEL_CLASS}`}>
          <Truck size={14} className='text-brand-violet-deep' />
          วิธีจัดส่งที่ต้องการ <span className='text-red-400 ml-0.5'>*</span>
        </p>
        <p className={`mb-2 text-gray-400 ${RFQ_HELP_CLASS}`}>
          โรงงานจะเห็นข้อมูลนี้เพื่อออกใบเสนอราคาที่ถูกต้อง
        </p>
        <div className='flex flex-col gap-1.5'>
          {shippingMethods.map((method) => {
            const active = draft.shipping_method_id === method.id;
            const ShippingIcon = SHIPPING_ICONS[method.id as keyof typeof SHIPPING_ICONS] ?? Package;
            return (
              <Button
                variant='unstyled'
                key={method.id}
                type='button'
                onClick={() => setDraft({ shipping_method_id: method.id })}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left active:scale-[0.98] ${rfqChoiceClass(active)}`}
              >
                <ShippingIcon size={18} className='shrink-0 text-brand-violet-deep' />
                <span
                  className={`text-[13px] font-medium flex-1 xl:text-[15px] ${active ? 'text-brand-violet-deep' : 'text-gray-600'}`}
                >
                  {method.name}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active ? 'border-brand-violet-deep' : 'border-gray-300'}`}
                >
                  {active && <div className='w-2.5 h-2.5 rounded-full bg-brand-violet-deep' />}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      <div className='lg:col-span-2'>
        <p className={`mb-2 text-gray-700 ${RFQ_LABEL_CLASS}`}>ระยะเวลาผลิตที่ต้องการ (วัน)</p>
        <Input
          type='number'
          min={1}
          value={draft.target_lead_time_days ?? ''}
          onChange={(e) => setDraft({ target_lead_time_days: Number(e.target.value) || undefined })}
          placeholder='ระยะเวลาผลิตที่ต้องการ (วัน)'
          className={RFQ_FIELD_CLASS}
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
