import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  activateTourMocks,
  clearTourMocks,
  setTourActive,
  TOUR_MESSAGES_CONV_ID,
  type TourScenario,
} from '../../../utils/tourMocks';
import { formatCurrency } from '@/utils/formatting';
import { useAuth } from '../../../stores';

export const TOUR_KEY = 'tryly_tour_seen_v1';

/* ─── CSS ──────────────────────────────────────────────────────────────────── */
const TOUR_CSS = `
@keyframes tour-card-in {
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes tour-ring-pulse {
  0%,100% { stroke-width:2.5; stroke-opacity:0.85; }
  50%      { stroke-width:4.5; stroke-opacity:1; }
}
@keyframes tour-mock-in {
  from { opacity:0; transform:scale(0.97) translateY(6px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes tour-btn-glow {
  0%,100% { box-shadow: 0 0 0 0 var(--tour-glow,rgba(162,56,255,0.5)), 0 4px 12px var(--tour-glow-soft,rgba(162,56,255,0.3)); }
  50%      { box-shadow: 0 0 0 9px rgba(0,0,0,0), 0 4px 12px var(--tour-glow-soft,rgba(162,56,255,0.3)); }
}
.tour-ring { animation: tour-ring-pulse 1.8s ease-in-out infinite; }
.tour-mock-frame { animation: tour-mock-in 0.22s ease-out both; }
.tour-btn-glow { animation: tour-btn-glow 2s ease-in-out infinite; }
`;
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const s = document.createElement('style');
  s.textContent = TOUR_CSS;
  document.head.appendChild(s);
  cssInjected = true;
}

/* ─── Types ────────────────────────────────────────────────────────────────── */
type StepDef = {
  /** Full path including optional `?query` (e.g. `/product-detail?showcase_id=14`) */
  route: string | null;
  /** When set, install canned API mocks for this scenario before navigating */
  mockScenario?: TourScenario;
  /** Texts to search for in the rendered page to spotlight (button labels, etc.) */
  targetTexts?: string[];
  targetSelector?: string;
  spotlightRadius?: number;
  spotlightPad?: number;
  /**
   * Where to render the tour card. `'auto'` (default) computes from the
   * spotlight rect AFTER it lands, which causes a brief flash. Use `'top'`
   * or `'bottom'` to lock placement upfront for steps where we know the
   * spotlight target sits in the lower / upper half of the viewport.
   */
  cardPlacement?: 'top' | 'bottom' | 'auto';
  badgeColor: string;
  icon: string;
  badge: string;
  title: string;
  desc: string;
  tip: string;
};

/* ─── Mock screen helpers ───────────────────────────────────────────────────  */

function MockStatusBar() {
  return (
    <div style={{ background: '#fff', padding: '5px 14px 3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>9:41</span>
      <span style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: 2 }}>● ● ●</span>
      <span style={{ fontSize: 10, color: '#374151' }}>🔋 100%</span>
    </div>
  );
}

