import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ExternalLink,
  Loader2,
  Package,
  User,
} from 'lucide-react';
import { adminApi } from '@/services/api/adminApi';
import type { IAdminOrderDetailResponse } from '@/services/api/types/admin.types';
import { getAdminOrderStatusMeta } from '@/domain/admin/adminOrderStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatting/formatDate';
import { pickScalarNumber, pickScalarString } from '@/utils/pickScalarString';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function money(value: unknown): number {
  return pickScalarNumber(value) ?? 0;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='py-3 border-b border-slate-50 last:border-0 flex justify-between gap-4'>
      <span className='text-xs text-slate-400 font-medium uppercase tracking-wide shrink-0'>
        {label}
      </span>
      <span className='text-sm text-slate-900 text-right'>{value ?? '—'}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  color = 'slate',
}: {
  label: string;
  value: string;
  hint?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'slate' | 'violet';
}) {
  const border: Record<string, string> = {
    indigo: 'border-purple-200 bg-purple-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
    slate: 'border-slate-200 bg-slate-50',
    violet: 'border-violet-200 bg-violet-50',
  };
  const text: Record<string, string> = {
    indigo: 'text-purple-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    slate: 'text-slate-700',
    violet: 'text-violet-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${border[color] ?? border.slate}`}>
      <p className='text-xs text-slate-500 font-medium mb-1'>{label}</p>
      <p className={`text-lg font-bold tabular-nums ${text[color] ?? text.slate}`}>{value}</p>
      {hint ? <p className='text-[11px] text-slate-400 mt-1'>{hint}</p> : null}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className='rounded-xl border border-slate-200 bg-white'>
      <div className='flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100'>
        <div className='flex items-center gap-2'>
          {icon}
          <h3 className='text-sm font-semibold text-slate-900'>{title}</h3>
        </div>
        {action}
      </div>
      <div className='px-4 py-2'>{children}</div>
    </section>
  );
}

