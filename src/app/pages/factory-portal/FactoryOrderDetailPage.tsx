import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import {
  ordersApi,
  factoriesApi,
  masterApi,
  mediaApi,
} from '../../services/api';
import { useIsDesktop } from '../../hooks/useIsDesktop';

const ORDER_CHAIN = ['PR', 'QC', 'SH'] as const;
type OrderSt = (typeof ORDER_CHAIN)[number] | 'CP' | string;

function unwrapOrder(raw: Record<string, unknown>): Record<string, unknown> {
  return (raw.order as Record<string, unknown>) ?? raw;
}

function sortSteps(steps: Record<string, unknown>[]) {
  return [...steps].sort(
    (a, b) => Number(a.sequence ?? 0) - Number(b.sequence ?? 0),
  );
}

export function FactoryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Record<string, unknown>>({});
  const [updates, setUpdates] = useState<Record<string, unknown>[]>([]);
  const [steps, setSteps] = useState<Record<string, unknown>[]>([]);

  const [desc, setDesc] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [detail, prodUpdates, factoryRow] = await Promise.all([
        ordersApi.get(id),
        ordersApi.listProductionUpdates(id),
        fid != null ? factoriesApi.get(fid) : Promise.resolve({}),
      ]);
      const o = unwrapOrder(detail as Record<string, unknown>);
      setOrder(o);
      setUpdates(Array.isArray(prodUpdates) ? (prodUpdates as Record<string, unknown>[]) : []);

      const f = factoryRow as Record<string, unknown>;
      const ftId = Number(f.factory_type_id ?? f.factory_typeId ?? 0);
      const rawSteps = await masterApi.productionSteps(
        Number.isFinite(ftId) && ftId > 0 ? ftId : undefined,
      );
      setSteps(
        sortSteps(
          (Array.isArray(rawSteps) ? rawSteps : []) as Record<string, unknown>[],
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดออเดอร์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [id, fid]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = String(order.status ?? '').toUpperCase() as OrderSt;
  const chainIndex = ORDER_CHAIN.indexOf(status as (typeof ORDER_CHAIN)[number]);
  const nextStatus: (typeof ORDER_CHAIN)[number] | null =
    chainIndex >= 0 && chainIndex < ORDER_CHAIN.length - 1
      ? ORDER_CHAIN[chainIndex + 1]
      : null;
  const canAdvance = Boolean(nextStatus);

  const doneStepIds = new Set(
    updates.map((u) => Number(u.step_id ?? u.stepId)).filter(Number.isFinite),
  );

  const nextStepRow =
    steps.length > 0
      ? steps.find((s) => !doneStepIds.has(Number(s.step_id ?? s.stepId)))
      : null;
  const nextStepId = nextStepRow
    ? Number(nextStepRow.step_id ?? nextStepRow.stepId)
    : chainIndex >= 0
      ? chainIndex + 1
      : 1;

  const advance = async () => {
    if (!id || !nextStatus) return;
    if (!desc.trim()) {
      setError('กรุณากรอกรายละเอียดความคืบหน้า');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let imageUrl: string | undefined;
      if (file) {
        const up = await mediaApi.upload(file);
        imageUrl = up.url;
      }
      if (!Number.isFinite(nextStepId) || nextStepId < 1) {
        throw new Error('ไม่พบขั้นตอนการผลิตจาก master — ตรวจสอบ factory_type_id');
      }
      await ordersApi.addProductionUpdate(id, {
        step_id: nextStepId,
        description: desc.trim(),
        image_url: imageUrl,
      });
      await ordersApi.updateStatus(id, nextStatus);
      setDesc('');
      setFile(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปเดตไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  if (!id) return null;

  const title = String(order.title ?? order.project_name ?? `คำสั่งซื้อ #${id}`);

  const twoCol = isDesktop ? 'lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start' : '';

  const idleMessage =
    status === 'SH'
      ? 'อยู่ในขั้นจัดส่ง — รอลูกค้ายืนยันรับสินค้า (CP)'
      : 'ไม่มีขั้นตอนถัดไปสำหรับโรงงาน';

  return (
    <div className="w-full min-w-0 max-w-lg lg:max-w-5xl mx-auto pb-24 pb-[max(6rem,env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center gap-3 mb-5 sm:mb-6 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/factory/orders')}
          className="w-10 h-10 shrink-0 rounded-xl border border-gray-200 flex items-center justify-center bg-white"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400">ออเดอร์</p>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{title}</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
      ) : null}

      {!loading ? (
        <div className={twoCol}>
          <div className="space-y-4 mb-4 lg:mb-0 min-w-0">
            <section className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                สถานะปัจจุบัน (ลำดับบังคับ PR → QC → SH)
              </p>
              <div className="flex gap-2 flex-wrap">
                {ORDER_CHAIN.map((code, i) => {
                  const active = status === code;
                  const past =
                    ORDER_CHAIN.indexOf(status as (typeof ORDER_CHAIN)[number]) > i ||
                    status === 'CP';
                  return (
                    <span
                      key={code}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        active
                          ? 'text-white'
                          : past
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                      style={active ? { background: '#A238FF' } : {}}
                    >
                      {code}
                    </span>
                  );
                })}
                {status === 'CP' ? (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white">
                    CP สำเร็จ
                  </span>
                ) : null}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4">
              <h2 className="font-bold text-gray-900 mb-2">ประวัติความคืบหน้า</h2>
              <ul className="space-y-2 text-sm break-words">
                {updates.length === 0 ? (
                  <li className="text-gray-400">ยังไม่มีรายการอัปเดต</li>
                ) : (
                  updates.map((u, idx) => (
                    <li
                      key={String(u.update_id ?? u.id ?? idx)}
                      className="border-b border-gray-50 pb-2 last:border-0"
                    >
                      <p className="text-xs text-gray-400">
                        Step {String(u.step_id ?? '—')} ·{' '}
                        {String(u.created_at ?? '').slice(0, 16)}
                      </p>
                      <p className="text-gray-800">{String(u.description ?? '')}</p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          <div className="min-w-0">
            {nextStatus && status !== 'CP' ? (
              <section className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 space-y-3">
                <h2 className="font-bold text-gray-900">ดำเนินการถัดไป → {nextStatus}</h2>
                <p className="text-xs text-gray-500">
                  ขั้นถัดไปใน master: step_id {nextStepId}
                  {nextStepRow
                    ? ` (${String(nextStepRow.step_name ?? '')})`
                    : ' (สำรองจากลำดับสถานะ)'}
                </p>
                <label className="block">
                  <span className="text-xs text-gray-500">รายละเอียด</span>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[80px]"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    disabled={!canAdvance}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-500">รูปประกอบ (ถ้ามี)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 text-sm max-w-full"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    disabled={!canAdvance}
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || !canAdvance}
                  onClick={() => void advance()}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
                >
                  {busy ? 'กำลังบันทึก...' : `บันทึกและเปลี่ยนเป็น ${nextStatus}`}
                </button>
              </section>
            ) : (
              <p className="text-sm text-gray-500 text-center lg:text-left py-4 lg:py-0 lg:px-1">
                {idleMessage}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
