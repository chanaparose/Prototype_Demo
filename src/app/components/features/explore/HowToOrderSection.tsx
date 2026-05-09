import React from 'react';
import { useNavigate } from 'react-router';
import { Search, FileText, MessageCircle, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const STEPS = [
  {
    num: 1,
    icon: Search,
    iconBg: 'rgba(162,56,255,0.25)',
    iconColor: '#EBD3FF',
    accentColor: '#A238FF',
    title: 'ค้นหาโรงงาน',
    subtitle: 'ที่ตรงความต้องการ',
    desc: 'เลือกดูสินค้าตัวอย่าง วัตถุดิบ และโรงงานที่ผ่านการยืนยันแล้ว กรองตามหมวดหมู่และงบประมาณ',
    action: 'ดูโรงงาน →',
    href: '/factory-ideas',
  },
  {
    num: 2,
    icon: FileText,
    iconBg: 'rgba(242,138,46,0.25)',
    iconColor: '#FFD9A0',
    accentColor: '#F28A2E',
    title: 'ส่งคำขอราคา',
    subtitle: '(RFQ) ฟรี',
    desc: 'กรอก spec สินค้า จำนวน และงบประมาณ — โรงงานที่สนใจจะส่งใบเสนอราคาให้คุณเลือก',
    action: 'สร้าง RFQ →',
    href: '/create-rfq',
  },
  {
    num: 3,
    icon: MessageCircle,
    iconBg: 'rgba(13,148,136,0.25)',
    iconColor: '#99F6E4',
    accentColor: '#0D9488',
    title: 'คุยรายละเอียด',
    subtitle: 'กับโรงงานโดยตรง',
    desc: 'Chat ตรงกับโรงงานที่สนใจ ปรับแบบ ตรวจสอบตัวอย่าง และเจรจาราคาได้อิสระ',
    action: 'ดูวิธีแชท →',
    href: '/factory-ideas',
  },
  {
    num: 4,
    icon: CheckCircle,
    iconBg: 'rgba(34,197,94,0.20)',
    iconColor: '#BBF7D0',
    accentColor: '#22C55E',
    title: 'ยืนยันและ',
    subtitle: 'รับสินค้า',
    desc: 'ยอมรับใบเสนอราคา วางเงินมัดจำผ่านระบบที่ปลอดภัย แล้วรอรับสินค้าคุณภาพตรงเวลา',
    action: 'ดูคำสั่งซื้อ →',
    href: '/orders',
  },
];

/** Section วิธีสั่งผลิต — ใช้ได้ทั้ง desktop และ mobile
 *  desktop: layout แนวนอน 4 step side-by-side (controlled by parent wrapper)
 *  mobile:  layout แนวตั้ง timeline (default stacked)
 */
export function HowToOrderSection({ className = '' }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <section
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: 'linear-gradient(135deg, #F8F5FF 0%, #F3EDFF 50%, #FFF9F2 100%)' }}
    >
      {/* Background decorations */}
      <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: '#D9C2FF' }} />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: '#FFD8B2' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 opacity-20 blur-3xl pointer-events-none" style={{ background: '#ECE1FF' }} />

      <div className="relative z-10 p-5 lg:p-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(162,56,255,0.30)', border: '1px solid rgba(162,56,255,0.40)' }}>
                <Sparkles size={14} className="text-[#7C3AED]" />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#7C3AED' }}>
                HOW IT WORKS
              </span>
            </div>
            <h2 className="text-[#2D1B4E] text-xl lg:text-2xl font-bold leading-tight">
              สั่งผลิตสินค้ากับ Tryly
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#6B5A8E' }}>
              ง่ายแค่ 4 ขั้นตอน ไม่ต้องมีประสบการณ์มาก่อน
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/create-rfq')}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 hover:opacity-90 shadow-lg"
            style={{ background: '#F28A2E', color: 'white', boxShadow: '0 4px 18px rgba(242,138,46,0.45)' }}
          >
            <span>เริ่มต้นเลย</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Steps — Desktop: grid 4 cols / Mobile: stacked with connector line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === STEPS.length - 1;
            return (
              <div key={step.num} className="relative">
                {/* Connector arrow (desktop only — between cards) */}
                {!isLast && (
                  <div
                    className="hidden lg:flex absolute top-8 -right-3 z-10 items-center justify-center w-6 h-6 rounded-full"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(162,56,255,0.20)' }}
                  >
                    <ArrowRight size={11} className="text-[#8E7BB4]" />
                  </div>
                )}

                {/* Card */}
                <button
                  type="button"
                  onClick={() => navigate(step.href)}
                  className="w-full text-left rounded-xl p-4 transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(162,56,255,0.14)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Step number + icon row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: step.iconBg, border: `1px solid ${step.accentColor}40` }}
                    >
                      <Icon size={17} style={{ color: step.iconColor }} />
                    </div>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${step.accentColor}25`, color: step.accentColor, border: `1px solid ${step.accentColor}40` }}
                    >
                      ขั้นตอนที่ {step.num}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mb-2">
                    <p className="text-[#2D1B4E] font-bold text-[15px] leading-snug">{step.title}</p>
                    <p className="font-semibold text-[13px]" style={{ color: step.accentColor }}>{step.subtitle}</p>
                  </div>

                  {/* Description */}
                  <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#6B7280' }}>
                    {step.desc}
                  </p>

                  {/* CTA link */}
                  <span
                    className="text-[11px] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ color: step.accentColor }}
                  >
                    {step.action}
                  </span>
                </button>

                {/* Mobile vertical connector */}
                {!isLast && (
                  <div className="flex lg:hidden justify-center my-1">
                    <div className="h-4 w-px" style={{ background: 'rgba(124,58,237,0.22)' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA (mobile only full-width) */}
        <button
          type="button"
          onClick={() => navigate('/create-rfq')}
          className="sm:hidden mt-5 w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: '#F28A2E', boxShadow: '0 4px 18px rgba(242,138,46,0.45)' }}
        >
          <span>🚀 สร้างคำขอราคาฟรี</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
