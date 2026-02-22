import React, { useMemo } from 'react';
import { ArrowLeft, MessageCircle, CheckCircle, Circle, Package, Sparkles, RotateCcw, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Order } from '../../data/mockData';

const ORDER_STATUS_LABEL: Record<Order['status'], string> = {
  deposit: 'มัดจำ',
  production: 'กำลังผลิต',
  qc: 'ตรวจ QC',
  shipping: 'จัดส่ง',
  completed: 'เสร็จสิ้น',
  pending_completed: 'รอยืนยันรับ/คืน',
};

interface ProductionUpdateScreenProps {
  onBack: () => void;
  order: Order;
}

type StepStatus = 'completed' | 'current' | 'pending';

function buildTimelineFromOrder(order: Order): Array<{
  id: string;
  title: string;
  status: StepStatus;
  date: string;
  description: string;
  images: string[];
  updateTime?: string;
}> {
  const { status, currentStep } = order;
  const steps = [
    { id: '1', title: 'มัดจำแล้ว', orderStatus: 'deposit' as const, date: '16 Feb 2026', description: 'ได้รับเงินมัดจำ 50% เรียบร้อยแล้ว', images: [] as string[] },
    { id: '2', title: 'กำลังผลิต', orderStatus: 'production' as const, date: '17-25 Feb 2026', description: 'ขึ้นรูปเสร็จแล้ว กำลังเข้าอบ', images: ['https://images.unsplash.com/photo-1579784340946-55a7bbd51d57?w=400', 'https://images.unsplash.com/photo-1645623383208-84926ba8aa21?w=400', 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=400'], updateTime: '20 Feb 2026, 14:30' },
    { id: '3', title: 'QC & Packing', orderStatus: 'qc' as const, date: 'รอการดำเนินการ', description: 'ตรวจสอบคุณภาพและบรรจุภัณฑ์', images: [] as string[] },
    { id: '4', title: 'จัดส่ง', orderStatus: 'shipping' as const, date: 'รอการดำเนินการ', description: 'จัดส่งสินค้าถึงมือคุณ', images: [] as string[] },
    { id: '5', title: 'คืนเงิน/คืนสินค้า ฉันตรวจสอบและรับสินค้าแล้ว', orderStatus: 'completed' as const, date: 'รอการดำเนินการ', description: 'ยืนยันการรับสินค้าและปิดรายการ หรือขอคืนเงิน/คืนสินค้าตามนโยบาย', images: [] as string[] },
  ];
  return steps.map((step, index) => {
    let stepStatus: StepStatus = 'pending';
    if (index < 4) {
      const stepNumber = index + 1;
      const isCompleted = currentStep > stepNumber || status === 'completed' || status === 'pending_completed';
      const isCurrent = !isCompleted && status === step.orderStatus;
      stepStatus = isCompleted ? 'completed' : isCurrent ? 'current' : 'pending';
    } else {
      stepStatus = status === 'completed' ? 'completed' : 'pending'; // pending_completed → step 5 แสดงเป็น pending
    }
    return {
      id: step.id,
      title: step.title,
      status: stepStatus,
      date: step.date,
      description: step.description,
      images: step.images,
      updateTime: step.updateTime,
    };
  });
}

export function ProductionUpdateScreen({ onBack, order }: ProductionUpdateScreenProps) {
  const { orderId, productName, productImage, factoryName, dueDate, status: orderStatus } = order;
  const timeline = useMemo(() => buildTimelineFromOrder(order), [order]);

  // ความคืบหน้าโดยรวมนับจากขั้นแรกถึงจัดส่ง (ไม่รวมขั้นคืนเงิน/คืนสินค้า)
  const stepsForProgress = timeline.slice(0, -1);
  const completedCount = stepsForProgress.filter((s) => s.status === 'completed').length;
  const progressPercent = stepsForProgress.length > 0 ? (completedCount / stepsForProgress.length) * 100 : 0;

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30">
          <CheckCircle className="h-5 w-5 text-emerald-600 fill-emerald-500" />
        </div>
      );
    }
    if (status === 'current') {
      return (
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4F4F9F] shadow-lg shadow-[#4F4F9F]/30">
          <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
          <span className="absolute inset-0 rounded-full animate-ping bg-[#4F4F9F]/40" aria-hidden />
        </div>
      );
    }
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-200 bg-slate-50">
        <Circle className="h-4 w-4 text-slate-300" />
      </div>
    );
  };

  const getCardStyle = (status: string) => {
    if (status === 'completed') return 'rounded-2xl bg-emerald-500/10 backdrop-blur-sm border border-emerald-400/20 shadow-sm';
    if (status === 'current') return 'rounded-2xl bg-[#4F4F9F]/10 backdrop-blur-sm border border-[#4F4F9F]/25 shadow-md shadow-[#4F4F9F]/10';
    return 'rounded-2xl bg-slate-100/60 backdrop-blur-sm border border-slate-200/60';
  };

  const getStepBadgeClass = (status: string) => {
    if (status === 'completed') return 'rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-400/30 text-xs font-semibold';
    if (status === 'current') return 'rounded-full bg-[#4F4F9F] text-white border-0 text-xs font-semibold shadow-sm';
    return 'rounded-full bg-slate-200/80 text-slate-600 border-0 text-xs font-medium';
  };

  const getPillBarStyle = (status: string) => {
    if (status === 'completed') return { width: '100%', bg: 'bg-gradient-to-r from-emerald-400 to-emerald-300' };
    if (status === 'current') return { width: '60%', bg: 'bg-gradient-to-r from-[#4F4F9F] to-indigo-400' };
    return { width: '0%', bg: 'bg-slate-200' };
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100/80">
      {/* Header - คงที่ */}
      <div className="relative z-10 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-20%] right-[-20%] h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 p-4 pt-5 pb-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg transition-all hover:bg-white/25 active:scale-95"
              aria-label="กลับ"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-lg font-bold tracking-tight text-white">ความคืบหน้าการผลิต</h1>
              <p className="mt-0.5 truncate text-xs font-medium text-white/80">#{orderId}</p>
            </div>
            <div className="h-11 w-11 shrink-0" aria-hidden />
          </div>
          {/* Progress pill */}
          <div className="mt-4 rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-2.5 border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-white/90">ความคืบหน้าโดยรวม</span>
              <span className="font-bold text-white">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Card - อิงจาก order จาก OrderScreen */}
      <div className="relative z-20 shrink-0 px-4 -mt-2">
        <Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-xl shadow-slate-200/60">
          <CardContent className="p-0">
            <div className="flex gap-4 p-4">
              <div className="relative shrink-0">
                <img
                  src={productImage}
                  alt={productName}
                  className="h-24 w-24 rounded-2xl object-cover ring-2 ring-slate-100"
                />
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#4F4F9F] shadow-md">
                  <Package className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="text-base font-bold text-slate-800 leading-snug">{productName}</h2>
                <p className="mt-1 text-sm text-slate-500">กำหนดส่ง: {dueDate}</p>
                <Badge
                  className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border-0 ${
                    orderStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : orderStatus === 'pending_completed'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-[#4F4F9F]'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  {ORDER_STATUS_LABEL[orderStatus]}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline - เลื่อนได้อย่างเดียว */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 mt-6 pb-24">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F4F9F]/10">
            <Package className="h-4 w-4 text-[#4F4F9F]" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ขั้นตอนการผลิต</h3>
        </div>

        <div className="relative">
          {/* ขั้นที่ 1 ถึง n-1: มีเส้นยาวเชื่อมทุกจุด */}
          {timeline.length > 1 && (
            <div className="relative">
              <div className="absolute left-[18px] top-5 bottom-0 w-0.5 rounded-full bg-slate-200 pointer-events-none" aria-hidden />
              <div className="space-y-5">
                {timeline.slice(0, -1).map((step) => {
                  const isCurrent = step.status === 'current';
                  return (
                    <div key={step.id} className="relative flex gap-4">
                  <div className="relative z-10 pt-0.5">{getStatusIcon(step.status)}</div>

                  <div className="min-w-0 flex-1 pb-1">
                    <div
                      className={`overflow-hidden px-4 py-3.5 transition-all duration-200 ${getCardStyle(step.status)} ${isCurrent ? 'scale-[1.01]' : 'hover:shadow-md'}`}
                    >
                      {/* แถวหัวการ์ด + badge แบบ pill */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-800">{step.title}</h4>
                        <Badge className={getStepBadgeClass(step.status)}>
                          {step.status === 'completed' && '✓ เสร็จสิ้น'}
                          {step.status === 'current' && 'กำลังดำเนินการ'}
                          {step.status === 'pending' && 'รอดำเนินการ'}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                      <p className="mt-2 inline-flex items-center rounded-xl bg-white/50 px-2.5 py-1 text-xs font-medium text-slate-500 backdrop-blur-sm">
                        {step.date}
                      </p>

                      {/* Progress bar แบบเดียวกับ Progress pill */}
                      <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${getPillBarStyle(step.status).bg}`}
                            style={{ width: getPillBarStyle(step.status).width }}
                          />
                        </div>
                      </div>

                      {step.images.length > 0 && (
                        <div className="mt-4 rounded-xl bg-white/40 backdrop-blur-sm p-3 border border-white/50">
                          <p className="mb-2 text-xs font-medium text-slate-500">
                            อัปเดตล่าสุด: {step.updateTime}
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {step.images.map((img, imgIndex) => (
                              <button
                                key={imgIndex}
                                type="button"
                                className="group relative aspect-square overflow-hidden rounded-xl border border-white/60 bg-white/50 shadow-inner transition hover:border-[#4F4F9F]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4F4F9F]/40"
                              >
                                <img
                                  src={img}
                                  alt={`Update ${imgIndex + 1}`}
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white/0 transition group-hover:bg-black/20 group-hover:text-white/90 text-xs font-medium">
                                  ดูรูป
                                </span>
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-xs font-medium text-[#4F4F9F]">
                            คลิกรูปเพื่อดูขนาดใหญ่
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* เส้นเชื่อมระหว่างขั้นก่อนสุดท้ายกับขั้นสุดท้าย (ให้ขีดต่อกัน) */}
          {timeline.length > 1 && (
            <div className="relative h-5 w-full shrink-0">
              <div className="absolute left-[18px] top-0 bottom-0 w-0.5 rounded-full bg-slate-200 pointer-events-none" aria-hidden />
            </div>
          )}
          {/* ขั้นสุดท้าย: ไม่มีขีดต่อ (หรือการ์ดสีปกติ + ปุ่มคืนสินค้า/รับสินค้า เมื่อ pending_completed) */}
          {timeline.length > 0 && (() => {
            const step = timeline[timeline.length - 1];
            const isCurrent = step.status === 'current';
            const isPendingCompleted = orderStatus === 'pending_completed';

            if (isPendingCompleted) {
              return (
                <div key={step.id} className="relative flex gap-4">
                  <div className="relative z-10 pt-0.5">{getStatusIcon(step.status)}</div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-800">{step.title}</h4>
                        <Badge className="rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold">
                          รอยืนยันรับ/คืน
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                      <p className="mt-2 inline-flex items-center rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        {step.date}
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-xl border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                          onClick={() => {}}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          เคลมสินค้า
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 rounded-xl bg-gradient-to-r from-[#4F4F9F] to-indigo-600 text-white hover:opacity-95"
                          onClick={() => {}}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          ตกลงรับสินค้า
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={step.id} className="relative flex gap-4">
                <div className="relative z-10 pt-0.5">{getStatusIcon(step.status)}</div>
                <div className="min-w-0 flex-1 pb-1">
                  <div
                    className={`overflow-hidden px-4 py-3.5 transition-all duration-200 ${getCardStyle(step.status)} ${isCurrent ? 'scale-[1.01]' : 'hover:shadow-md'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-slate-800">{step.title}</h4>
                      <Badge className={getStepBadgeClass(step.status)}>
                        {step.status === 'completed' && '✓ เสร็จสิ้น'}
                        {step.status === 'current' && 'กำลังดำเนินการ'}
                        {step.status === 'pending' && 'รอดำเนินการ'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                    <p className="mt-2 inline-flex items-center rounded-xl bg-white/50 px-2.5 py-1 text-xs font-medium text-slate-500 backdrop-blur-sm">
                      {step.date}
                    </p>
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${getPillBarStyle(step.status).bg}`}
                          style={{ width: getPillBarStyle(step.status).width }}
                        />
                      </div>
                    </div>
                    {step.images.length > 0 && (
                      <div className="mt-4 rounded-xl bg-white/40 backdrop-blur-sm p-3 border border-white/50">
                        <p className="mb-2 text-xs font-medium text-slate-500">อัปเดตล่าสุด: {step.updateTime}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {step.images.map((img, imgIndex) => (
                            <button
                              key={imgIndex}
                              type="button"
                              className="group relative aspect-square overflow-hidden rounded-xl border border-white/60 bg-white/50 shadow-inner transition hover:border-[#4F4F9F]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4F4F9F]/40"
                            >
                              <img src={img} alt={`Update ${imgIndex + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white/0 transition group-hover:bg-black/20 group-hover:text-white/90 text-xs font-medium">ดูรูป</span>
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs font-medium text-[#4F4F9F]">คลิกรูปเพื่อดูขนาดใหญ่</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      
    </div>
  );
}