function formatAddress(addr: Record<string, unknown> | null): string {
  if (!addr) return '—';
  const parts = [
    pickScalarString(addr.address_detail),
    pickScalarString(addr.sub_district_name),
    pickScalarString(addr.district_name),
    pickScalarString(addr.province_name),
    pickScalarString(addr.zip_code),
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<IAdminOrderDetailResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    adminApi
      .getOrder(id)
      .then((res) => {
        if (!cancelled) setDetail(res as IAdminOrderDetailResponse);
      })
      .catch((e) => {
        if (!cancelled) {
          setDetail(null);
          setError(e instanceof Error ? e.message : 'โหลดรายละเอียดออเดอร์ไม่สำเร็จ');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-24 text-slate-400 gap-2'>
        <Loader2 className='w-5 h-5 animate-spin' />
        <span className='text-sm'>กำลังโหลดออเดอร์...</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className='space-y-4'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800'
        >
          <ChevronLeft size={16} /> กลับ
        </Button>
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2'>
          <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          <span>{error || 'ไม่พบออเดอร์'}</span>
        </div>
      </div>
    );
  }

  const statusCode = pickScalarString(detail.status);
  const statusMeta = getAdminOrderStatusMeta(statusCode);
  const finance = asRecord(detail.admin_finance);
  const factory = asRecord(detail.factory);
  const rfq = asRecord(detail.rfq);
  const quotation = asRecord(detail.quotation);
  const rfqAddress = asRecord(rfq.address);
  const schedule = Array.isArray(detail.payment_schedule) ? detail.payment_schedule : [];

  const grandTotal = money(finance.grand_total ?? detail.total_amount);
  const commissionAmount = money(finance.platform_commission_amount);
  const commissionRate = money(finance.platform_commission_rate);
  const factoryNet = money(finance.factory_net_receivable);
  const vatAmount = money(finance.vat_amount);
  const vatRate = money(finance.vat_rate);
  const trylyShare = commissionAmount;

  const factoryId = pickScalarNumber(factory.factory_id ?? detail.factory_id) ?? 0;
  const customerId = pickScalarNumber(detail.customer_user_id ?? detail.user_id) ?? 0;
  const rfqTitle = pickScalarString(rfq.title, `Order #${detail.order_id}`);

  return (
    <div className='space-y-6 lg:space-y-8'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => navigate(-1)}
            className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2'
          >
            <ChevronLeft size={16} /> กลับ
          </Button>
          <div className='flex flex-wrap items-center gap-3'>
            <h2 className='text-2xl lg:text-3xl font-bold text-slate-900 font-mono'>
              #{detail.order_id}
            </h2>
            <Badge variant={statusMeta.variant as any} size='sm'>
              {pickScalarString(detail.status_label_th) || statusMeta.label}
            </Badge>
            <span className='text-xs font-mono text-slate-400'>{statusCode}</span>
          </div>
          <p className='text-sm text-slate-500 mt-1'>{rfqTitle}</p>
        </div>
        <div className='text-right text-xs text-slate-400 space-y-0.5'>
          <p>สร้างเมื่อ {formatDateTime(pickScalarString(detail.created_at))}</p>
          <p>อัปเดตล่าสุด {formatDateTime(pickScalarString(detail.updated_at))}</p>
        </div>
      </div>

      {/* Super-admin finance — not shown to factory */}
      <div>
        <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3'>
          สรุปการเงิน (Super Admin)
        </p>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            label='ยอดชำระรวม (Grand Total)'
            value={formatCurrency(grandTotal)}
            color='indigo'
          />
          <StatCard
            label='รายได้ Tryly (Commission)'
            value={formatCurrency(trylyShare)}
            hint={
              commissionRate > 0
                ? `อัตรา ${commissionRate % 1 === 0 ? commissionRate : commissionRate.toFixed(2)}%`
                : 'ยกเว้นค่าคอมมิชชัน'
            }
            color='emerald'
          />
          <StatCard
            label='โรงงานได้รับ (Net)'
            value={formatCurrency(factoryNet)}
            hint='หลังหักค่าคอมมิชชันแพลตฟอร์ม'
            color='amber'
          />
          <StatCard
            label='VAT'
            value={formatCurrency(vatAmount)}
            hint={vatRate > 0 ? `อัตรา ${vatRate}%` : undefined}
            color='violet'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6'>
        <Section
          title='ลูกค้า'
          icon={<User className='w-4 h-4 text-slate-400' />}
          action={
            customerId > 0 ? (
              <Link
                to={`/admin/customers/${customerId}`}
                className='inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline'
              >
                ดูโปรไฟล์ <ExternalLink size={12} />
              </Link>
            ) : null
          }
        >
          <InfoRow label='ชื่อ' value={pickScalarString(detail.customer_name, '—')} />
          <InfoRow label='โทรศัพท์' value={pickScalarString(detail.customer_phone, '—')} />
          <InfoRow label='User ID' value={customerId > 0 ? `#${customerId}` : '—'} />
        </Section>

        <Section
          title='โรงงาน'
          icon={<Building2 className='w-4 h-4 text-slate-400' />}
          action={
            factoryId > 0 ? (
              <Link
                to={`/admin/factories/${factoryId}`}
                className='inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline'
              >
                ดูโปรไฟล์ <ExternalLink size={12} />
              </Link>
            ) : null
          }
        >
          <InfoRow label='ชื่อ' value={pickScalarString(factory.name, '—')} />
          <InfoRow label='โทรศัพท์' value={pickScalarString(factory.phone, '—')} />
          <InfoRow label='ที่อยู่ / จังหวัด' value={pickScalarString(factory.address, '—')} />
          <InfoRow label='Factory ID' value={factoryId > 0 ? `#${factoryId}` : '—'} />
        </Section>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6'>
        <Section title='RFQ' icon={<Package className='w-4 h-4 text-slate-400' />}>
          <InfoRow label='หัวข้อ' value={rfqTitle} />
          <InfoRow label='RFQ ID' value={rfq.rfq_id != null ? `#${rfq.rfq_id}` : '—'} />
          <InfoRow
            label='จำนวน'
            value={
              rfq.quantity != null
                ? `${pickScalarString(rfq.quantity)}${pickScalarString(rfq.unit_name) ? ` ${rfq.unit_name}` : ''}`
                : '—'
            }
          />
          <InfoRow label='หมวดหมู่' value={pickScalarString(rfq.category_name, '—')} />
          <InfoRow label='หมวดย่อย' value={pickScalarString(rfq.sub_category_name, '—')} />
          <InfoRow label='ที่อยู่จัดส่ง' value={formatAddress(rfqAddress)} />
          {pickScalarString(rfq.details) ? (
            <div className='py-3'>
              <p className='text-xs text-slate-400 font-medium uppercase tracking-wide mb-1'>
                รายละเอียด
              </p>
              <p className='text-sm text-slate-700 whitespace-pre-wrap'>{pickScalarString(rfq.details)}</p>
            </div>
          ) : null}
        </Section>

        <Section title='ใบเสนอราคา / ยอดเงิน'>
          <InfoRow label='Quote ID' value={quotation.quote_id != null ? `#${quotation.quote_id}` : '—'} />
          <InfoRow label='ราคาต่อชิ้น' value={formatCurrency(money(quotation.price_per_piece))} />
          <InfoRow label='Subtotal' value={formatCurrency(money(quotation.subtotal))} />
          <InfoRow label='ส่วนลด' value={formatCurrency(money(quotation.discount_amount))} />
          <InfoRow label='ค่าส่ง' value={formatCurrency(money(quotation.shipping_cost))} />
          <InfoRow label='ค่าบรรจุ' value={formatCurrency(money(quotation.packaging_cost))} />
          <InfoRow label='มัดจำ' value={formatCurrency(money(detail.deposit_amount))} />
          <InfoRow label='ยอดรวมออเดอร์' value={formatCurrency(money(detail.total_amount))} />
          <InfoRow
            label='ประเภทชำระ'
            value={pickScalarString(detail.payment_type, '—')}
          />
        </Section>
      </div>

      <Section title='กำหนดการชำระเงิน'>
        {schedule.length === 0 ? (
          <p className='py-4 text-sm text-slate-400 text-center'>ไม่มีกำหนดการชำระ</p>
        ) : (
          <div className='divide-y divide-slate-50'>
            {schedule.map((item, idx) => {
              const row = asRecord(item);
              return (
                <div
                  key={pickScalarString(row.schedule_id, String(idx))}
                  className='py-3 flex flex-wrap items-center justify-between gap-2'
                >
                  <div>
                    <p className='text-sm font-semibold text-slate-800'>
                      {pickScalarString(row.label_th, pickScalarString(row.payment_type, `งวด ${idx + 1}`))}
                    </p>
                    <p className='text-xs text-slate-400'>
                      {pickScalarString(row.due_date)
                        ? `ครบกำหนด ${formatDate(pickScalarString(row.due_date))}`
                        : 'ไม่ระบุกำหนด'}
                      {pickScalarString(row.paid_at)
                        ? ` · ชำระแล้ว ${formatDateTime(pickScalarString(row.paid_at))}`
                        : ''}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold tabular-nums text-slate-900'>
                      {formatCurrency(money(row.amount))}
                    </p>
                    <p className='text-xs text-slate-400'>
                      {pickScalarString(row.status_label_th, pickScalarString(row.status, '—'))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title='การจัดส่ง / ผลิต'>
        <InfoRow
          label='กำหนดส่งโดยประมาณ'
          value={
            detail.estimated_delivery
              ? formatDate(pickScalarString(detail.estimated_delivery))
              : '—'
          }
        />
        <InfoRow
          label='Lead time'
          value={
            detail.lead_time_days != null ? `${detail.lead_time_days} วัน` : '—'
          }
        />
        <InfoRow label='ขนส่ง' value={pickScalarString(detail.courier, '—')} />
        <InfoRow label='เลขพัสดุ' value={pickScalarString(detail.tracking_no, '—')} />
        <InfoRow
          label='วันจัดส่ง'
          value={detail.shipped_at ? formatDateTime(pickScalarString(detail.shipped_at)) : '—'}
        />
      </Section>

      {/* Admin-only finance breakdown table */}
      <Section title='โครงสร้างรายได้ Tryly vs โรงงาน'>
        <div className='py-2 space-y-2 text-sm'>
          <div className='flex justify-between gap-4'>
            <span className='text-slate-500'>ยอดลูกค้าชำระ (Grand Total)</span>
            <span className='font-semibold tabular-nums'>{formatCurrency(grandTotal)}</span>
          </div>
          <div className='flex justify-between gap-4 text-emerald-700'>
            <span>
              หัก Commission → Tryly
              {commissionRate > 0 ? ` (${commissionRate}%)` : ''}
            </span>
            <span className='font-semibold tabular-nums'>{formatCurrency(commissionAmount)}</span>
          </div>
          <div className='flex justify-between gap-4 text-amber-700 border-t border-slate-100 pt-2'>
            <span>คงเหลือให้โรงงาน (Factory Net)</span>
            <span className='font-bold tabular-nums'>{formatCurrency(factoryNet)}</span>
          </div>
          <p className='text-[11px] text-slate-400 pt-2'>
            ข้อมูลจากตาราง quotations: platform_commission_amount / factory_net_receivable —
            โรงงานจะไม่เห็นค่าคอมมิชชันและส่วนแบ่งของระบบในหน้าออเดอร์ของตน
          </p>
        </div>
      </Section>
    </div>
  );
}