function MockNav({ title, showBack = true }: { title?: string; showBack?: boolean }) {
  return (
    <div style={{ background: '#fff', padding: '8px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      {showBack && (
        <div style={{ width: 30, height: 30, borderRadius: 9, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#374151' }}>←</div>
      )}
      {title ? (
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A0A2E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      ) : (
        <img src="/assets/tryly-logo.png" alt="Tryly" style={{ height: 26, objectFit: 'contain' }} />
      )}
    </div>
  );
}

/* ─── Step 2: CreateRFQ mock (/create-rfq) ─────────────────────────────────── */
function MockCreateRfq({ badgeColor }: { badgeColor: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title="ส่งคำขอราคา (RFQ)" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 20px', background: '#F9FAFB' }}>
        {/* Category pill */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {['ของเล่นสัตว์เลี้ยง', 'อาหารสัตว์', 'เสื้อผ้าสัตว์เลี้ยง'].map((c, i) => (
            <span key={c} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: i === 0 ? badgeColor : '#F3F4F6', color: i === 0 ? '#fff' : '#374151', border: i === 0 ? 'none' : '1px solid #E5E7EB' }}>{c}</span>
          ))}
        </div>
        {/* Form fields */}
        {[
          { label: 'ชื่อโปรเจกต์', placeholder: 'เช่น ของเล่นแมวยางธรรมชาติ', value: 'ของเล่นแมว MOQ 100 ชิ้น', filled: true },
          { label: 'รายละเอียดสินค้า', placeholder: 'อธิบายสินค้าที่ต้องการผลิต...', value: 'ต้องการผลิตของเล่นแมวจากยางธรรมชาติ ปลอดภัยสำหรับสัตว์เลี้ยง ขนาด 5–8 ซม.', filled: true, multiline: true },
          { label: 'จำนวนที่ต้องการ (ชิ้น)', placeholder: '100', value: '100', filled: true },
          { label: 'งบประมาณ (บาท)', placeholder: '10,000', value: '5,000', filled: true },
          { label: 'วัสดุที่ต้องการ', placeholder: 'เช่น ยางธรรมชาติ, พลาสติก ABS', value: 'ยางธรรมชาติปลอดสาร BPA', filled: true },
        ].map((f) => (
          <div key={f.label} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <div style={{
              background: f.filled ? '#fff' : '#F9FAFB', borderRadius: 10, padding: f.multiline ? '9px 12px' : '9px 12px',
              border: `1.5px solid ${f.filled ? '#E9D5FF' : '#E5E7EB'}`, fontSize: 12,
              color: f.filled ? '#111827' : '#9CA3AF', minHeight: f.multiline ? 56 : 'auto', lineHeight: 1.5,
            }}>{f.filled ? f.value : f.placeholder}</div>
          </div>
        ))}
        {/* Deadline */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>กำหนดส่ง</label>
          <div style={{ background: '#fff', borderRadius: 10, padding: '9px 12px', border: '1.5px solid #E9D5FF', fontSize: 12, color: '#111827', display: 'flex', justifyContent: 'space-between' }}>
            <span>15 มี.ค. 2569</span><span style={{ color: '#9CA3AF' }}>📅</span>
          </div>
        </div>
        {/* CTA */}
        <button
          type="button"
          className="tour-btn-glow"
          style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: badgeColor, color: '#fff', fontWeight: 700, fontSize: 14,
            cursor: 'default', marginTop: 4,
            '--tour-glow': 'rgba(242,138,46,0.55)',
            '--tour-glow-soft': 'rgba(242,138,46,0.28)',
          } as React.CSSProperties}
        >
          📋 ส่งคำขอราคาให้โรงงาน
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: ProductDetail mock (/product-detail?showcase_id=14) ─────────── */
function MockProductDetail({ badgeColor }: { badgeColor: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav />
      {/* Hero image */}
      <div style={{ flexShrink: 0, height: 185, position: 'relative', background: '#E5E7EB', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=500&h=300&fit=crop"
          alt="ของเล่นแมว"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: 8, left: 8, width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</div>
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.52)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>1 / 2</div>
      </div>
      {/* Thumbnail strip */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, padding: '6px 12px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ width: 42, height: 42, borderRadius: 8, background: '#E5E7EB', overflow: 'hidden', border: '2px solid #A238FF' }}>
          <img src="https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=80&h=80&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 8, background: '#E5E7EB', overflow: 'hidden' }}>
          <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=80&h=80&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 0', background: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F28A2E', marginBottom: 7 }}>฿40</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ background: '#EEF2FF', color: '#4338CA', fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>⭕ Preferred</span>
          <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 10, padding: '2px 7px', borderRadius: 99 }}>สินค้า</span>
          <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 10, padding: '2px 7px', borderRadius: 99 }}>ของเล่นสัตว์เลี้ยง</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A0A2E', marginBottom: 7 }}>ของเล่นแมว</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9CA3AF', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ color: '#FBBF24', fontWeight: 600 }}>★ 0.0</span>
          <span>0 รีวิว</span><span>•</span><span>♡ 1 สนใจ</span>
        </div>
        {[
          ['ขั้นต่ำผลิต', '100 ชิ้น (MOQ)'],
          ['สถานที่ผลิต', '📍 กรุงเทพมหานคร'],
          ['เผยแพร่', '25 เม.ย. 2569'],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F9FAFB', fontSize: 12 }}>
            <span style={{ color: '#6B7280' }}>{label}</span>
            <span style={{ fontWeight: 700, color: '#111827' }}>{value}</span>
          </div>
        ))}
      </div>
      {/* Bottom action bar */}
      <div style={{ flexShrink: 0, padding: '9px 12px', background: '#fff', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '0 8px', color: '#6B7280', fontSize: 9 }}>
          <span style={{ fontSize: 16 }}>🏭</span><span>โปรไฟล์</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '0 8px', color: '#6B7280', fontSize: 9 }}>
          <span style={{ fontSize: 16 }}>♡</span><span>1</span>
        </div>
        <button
          type="button"
          className="tour-btn-glow"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 12, border: 'none',
            background: badgeColor, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            '--tour-glow': 'rgba(13,148,136,0.55)',
            '--tour-glow-soft': 'rgba(13,148,136,0.28)',
          } as React.CSSProperties}
        >
          💬 แชทกับโรงงาน
        </button>
      </div>
    </div>
  );
}

