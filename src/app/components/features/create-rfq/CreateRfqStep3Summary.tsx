/**
 * Step 3: ที่อยู่จัดส่ง + วิธีจัดส่ง + สรุปยืนยัน
 *
 * 1) เลือกที่อยู่จัดส่ง (addresses)
 * 2) เลือกวิธีจัดส่ง (lbi_shipping_methods)
 * 3) สรุปคำขอทั้งหมด
 */
import React from 'react';
import {
  CheckCircle2,
  MapPin,
  Image as ImageIcon,
  Package,
  DollarSign,
  FileText,
  Plus,
  Truck,
} from 'lucide-react';
import type { CreateRfqForm, Unit, Address, ShippingMethod } from './types';
import { CATEGORY_ICONS, SHIPPING_ICONS } from './types';
import { formatCompactNumber, formatCurrency } from '@/utils/formatting';
import { Button } from '../../ui/button';

type CreateRfqStep3SummaryProps = {
  form: CreateRfqForm;
  categoryName: string;
  subCategoryName: string;
  categoryId: string;
  units: Unit[];
  addresses: Address[];
  shippingMethods: ShippingMethod[];
  onUpdate: <K extends keyof CreateRfqForm>(key: K, value: CreateRfqForm[K]) => void;
  onAddAddress?: () => void;
};

export function CreateRfqStep3Summary({
  form,
  categoryName,
  subCategoryName,
  categoryId,
  units,
  addresses,
  shippingMethods,
  onUpdate,
  onAddAddress,
}: CreateRfqStep3SummaryProps) {
  const unitName = units.find((u) => u.id === form.unitId)?.name ?? 'หน่วย';
  const icon = CATEGORY_ICONS[categoryId] ?? '📁';

  return (
    <div className="flex flex-col gap-4">

      {/* ── 1. ที่อยู่จัดส่ง ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <label className="text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-1.5">
          <MapPin size={14} className="text-violet-500" />
          ที่อยู่จัดส่งสินค้า <span className="text-red-400">*</span>
        </label>

        {addresses.length === 0 ? (
          <Button variant="unstyled"
            type="button"
            onClick={onAddAddress}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
              <Plus size={20} className="text-violet-500" />
            </div>
            <span className="text-[13px] font-semibold text-gray-600">เพิ่มที่อยู่จัดส่ง</span>
            <span className="text-[10px] text-gray-400">จำเป็นต้องมีที่อยู่สำหรับจัดส่งสินค้า</span>
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            {addresses.map((addr) => {
              const active = form.addressId === addr.id;
              const label = [
                addr.addressDetail,
                addr.subDistrict,
                addr.district,
                addr.province,
                addr.zipCode,
              ].filter(Boolean).join(', ');
              return (
                <Button variant="unstyled"
                  key={addr.id}
                  type="button"
                  onClick={() => onUpdate('addressId', addr.id)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-100 bg-gray-50/50 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className={`shrink-0 mt-0.5 ${active ? 'text-violet-500' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] leading-relaxed ${active ? 'text-violet-800 font-semibold' : 'text-gray-600'}`}>
                        {label}
                      </p>
                      {addr.isDefault && (
                        <span className="inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                    {active && <CheckCircle2 size={18} className="text-violet-500 shrink-0 mt-0.5" />}
                  </div>
                </Button>
              );
            })}
            {onAddAddress && (
              <Button variant="unstyled"
                type="button"
                onClick={onAddAddress}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-200 text-[12px] font-medium text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <Plus size={14} />
                เพิ่มที่อยู่ใหม่
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── 2. วิธีจัดส่ง (lbi_shipping_methods) ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <label className="text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-1.5">
          <Truck size={14} className="text-violet-500" />
          วิธีจัดส่งที่ต้องการ <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-col gap-1.5">
          {shippingMethods.map((method) => {
            const active = form.shippingMethodId === method.id;
            const mIcon = SHIPPING_ICONS[method.id] ?? '📦';
            return (
              <Button variant="unstyled"
                key={method.id}
                type="button"
                onClick={() => onUpdate('shippingMethodId', method.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  active
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-100 bg-gray-50/50 active:scale-[0.98]'
                }`}
              >
                <span className="text-lg leading-none">{mIcon}</span>
                <span className={`text-[13px] font-medium flex-1 ${
                  active ? 'text-violet-800' : 'text-gray-600'
                }`}>
                  {method.name}
                </span>
                {/* Radio dot */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  active ? 'border-violet-500' : 'border-gray-300'
                }`}>
                  {active && (
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── 3. สรุปคำขอ ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-[13px] font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
          <FileText size={14} className="text-violet-500" />
          สรุปคำขอใบเสนอราคา
        </h3>

        <div className="flex flex-col gap-3">
          {/* Product info */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-2xl leading-none shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-800 line-clamp-2">{form.title || '-'}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {categoryName}
                {subCategoryName && subCategoryName !== '-' && (
                  <span className="text-violet-500"> · {subCategoryName}</span>
                )}
              </p>
            </div>
          </div>

          {/* Quantity + Budget */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Package size={12} className="text-violet-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">จำนวน</span>
              </div>
              <p className="text-[14px] font-bold text-gray-800 tabular-nums">
                {form.quantity ? formatCompactNumber(Number(form.quantity)) : '-'}
                <span className="text-[11px] font-medium text-gray-500 ml-1">{unitName}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">งบ/ชิ้น</span>
              </div>
              <p className="text-[14px] font-bold text-gray-800 tabular-nums">
                {form.budgetPerPiece ? formatCurrency(Number(form.budgetPerPiece), 'THB') : '-'}
              </p>
            </div>
          </div>

          {/* Details */}
          {form.details && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase">รายละเอียด</span>
              <p className="text-[12px] text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">{form.details}</p>
            </div>
          )}

          {/* Images */}
          {form.imageUrls.length > 0 && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <ImageIcon size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">รูปอ้างอิง ({form.imageUrls.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {form.imageUrls.map((url, idx) => (
                  <div key={idx} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    <img src={url} alt={`ref-${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping method */}
          {form.shippingMethodId && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Truck size={12} className="text-violet-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">วิธีจัดส่ง</span>
              </div>
              <p className="text-[12px] font-semibold text-gray-700">
                {SHIPPING_ICONS[form.shippingMethodId] ?? '📦'}{' '}
                {shippingMethods.find((m) => m.id === form.shippingMethodId)?.name ?? '-'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Info banner ── */}
      <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl flex items-start gap-3">
        <CheckCircle2 className="text-violet-500 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-[12px] text-violet-900 font-semibold">
            คำขอของคุณจะถูกส่งไปยังโรงงานที่ตรงกับประเภทย่อยที่เลือก
          </p>
          <p className="text-[11px] text-violet-700 mt-0.5">
            คุณจะได้รับใบเสนอราคาจากโรงงานที่เชี่ยวชาญ เพื่อเปรียบเทียบ ภายใน 1-3 วันทำการ
          </p>
        </div>
      </div>
    </div>
  );
}
