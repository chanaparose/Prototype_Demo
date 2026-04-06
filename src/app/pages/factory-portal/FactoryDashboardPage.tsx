import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Building2, Images, ClipboardList, Package, Wallet, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { ordersApi, rfqsApi } from '../../services/api';

function orderFactoryId(row: Record<string, unknown>): number | null {
  const v = row.factory_id ?? row.factoryId;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function FactoryDashboardPage() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const [openRfqCount, setOpenRfqCount] = useState<number | null>(null);
  const [activeOrders, setActiveOrders] = useState<number | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setErr('');
    (async () => {
      try {
        const rfqsRaw = await rfqsApi.list('OP');
        const rfqs = (Array.isArray(rfqsRaw) ? rfqsRaw : []) as Record<string, unknown>[];
        const open = rfqs.filter((r) => {
          const inner = (r.rfq as Record<string, unknown>) ?? r;
          const st = String(inner.status ?? r.status ?? '').toUpperCase();
          return st === 'OP' || st === 'OPEN' || st === '';
        });
        if (!cancelled) setOpenRfqCount(open.length);

        const ordersRaw = await ordersApi.list();
        const orders = (Array.isArray(ordersRaw) ? ordersRaw : []) as Record<string, unknown>[];
        const mine = fid
          ? orders.filter((o) => orderFactoryId(o) === fid)
          : orders;
        const active = mine.filter((o) => {
          const st = String(o.status ?? '').toUpperCase();
          return st !== 'CP' && st !== 'COMPLETED';
        });
        if (!cancelled) setActiveOrders(active.length);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'โหลดสรุปไม่สำเร็จ');
          setOpenRfqCount(0);
          setActiveOrders(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fid]);

  const cards = [
    {
      to: '/factory/profile',
      title: 'โปรไฟล์',
      desc: 'ข้อมูลโรงงานและใบรับรอง',
      icon: Building2,
      accent: '#7C3AED',
    },
    {
      to: '/factory/showcases?type=PD',
      title: 'โชว์เคส',
      desc: 'สินค้า · โปรโมชัน · ไอเดีย (แยกตาม ?type=PD|PM|ID)',
      icon: Images,
      accent: '#8B5CF6',
    },
    {
      to: '/factory/rfqs',
      title: 'กระดาน RFQ',
      desc:
        openRfqCount != null
          ? `คำขอที่เปิดรับอยู่ ${openRfqCount} รายการ`
          : 'ดูคำขอเสนอราคาจากลูกค้า',
      icon: ClipboardList,
      accent: '#A238FF',
    },
    {
      to: '/factory/orders',
      title: 'จัดการออเดอร์',
      desc:
        activeOrders != null
          ? `ออเดอร์ที่ยังไม่สำเร็จ ${activeOrders} รายการ`
          : 'อัปเดตสถานะการผลิต',
      icon: Package,
      accent: '#059669',
    },
    {
      to: '/factory/wallet',
      title: 'กระเป๋าเงิน',
      desc: 'ยอด escrow และถอนเงิน',
      icon: Wallet,
      accent: '#F28A2E',
    },
  ];

  return (
    <div className="space-y-6">
      {err ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          {err}
        </p>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map(({ to, title, desc, icon: Icon, accent }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${accent}18` }}
              >
                <Icon size={24} style={{ color: accent }} strokeWidth={2} />
              </div>
              <ArrowRight
                size={20}
                className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
              />
            </div>
            <h2 className="mt-4 text-base font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