/* ─── Step 4: Messages mock (with แนบ RFQ button) ──────────────────────────── */
function MockMessages({ badgeColor }: { badgeColor: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title="ของเล่นสัตว์เลี้ยง แฮปปี้" />
      {/* RFQ chip */}
      <div style={{ flexShrink: 0, padding: '7px 12px', background: '#F8F5FF', borderBottom: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13 }}>📋</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED' }}>RFQ: ของเล่นแมว</span>
        <span style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>รอข้อเสนอ</span>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 9, background: '#FAFAFA' }}>
        {/* Factory */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#A238FF1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🏭</div>
          <div style={{ maxWidth: '78%' }}>
            <div style={{ background: '#fff', padding: '7px 11px', borderRadius: '10px 10px 10px 2px', fontSize: 12, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', lineHeight: 1.5 }}>
              สวัสดีครับ! สนใจสินค้าตัวไหนครับ? 🐾
            </div>
            <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, paddingLeft: 3 }}>10:32 น.</div>
          </div>
        </div>
        {/* User */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ maxWidth: '78%' }}>
            <div style={{ background: '#A238FF', padding: '7px 11px', borderRadius: '10px 10px 2px 10px', fontSize: 12, color: '#fff', lineHeight: 1.5 }}>
              สวัสดีค่ะ อยากได้ของเล่นแมว MOQ 100 ชิ้น ราคาต่อชิ้นเท่าไหร่คะ?
            </div>
            <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, textAlign: 'right', paddingRight: 3 }}>10:35 น.</div>
          </div>
        </div>
        {/* Factory 2 */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#A238FF1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🏭</div>
          <div style={{ maxWidth: '78%' }}>
            <div style={{ background: '#fff', padding: '7px 11px', borderRadius: '10px 10px 10px 2px', fontSize: 12, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', lineHeight: 1.5 }}>
              ราคา 40 บาท/ชิ้นครับ กรุณาส่ง RFQ มาเพื่อยืนยันรายละเอียดและรับใบเสนอราคาอย่างเป็นทางการ 🙏
            </div>
            <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, paddingLeft: 3 }}>10:38 น.</div>
          </div>
        </div>
      </div>
      {/* Input bar */}
      <div style={{ flexShrink: 0, padding: '8px 10px', background: '#fff', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="tour-btn-glow"
            style={{
              padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${badgeColor}`,
              background: `${badgeColor}14`, color: badgeColor, fontWeight: 700, fontSize: 11,
              cursor: 'default', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0,
              '--tour-glow': 'rgba(59,130,246,0.55)',
              '--tour-glow-soft': 'rgba(59,130,246,0.25)',
            } as React.CSSProperties}
          >
            📎 แนบ RFQ
          </button>
          <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 20, padding: '7px 12px', fontSize: 12, color: '#9CA3AF', border: '1px solid #F3F4F6' }}>
            พิมพ์ข้อความ...
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#A238FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, color: '#fff' }}>➤</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 5: RFQ detail mock (/rfqs/28 → rfq1 data) ───────────────────────── */
function MockRfqDetail({ badgeColor }: { badgeColor: string }) {
  const offers = [
    { name: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม', price: 42000, leadTime: 8, rating: 4.9, verified: true, recommended: true, reason: 'ราคาคุ้มค่าที่สุด + งานไวสุด' },
    { name: 'แพ็กเกจจิ้งสัตว์เลี้ยง โปร', price: 38500, leadTime: 12, rating: 4.6, verified: false, recommended: false, reason: 'ราคาถูกที่สุด แต่ lead time นานกว่า' },
    { name: 'ของเล่นสัตว์เลี้ยง แฮปปี้', price: 48000, leadTime: 7, rating: 4.8, verified: true, recommended: false, reason: 'ส่งเร็วที่สุด แต่ราคาสูงกว่า' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title="คำขอผลิต: อาหารสัตว์แห้ง" />
      {/* Status strip */}
      <div style={{ flexShrink: 0, padding: '9px 14px', background: '#F0FDF4', borderBottom: '1px solid #BBF7D0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>🐾 อาหารสัตว์ • 1,000 ชิ้น</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>✅ ได้รับ 3 ข้อเสนอแล้ว</div>
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', textAlign: 'right' }}>
            <div>งบประมาณ ฿50,000</div>
            <div>ส่งมอบ 15 มี.ค. 69</div>
          </div>
        </div>
      </div>
      {/* Offers list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 9, background: '#F9FAFB' }}>
        {offers.map((o, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '11px 12px',
            border: o.recommended ? `2px solid ${badgeColor}` : '1.5px solid #F3F4F6',
            boxShadow: o.recommended ? `0 4px 18px ${badgeColor}25` : '0 1px 4px rgba(0,0,0,0.05)',
            position: 'relative',
          }}>
            {o.recommended && (
              <div style={{
                position: 'absolute', top: 0, right: 12, transform: 'translateY(-50%)',
                background: badgeColor, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              }}>🤖 AI แนะนำ</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 3, lineHeight: 1.3 }}>{o.name}</div>
                <div style={{ fontSize: 10.5, color: '#6B7280' }}>
                  ⏱ {o.leadTime} วัน &nbsp;⭐ {o.rating} {o.verified ? <span style={{ color: '#22C55E', fontWeight: 600 }}>✓ ยืนยัน</span> : null}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{formatCurrency(o.price, 'THB')}</div>
                <div style={{ fontSize: 9.5, color: '#9CA3AF' }}>รวมทั้งหมด</div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: '#6B7280', background: '#F9FAFB', borderRadius: 8, padding: '4px 8px', marginBottom: o.recommended ? 8 : 0 }}>
              💡 {o.reason}
            </div>
            {o.recommended && (
              <button
                type="button"
                className="tour-btn-glow"
                style={{
                  width: '100%', padding: '9px', borderRadius: 10, border: 'none',
                  background: badgeColor, color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'default',
                  '--tour-glow': 'rgba(124,58,237,0.55)',
                  '--tour-glow-soft': 'rgba(124,58,237,0.28)',
                } as React.CSSProperties}
              >
                ✓ ยอมรับข้อเสนอนี้
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 6: Order detail mock (/orders/17 → ord1 data) ────────────────────── */
function MockOrderDetail({ badgeColor }: { badgeColor: string }) {
  const timeline = [
    { title: 'ยืนยันคำสั่งซื้อ', date: '15 ม.ค. 2569', status: 'done', desc: 'ชำระมัดจำและยืนยันแล้ว' },
    { title: 'จัดซื้อวัตถุดิบ', date: '18 ม.ค. 2569', status: 'done', desc: 'ไนลอนและหนังสังเคราะห์พร้อมแล้ว' },
    { title: 'เริ่มกระบวนการผลิต', date: '22 ม.ค. 2569', status: 'done', desc: 'ตัดเย็บและประกอบตามแบบ' },
    { title: 'Quality Check ครั้งที่ 1', date: '5 ก.พ. 2569', status: 'current', desc: 'ตรวจสอบความแข็งแรงของชิ้นงาน' },
    { title: 'บรรจุและติดฉลาก', date: '', status: 'pending', desc: '' },
    { title: 'QC ขั้นสุดท้ายและจัดส่ง', date: '', status: 'pending', desc: '' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title="คำสั่งซื้อ: สายจูงสัตว์เลี้ยง" />
      <div style={{ flex: 1, overflowY: 'auto', background: '#F9FAFB' }}>
        {/* Summary */}
        <div style={{ padding: '10px 12px 0' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1px solid #F3F4F6', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A0A2E', marginBottom: 3 }}>สายจูงและปลอกคอสัตว์เลี้ยง</div>
                <div style={{ fontSize: 11, color: '#7C3AED' }}>ของเล่นสัตว์เลี้ยง แฮปปี้ • 500 ชิ้น</div>
              </div>
              <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>กำลังผลิต</span>
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>ความคืบหน้า</span><span style={{ fontWeight: 700, color: badgeColor }}>65%</span>
            </div>
            <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '65%', background: `linear-gradient(90deg, ${badgeColor}, #A238FF)`, borderRadius: 99 }} />
            </div>
          </div>
        </div>
        {/* Payment */}
        <div style={{ padding: '0 12px 10px' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1.5px solid #F3F4F6' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>💳 สรุปการชำระเงิน (Escrow)</div>
            {[
              ['ยอดรวม', '฿42,000', false],
              ['ชำระมัดจำแล้ว', '฿21,000 ✓', true],
              ['ยอดที่ต้องชำระ', '฿21,000', false],
            ].map(([label, val, green]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: '#6B7280' }}>{label}</span>
                <span style={{ fontWeight: 700, color: green ? '#22C55E' : '#111827' }}>{val}</span>
              </div>
            ))}
            <button
              type="button"
              className="tour-btn-glow"
              style={{
                width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: 'none',
                background: badgeColor, color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'default',
                '--tour-glow': 'rgba(34,197,94,0.55)',
                '--tour-glow-soft': 'rgba(34,197,94,0.28)',
              } as React.CSSProperties}
            >
              💰 ชำระยอดที่เหลือ ฿21,000
            </button>
          </div>
        </div>
        {/* Timeline */}
        <div style={{ padding: '0 12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 9 }}>📋 ความคืบหน้าการผลิต</div>
          {timeline.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: t.status === 'done' ? '#22C55E' : t.status === 'current' ? badgeColor : '#E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', fontWeight: 700,
                }}>
                  {t.status === 'done' ? '✓' : t.status === 'current' ? '●' : ''}
                </div>
                {i < timeline.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 14, background: t.status === 'done' ? '#D1FAE5' : '#F3F4F6', margin: '2px 0' }} />
                )}
              </div>
              <div style={{ paddingTop: 1, paddingBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: t.status === 'current' ? 700 : 500, color: t.status === 'pending' ? '#9CA3AF' : '#111827', lineHeight: 1.3 }}>{t.title}</div>
                {t.date && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{t.date}</div>}
                {t.status === 'current' && <div style={{ fontSize: 10, color: badgeColor, fontWeight: 600, marginTop: 2 }}>● กำลังดำเนินการ</div>}
                {t.desc && t.status !== 'current' && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{t.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Mock screen frame wrapper ─────────────────────────────────────────────── */
function MockScreenOverlay({ stepIdx, def }: { stepIdx: number; def: StepDef }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.65)' }} />
      <div
        key={stepIdx}
        className="tour-mock-frame"
        style={{
          position: 'fixed',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 20px)',
          maxWidth: 420,
          height: 'calc(100svh - 215px)',
          background: '#F9FAFB',
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          boxShadow: '0 8px 50px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {stepIdx === 1 && <MockCreateRfq badgeColor={def.badgeColor} />}
        {stepIdx === 2 && <MockProductDetail badgeColor={def.badgeColor} />}
        {stepIdx === 3 && <MockMessages badgeColor={def.badgeColor} />}
        {stepIdx === 4 && <MockRfqDetail badgeColor={def.badgeColor} />}
        {stepIdx === 5 && <MockOrderDetail badgeColor={def.badgeColor} />}
      </div>
    </>
  );
}

/* ─── Step definitions ──────────────────────────────────────────────────────── */
const STEPS: StepDef[] = [
  {
    route: '/factory-ideas',
    // Anchor to the actual "สินค้า" tab pill — text-search alone matched the
    // hero banner ("ค้นหาไอเดียสินค้าใหม่...") which contains the same word.
    targetSelector: '[data-tour="tab-product"]',
    targetTexts: ['สินค้า', 'ทั้งหมด'],
    spotlightRadius: 24,
    spotlightPad: 6,
    badgeColor: '#A238FF',
    icon: '🔍',
    badge: 'ขั้นตอนที่ 1 / 7',
    title: 'เลือกดูสินค้าและโรงงาน',
    desc: 'เลือกดูสินค้าตัวอย่าง วัตถุดิบ และโรงงานที่สนใจ กรองตามหมวดหมู่ tab ด้านบน หรือค้นหาโดยตรงได้เลย',
    tip: '💡 กด tab "สินค้า" เพื่อดูตัวอย่างที่โรงงานเคยผลิต',
  },
  {
    // Navigate to home where both targets exist:
    //   - Desktop: sidebar "สร้างคำขอราคา" button
    //   - Mobile : floating "+" FAB at bottom-right
    // findTarget picks the first visible match → adapts to viewport.
    route: '/',
    targetSelector: '[data-tour="create-rfq-cta"], [data-tour="fab"]',
    targetTexts: ['สร้างคำขอราคา'],
    spotlightRadius: 12,
    spotlightPad: 8,
    cardPlacement: 'top', // FAB sits at bottom-right → keep card up top from the start
    badgeColor: '#F28A2E',
    icon: '➕',
    badge: 'ขั้นตอนที่ 2 / 7',
    title: 'กดปุ่มสร้างคำขอราคา',
    desc: 'เมื่อต้องการเริ่มต้น กดปุ่ม "สร้างคำขอราคา" ที่ sidebar (Desktop) หรือ ปุ่มลอย "+" มุมขวาล่าง (Mobile) เพื่อเข้าสู่ฟอร์มสร้าง คำขอราคา',
    tip: '➕ ปุ่มนี้จะอยู่กับคุณตลอดทุกหน้า กดได้เมื่อพร้อม',
  },
  {
    route: '/create-rfq',
    targetSelector: '[data-tour="request-kind"]',
    targetTexts: ['ประเภทคำขอ', 'ขอตัวอย่างสินค้า', 'ขอราคาผลิต'],
    spotlightRadius: 14,
    spotlightPad: 10,
    badgeColor: '#F28A2E',
    icon: '📋',
    badge: 'ขั้นตอนที่ 3 / 7',
    title: 'เลือกประเภทคำขอที่เหมาะกับคุณ',
    desc: 'นอกจาก "ขอราคาผลิต OEM" แล้ว คุณยังสามารถเลือก "ขอตัวอย่างสินค้า" หรือ "ขอตัวอย่างวัตถุดิบ" ได้ฟรี เพื่อทดลองคุณภาพก่อนสั่งจริง',
    tip: '📋 แนะนำเริ่มจาก "ขอตัวอย่างสินค้า" ถ้ายังไม่แน่ใจคุณภาพโรงงาน',
  },
  {
    route: '/product-detail?showcase_id=14',
    mockScenario: 'product',
    targetTexts: ['แชทกับโรงงาน', 'แชท'],
    spotlightRadius: 12,
    cardPlacement: 'top', // chat CTA sits in bottom action bar
    badgeColor: '#0D9488',
    icon: '💬',
    badge: 'ขั้นตอนที่ 4 / 7',
    title: 'แชทกับโรงงานที่สนใจ',
    desc: 'กดปุ่ม "แชทกับโรงงาน" เพื่อคุยรายละเอียดโดยตรง ปรับแบบ ขอตัวอย่าง หรือต่อรองราคาได้เลย',
    tip: '💬 โรงงานใน Tryly ทุกรายพร้อมตอนกลับลูกค้าทุกท่าน',
  },
  {
    route: `/messages/${TOUR_MESSAGES_CONV_ID}`,
    mockScenario: 'messages',
    targetTexts: ['📎', 'แนบ RFQ', 'RFQ', 'พิมพ์ข้อความ'],
    spotlightRadius: 10,
    cardPlacement: 'top', // chat input + RFQ attach btn sit at bottom of viewport
    badgeColor: '#3B82F6',
    icon: '📩',
    badge: 'ขั้นตอนที่ 5 / 7',
    title: 'ส่ง คำขอราคา ให้โรงงานใน Chat',
    desc: 'แนบคำขอราคาที่สร้างไว้ในห้องแชท เพื่อให้โรงงานส่งใบเสนอราคาอย่างเป็นทางการกลับมา',
    tip: '📩 โรงงานจะส่งใบเสนอราคาผ่าน Chat และในหน้า คำขอราคา & คำสั่งงาน',
  },
  {
    route: '/rfqs/28',
    mockScenario: 'rfq',
    targetTexts: ['ยอมรับข้อเสนอ', 'ยอมรับ', 'ข้อเสนอ', 'AI แนะนำ', 'ใบเสนอราคา'],
    spotlightRadius: 12,
    badgeColor: '#7C3AED',
    icon: '⚖️',
    badge: 'ขั้นตอนที่ 6 / 7',
    title: 'เปรียบเทียบและยอมรับข้อเสนอ',
    desc: 'ดูรายละเอียดใบเสนอราคาจากหลายโรงงาน เปรียบเทียบราคา เงื่อนไข และยอมรับข้อเสนอได้',
    tip: '⚖️ ระบบจะแนะนำโรงงานที่คุ้มค่าที่สุดสำหรับงานของคุณ',
  },
  {
    route: '/orders/17',
    mockScenario: 'order',
    targetTexts: ['การผลิต', 'ภาพรวม', 'กำลังผลิต', 'ชำระ'],
    spotlightRadius: 12,
    badgeColor: '#22C55E',
    icon: '✅',
    badge: 'ขั้นตอนที่ 7 / 7',
    title: 'จ่ายเงินและติดตามสถานะ',
    desc: 'ชำระเงินผ่านระบบ Tryly แล้วติดตามสถานะการผลิตจนถึงมือคุณ',
    tip: '🔒 เงินจะโอนให้โรงงานเมื่อคุณรับสินค้าแล้วเท่านั้น',
  },
];

/** True if element has a non-zero bounding box (i.e. actually rendered + visible). */
function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

/* ─── Find target element (for real-page steps) ─────────────────────────────── */
function findTarget(def: StepDef): Element | null {
  if (def.targetSelector) {
    // querySelectorAll allows comma-separated fallback selectors — pick the
    // first one that is actually rendered + visible (hidden via CSS gives 0×0).
    const candidates = Array.from(document.querySelectorAll(def.targetSelector));
    const visible = candidates.find(isVisible);
    if (visible) return visible;
  }
  if (def.targetTexts) {
    // Pass 1: prefer interactive elements
    const interactiveSel = 'button, a, [role="button"], [role="tab"], input';
    for (const text of def.targetTexts) {
      const matches = Array.from(document.querySelectorAll(interactiveSel));
      const found = matches.find((el) => {
        // Skip elements inside the tour card itself (z-index 9999)
        const card = el.closest('[style*="z-index: 9999"]');
        if (card) return false;
        if (!isVisible(el)) return false;
        const t = (el.textContent || '').trim();
        const ph = (el as HTMLInputElement).placeholder || '';
        return t.includes(text) || ph.includes(text);
      });
      if (found) return found;
    }
    // Pass 2: fall back to any visible element with the text (heading, span, div)
    for (const text of def.targetTexts) {
      const all = Array.from(document.querySelectorAll('h1, h2, h3, p, span, div'));
      const found = all.find((el) => {
        if (el.closest('[style*="z-index: 9999"]')) return false;
        if (!isVisible(el)) return false;
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent || '')
          .join('')
          .trim();
        return own.includes(text);
      });
      if (found) return found;
    }
  }
  return null;
}

/* ─── SVG Spotlight overlay (for real-page steps) ──────────────────────────── */
function SpotlightOverlay({
  rect, color, radius, onClickOutside,
}: { rect: DOMRect | null; color: string; radius: number; onClickOutside: () => void; }) {
  const PAD = 8;
  const uniqueId = `tour-mask-${color.replace('#', '')}`;
  return (
    <svg
      onClick={onClickOutside}
      style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'all', cursor: 'default', width: '100%', height: '100%' }}
    >
      <defs>
        <mask id={uniqueId}>
          <rect width="100%" height="100%" fill="white" />
          {rect && <rect x={rect.left - PAD} y={rect.top - PAD} width={rect.width + PAD * 2} height={rect.height + PAD * 2} rx={radius} fill="black" />}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.70)" mask={`url(#${uniqueId})`} />
      {rect && (
        <rect className="tour-ring" x={rect.left - PAD} y={rect.top - PAD} width={rect.width + PAD * 2} height={rect.height + PAD * 2} rx={radius} fill="none" stroke={color} strokeWidth="3" />
      )}
    </svg>
  );
}

/* ─── Tour card (bottom tooltip) ────────────────────────────────────────────── */
function TourCard({
  stepIdx, def, total, rect, isMock, onPrev, onNext, onClose,
}: {
  stepIdx: number; def: StepDef; total: number; rect: DOMRect | null; isMock: boolean;
  onPrev: () => void; onNext: () => void; onClose: () => void;
}) {
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === total - 1;
  const wh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const ww = typeof window !== 'undefined' ? window.innerWidth : 400;

  // Decide card placement:
  //  - explicit `def.cardPlacement` ('top' | 'bottom') wins immediately,
  //    avoiding the bottom→top flash that 'auto' produces while waiting
  //    for `rect` to compute on slower mobile devices.
  //  - 'auto' falls back to rect-based heuristic.
  const placeAtTop = (() => {
    if (def.cardPlacement === 'top') return true;
    if (def.cardPlacement === 'bottom') return false;
    return !isMock && rect ? rect.top > wh * 0.5 : false;
  })();
  // Arrow direction: when card is at TOP, arrow points DOWN to target below.
  // When card is at BOTTOM, arrow points UP to target above (only when target
  // sits in upper half so the arrow actually meets the spotlight).
  const arrowDown = placeAtTop && rect != null;
  const arrowUp = !placeAtTop && !isMock && rect ? rect.bottom < wh * 0.55 : false;

  return (
    <div
      key={stepIdx}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        ...(placeAtTop ? { top: 16 } : { bottom: 16 }),
        left: 12, right: 12, zIndex: 9999,
        maxWidth: 440, margin: '0 auto',
        background: '#FFFFFF', borderRadius: 20,
        boxShadow: placeAtTop
          ? '0 4px 40px rgba(0,0,0,0.28)'
          : '0 -4px 40px rgba(0,0,0,0.28)',
        overflow: 'visible',
        animation: 'tour-card-in 0.22s ease-out both',
      }}
    >
      {arrowUp && rect && (
        <div style={{
          position: 'absolute', bottom: '100%',
          left: Math.min(Math.max(rect.left + rect.width / 2 - 24, 20), ww - 60),
          width: 0, height: 0,
          borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
          borderBottom: `12px solid ${def.badgeColor}`, marginBottom: -1, pointerEvents: 'none',
        }} />
      )}
      {arrowDown && rect && (
        <div style={{
          position: 'absolute', top: '100%',
          left: Math.min(Math.max(rect.left + rect.width / 2 - 24, 20), ww - 60),
          width: 0, height: 0,
          borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
          borderTop: `12px solid ${def.badgeColor}`, marginTop: -1, pointerEvents: 'none',
        }} />
      )}
      <div style={{ height: 4, borderRadius: '20px 20px 0 0', background: `linear-gradient(90deg, ${def.badgeColor} 0%, #A238FF 100%)` }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: `${def.badgeColor}18`, border: `1px solid ${def.badgeColor}30` }}>
            {def.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${def.badgeColor}18`, color: def.badgeColor, border: `1px solid ${def.badgeColor}30`, display: 'inline-block', marginBottom: 4 }}>
              {def.badge}
            </span>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1A0A2E', lineHeight: 1.3, margin: 0 }}>{def.title}</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7, marginBottom: 10 }}>{def.desc}</p>
        <div style={{ fontSize: 11.5, fontWeight: 600, padding: '7px 11px', borderRadius: 10, marginBottom: 14, background: `${def.badgeColor}12`, border: `1px solid ${def.badgeColor}25`, color: def.badgeColor }}>
          {def.tip}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{ width: i === stepIdx ? 20 : 6, height: 6, borderRadius: 99, background: i === stepIdx ? def.badgeColor : '#E5E7EB', transition: 'all 0.25s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {!isFirst ? (
              <button type="button" onClick={onPrev} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, padding: '7px 13px', borderRadius: 99, border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer' }}>
                <ChevronLeft size={13} /> ย้อนกลับ
              </button>
            ) : (
              <button type="button" onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: '7px 13px', borderRadius: 99, border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer' }}>
                ข้ามทัวร์
              </button>
            )}
            <button type="button" onClick={isLast ? onClose : onNext} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, padding: '7px 18px', borderRadius: 99, border: 'none', background: def.badgeColor, color: '#FFFFFF', cursor: 'pointer', boxShadow: `0 4px 14px ${def.badgeColor}55` }}>
              {isLast ? 'เริ่มเลย 🎉' : (<>ถัดไป <ChevronRight size={13} /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────────────── */
export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [autoShown, setAutoShown] = useState(false);
  const originPath = useRef('/');

  injectCSS();

  // Auto-open on first visit to explore home — guest only.
  // Once a user logs in, no longer auto-shows (they can still trigger via
  // the tryly-open-tour event from a help button).
  useEffect(() => {
    if (autoShown || open) return;
    if (location.pathname !== '/') return;
    if (isAuthenticated) {
      setAutoShown(true);
      return;
    }
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      const t = setTimeout(() => {
        setTourActive(true);
        setOpen(true);
        setAutoShown(true);
      }, 1200);
      return () => clearTimeout(t);
    }
    setAutoShown(true);
  }, [autoShown, open, location.pathname, isAuthenticated]);

  // Listen for manual trigger
  useEffect(() => {
    const handler = () => {
      originPath.current = location.pathname;
      setStep(0);
      setTourActive(true);
      setOpen(true);
    };
    window.addEventListener('tryly-open-tour', handler);
    return () => window.removeEventListener('tryly-open-tour', handler);
  }, [location.pathname]);

  // Activate / clear API mocks for this step's scenario.
  // Mocks must be installed BEFORE the page mounts (which fires its data fetch),
  // hence this effect runs first / synchronously on step change.
  useEffect(() => {
    if (!open) return;
    const def = STEPS[step];
    if (def.mockScenario) {
      activateTourMocks(def.mockScenario);
    } else {
      clearTourMocks();
    }
  }, [open, step]);

  // Navigate to step's route. Routes may include `?query` so we compare against
  // pathname+search (not pathname alone).
  useEffect(() => {
    if (!open) return;
    const def = STEPS[step];
    if (!def.route) return;
    const current = `${location.pathname}${location.search}`;
    if (current !== def.route) {
      navigate(def.route);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  // After navigation lands, find + highlight target element.
  useEffect(() => {
    if (!open) return;
    const def = STEPS[step];
    if (!def.route) { setTargetRect(null); return; }
    const current = `${location.pathname}${location.search}`;
    if (current !== def.route) { setTargetRect(null); return; }

    const t = setTimeout(() => {
      const el = findTarget(def);
      if (!el) { setTargetRect(null); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
    }, 700);
    return () => clearTimeout(t);
  }, [open, step, location.pathname, location.search]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Public routes the guest is allowed to land on after tour ends without
  // hitting AuthGuard → /login. Anything else: bounce to '/'.
  const isPublicRoute = useCallback((path: string) => {
    if (path === '/' || path === '/factory-ideas' || path === '/factories') return true;
    if (path.startsWith('/factories/')) return true;
    if (path.startsWith('/factory-ideas/')) return true;
    if (path === '/product-detail' || path === '/promotion-detail' || path === '/idea-detail') return true;
    return false;
  }, []);

  /**
   * Common close-flow: navigate to a safe public route FIRST, then defer
   * `setTourActive(false)` to the next tick so React Router has time to
   * unmount the protected-route AuthGuard before the auth bluff goes away.
   * Without the defer, AuthGuard re-renders in the same batch with
   * isAuth=false and bounces the guest to /login.
   */
  const closeTo = useCallback((target: string) => {
    localStorage.setItem(TOUR_KEY, '1');
    clearTourMocks();
    // Hide the tour UI immediately for snappy feel.
    setOpen(false);
    setTargetRect(null);
    // Navigate to target if not already there.
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
    // Defer tour-active flip — let the route transition flush first.
    window.setTimeout(() => setTourActive(false), 50);
  }, [location.pathname, navigate]);

  const handleClose = useCallback(() => {
    const target = isPublicRoute(originPath.current) ? originPath.current : '/';
    closeTo(target);
  }, [closeTo, isPublicRoute]);

  const handleFinish = useCallback(() => {
    // Always send guest to home so they can keep browsing — no forced login.
    closeTo('/');
  }, [closeTo]);

  // NOTE: tour-active flag is managed *explicitly* by handlers (handler
  // sets it true on open; closeTo defers it to false 50ms after navigate).
  // Don't sync it from `open` via useEffect — that fires synchronously on
  // setOpen(false) and yanks AuthContext.isAuthenticated to false BEFORE
  // the route transition completes, which kicks the guest to /login.

  // Safety net — clear mocks + tour-active flag if tour unmounts.
  useEffect(() => {
    return () => {
      clearTourMocks();
      setTourActive(false);
    };
  }, []);

  const handleNext = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  if (!open) return null;

  const def = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <SpotlightOverlay
        rect={targetRect}
        color={def.badgeColor}
        radius={def.spotlightRadius ?? 12}
        onClickOutside={handleClose}
      />
      <TourCard
        stepIdx={step}
        def={def}
        total={STEPS.length}
        rect={targetRect}
        isMock={false}
        onPrev={handlePrev}
        onNext={isLast ? handleFinish : handleNext}
        onClose={handleClose}
      />
    </>
  );
}
