import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { activateTourMocks, clearTourMocks, setTourActive } from '@/utils/tourMocks';
import { formatCurrency } from '@/utils/formatting';
import { useAuth } from '@/stores';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TOUR_STEPS } from '@/components/features/explore/product-tour/tourSteps';
import { injectTourCSS } from '@/components/features/explore/product-tour/tourStyles';
import { TourCard } from '@/components/features/explore/product-tour/TourCard';
import { SpotlightOverlay } from '@/components/features/explore/product-tour/TourSpotlight';
import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';
import { Image } from '@/components/ui/image';

export const TOUR_KEY = 'tryly_tour_seen_v1';

function MockStatusBar() {
  return (
    <div
      style={{
        background: 'var(--neutral-white)',
        padding: '5px 14px 3px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-text)' }}>9:41</span>
      <span style={{ fontSize: 9, color: 'var(--neutral-placeholder)', letterSpacing: 2 }}>
        ● ● ●
      </span>
      <span style={{ fontSize: 10, color: 'var(--neutral-text)' }}>🔋 100%</span>
    </div>
  );
}

function MockNav({ title, showBack = true }: { title?: string; showBack?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--neutral-white)',
        padding: '8px 14px',
        borderBottom: '1px solid var(--neutral-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
    >
      {showBack && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'var(--neutral-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: 'var(--neutral-text)',
          }}
        >
          ←
        </div>
      )}
      {title ? (
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--brand-ink)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      ) : (
        <Image
          src='/assets/tryly-logo.png'
          alt='Tryly'
          style={{ height: 26, objectFit: 'contain' }}
        />
      )}
    </div>
  );
}

function MockCreateRfq({ badgeColor }: { badgeColor: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title='ส่งคำขอราคา (RFQ)' />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 14px 20px',
          background: 'var(--neutral-surface)',
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {['ของเล่นสัตว์เลี้ยง', 'อาหารสัตว์', 'เสื้อผ้าสัตว์เลี้ยง'].map((c, i) => (
            <span
              key={c}
              style={{
                padding: '5px 12px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                background: i === 0 ? badgeColor : 'var(--neutral-muted)',
                color: i === 0 ? 'var(--neutral-white)' : 'var(--neutral-text)',
                border: i === 0 ? 'none' : '1px solid var(--neutral-border)',
              }}
            >
              {c}
            </span>
          ))}
        </div>

        {[
          {
            label: 'ชื่อโปรเจกต์',
            placeholder: 'เช่น ของเล่นแมวยางธรรมชาติ',
            value: 'ของเล่นแมว MOQ 100 ชิ้น',
            filled: true,
          },
          {
            label: 'รายละเอียดสินค้า',
            placeholder: 'อธิบายสินค้าที่ต้องการผลิต...',
            value: 'ต้องการผลิตของเล่นแมวจากยางธรรมชาติ ปลอดภัยสำหรับสัตว์เลี้ยง ขนาด 5–8 ซม.',
            filled: true,
            multiline: true,
          },
          { label: 'จำนวนที่ต้องการ (ชิ้น)', placeholder: '100', value: '100', filled: true },
          { label: 'งบประมาณ (บาท)', placeholder: '10,000', value: '5,000', filled: true },
          {
            label: 'วัสดุที่ต้องการ',
            placeholder: 'เช่น ยางธรรมชาติ, พลาสติก ABS',
            value: 'ยางธรรมชาติปลอดสาร BPA',
            filled: true,
          },
        ].map((f) => (
          <div key={f.label} style={{ marginBottom: 12 }}>
            <Label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--neutral-text)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {f.label}
            </Label>
            <div
              style={{
                background: f.filled ? 'var(--neutral-white)' : 'var(--neutral-surface)',
                borderRadius: 10,
                padding: f.multiline ? '9px 12px' : '9px 12px',
                border: `1.5px solid ${f.filled ? '#E9D5FF' : 'var(--neutral-border)'}`,
                fontSize: 12,
                color: f.filled ? 'var(--neutral-black)' : 'var(--neutral-placeholder)',
                minHeight: f.multiline ? 56 : 'auto',
                lineHeight: 1.5,
              }}
            >
              {f.filled ? f.value : f.placeholder}
            </div>
          </div>
        ))}

        <div style={{ marginBottom: 12 }}>
          <Label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--neutral-text)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            กำหนดส่ง
          </Label>
          <div
            style={{
              background: 'var(--neutral-white)',
              borderRadius: 10,
              padding: '9px 12px',
              border: '1.5px solid #E9D5FF',
              fontSize: 12,
              color: 'var(--neutral-black)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>15 มี.ค. 2569</span>
            <span style={{ color: 'var(--neutral-placeholder)' }}>📅</span>
          </div>
        </div>

        <Button
          variant='unstyled'
          type='button'
          className='tour-btn-glow'
          style={
            {
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: badgeColor,
              color: 'var(--neutral-white)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'default',
              marginTop: 4,
              '--tour-glow': 'rgba(242,138,46,0.55)',
              '--tour-glow-soft': 'rgba(242,138,46,0.28)',
            } as React.CSSProperties
          }
        >
          📋 ส่งคำขอราคาให้โรงงาน
        </Button>
      </div>
    </div>
  );
}

function MockProductDetail({ badgeColor }: { badgeColor: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav />

      <div
        style={{
          flexShrink: 0,
          height: 185,
          position: 'relative',
          background: 'var(--neutral-border)',
          overflow: 'hidden',
        }}
      >
        <Image
          src='https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=500&h=300&fit=crop'
          alt='ของเล่นแมว'
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 30,
            height: 30,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.52)',
            color: 'var(--neutral-white)',
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 20,
          }}
        >
          1 / 2
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 6,
          padding: '6px 12px',
          background: 'var(--neutral-white)',
          borderBottom: '1px solid var(--neutral-muted)',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            background: 'var(--neutral-border)',
            overflow: 'hidden',
            border: '2px solid var(--brand-purple)',
          }}
        >
          <Image
            src='https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=80&h=80&fit=crop'
            alt=''
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            background: 'var(--neutral-border)',
            overflow: 'hidden',
          }}
        >
          <Image
            src='https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=80&h=80&fit=crop'
            alt=''
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px 0',
          background: 'var(--neutral-white)',
        }}
      >
        <div
          style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-orange)', marginBottom: 7 }}
        >
          ฿40
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          <span
            style={{
              background: '#EEF2FF',
              color: 'var(--brand-indigo-dark)',
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 99,
              fontWeight: 700,
            }}
          >
            ⭕ Preferred
          </span>
          <span
            style={{
              background: 'var(--neutral-muted)',
              color: 'var(--neutral-text)',
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 99,
            }}
          >
            สินค้า
          </span>
          <span
            style={{
              background: 'var(--neutral-muted)',
              color: 'var(--neutral-text)',
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 99,
            }}
          >
            ของเล่นสัตว์เลี้ยง
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-ink)', marginBottom: 7 }}>
          ของเล่นแมว
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--neutral-placeholder)',
            marginBottom: 10,
            paddingBottom: 10,
            borderBottom: '1px solid var(--neutral-muted)',
          }}
        >
          <span style={{ color: '#FBBF24', fontWeight: 600 }}>★ 0.0</span>
          <span>0 รีวิว</span>
          <span>•</span>
          <span>♡ 1 สนใจ</span>
        </div>
        {[
          ['ขั้นต่ำผลิต', '100 ชิ้น (MOQ)'],
          ['สถานที่ผลิต', '📍 กรุงเทพมหานคร'],
          ['เผยแพร่', '25 เม.ย. 2569'],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '7px 0',
              borderBottom: '1px solid var(--neutral-surface)',
              fontSize: 12,
            }}
          >
            <span style={{ color: 'var(--neutral-subtle)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: 'var(--neutral-black)' }}>{value}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '9px 12px',
          background: 'var(--neutral-white)',
          borderTop: '1px solid var(--neutral-muted)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            padding: '0 8px',
            color: 'var(--neutral-subtle)',
            fontSize: 9,
          }}
        >
          <span style={{ fontSize: 16 }}>🏭</span>
          <span>โปรไฟล์</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            padding: '0 8px',
            color: 'var(--neutral-subtle)',
            fontSize: 9,
          }}
        >
          <span style={{ fontSize: 16 }}>♡</span>
          <span>1</span>
        </div>
        <Button
          variant='unstyled'
          type='button'
          className='tour-btn-glow'
          style={
            {
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              border: 'none',
              background: badgeColor,
              color: 'var(--neutral-white)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              '--tour-glow': 'rgba(13,148,136,0.55)',
              '--tour-glow-soft': 'rgba(13,148,136,0.28)',
            } as React.CSSProperties
          }
        >
          💬 แชทกับโรงงาน
        </Button>
      </div>
    </div>
  );
}

function MockMessages({ badgeColor }: { badgeColor: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title='ของเล่นสัตว์เลี้ยง แฮปปี้' />

      <div
        style={{
          flexShrink: 0,
          padding: '7px 12px',
          background: 'var(--brand-panel-hover)',
          borderBottom: '1px solid var(--brand-violet-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 13 }}>📋</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-violet)' }}>
          RFQ: ของเล่นแมว
        </span>
        <span
          style={{
            background: 'var(--brand-violet-soft)',
            color: 'var(--brand-violet)',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 99,
          }}
        >
          รอข้อเสนอ
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          background: '#FAFAFA',
        }}
      >
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--brand-purple)1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            🏭
          </div>
          <div style={{ maxWidth: '78%' }}>
            <div
              style={{
                background: 'var(--neutral-white)',
                padding: '7px 11px',
                borderRadius: '10px 10px 10px 2px',
                fontSize: 12,
                color: 'var(--neutral-text)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                lineHeight: 1.5,
              }}
            >
              สวัสดีครับ! สนใจสินค้าตัวไหนครับ? 🐾
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--neutral-placeholder)',
                marginTop: 2,
                paddingLeft: 3,
              }}
            >
              10:32 น.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ maxWidth: '78%' }}>
            <div
              style={{
                background: 'var(--brand-purple)',
                padding: '7px 11px',
                borderRadius: '10px 10px 2px 10px',
                fontSize: 12,
                color: 'var(--neutral-white)',
                lineHeight: 1.5,
              }}
            >
              สวัสดีค่ะ อยากได้ของเล่นแมว MOQ 100 ชิ้น ราคาต่อชิ้นเท่าไหร่คะ?
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--neutral-placeholder)',
                marginTop: 2,
                textAlign: 'right',
                paddingRight: 3,
              }}
            >
              10:35 น.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--brand-purple)1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            🏭
          </div>
          <div style={{ maxWidth: '78%' }}>
            <div
              style={{
                background: 'var(--neutral-white)',
                padding: '7px 11px',
                borderRadius: '10px 10px 10px 2px',
                fontSize: 12,
                color: 'var(--neutral-text)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                lineHeight: 1.5,
              }}
            >
              ราคา 40 บาท/ชิ้นครับ กรุณาส่ง RFQ
              มาเพื่อยืนยันรายละเอียดและรับใบเสนอราคาอย่างเป็นทางการ 🙏
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--neutral-placeholder)',
                marginTop: 2,
                paddingLeft: 3,
              }}
            >
              10:38 น.
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '8px 10px',
          background: 'var(--neutral-white)',
          borderTop: '1px solid var(--neutral-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Button
            variant='unstyled'
            type='button'
            className='tour-btn-glow'
            style={
              {
                padding: '8px 10px',
                borderRadius: 10,
                border: `1.5px solid ${badgeColor}`,
                background: `${badgeColor}14`,
                color: badgeColor,
                fontWeight: 700,
                fontSize: 11,
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '--tour-glow': 'rgba(59,130,246,0.55)',
                '--tour-glow-soft': 'rgba(59,130,246,0.25)',
              } as React.CSSProperties
            }
          >
            📎 แนบ RFQ
          </Button>
          <div
            style={{
              flex: 1,
              background: 'var(--neutral-surface)',
              borderRadius: 20,
              padding: '7px 12px',
              fontSize: 12,
              color: 'var(--neutral-placeholder)',
              border: '1px solid var(--neutral-muted)',
            }}
          >
            พิมพ์ข้อความ...
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--brand-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 13,
              color: 'var(--neutral-white)',
            }}
          >
            ➤
          </div>
        </div>
      </div>
    </div>
  );
}

function MockRfqDetail({ badgeColor }: { badgeColor: string }) {
  const offers = [
    {
      name: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม',
      price: 42000,
      leadTime: 8,
      rating: 4.9,
      verified: true,
      recommended: true,
      reason: 'ราคาคุ้มค่าที่สุด + งานไวสุด',
    },
    {
      name: 'แพ็กเกจจิ้งสัตว์เลี้ยง โปร',
      price: 38500,
      leadTime: 12,
      rating: 4.6,
      verified: false,
      recommended: false,
      reason: 'ราคาถูกที่สุด แต่ lead time นานกว่า',
    },
    {
      name: 'ของเล่นสัตว์เลี้ยง แฮปปี้',
      price: 48000,
      leadTime: 7,
      rating: 4.8,
      verified: true,
      recommended: false,
      reason: 'ส่งเร็วที่สุด แต่ราคาสูงกว่า',
    },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title='คำขอผลิต: อาหารสัตว์แห้ง' />

      <div
        style={{
          flexShrink: 0,
          padding: '9px 14px',
          background: '#F0FDF4',
          borderBottom: '1px solid #BBF7D0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--neutral-subtle)', marginBottom: 2 }}>
              🐾 อาหารสัตว์ • 1,000 ชิ้น
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>
              ✅ ได้รับ 3 ข้อเสนอแล้ว
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--neutral-subtle)', textAlign: 'right' }}>
            <div>งบประมาณ ฿50,000</div>
            <div>ส่งมอบ 15 มี.ค. 69</div>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          background: 'var(--neutral-surface)',
        }}
      >
        {offers.map((o, i) => (
          <div
            key={i}
            style={{
              background: 'var(--neutral-white)',
              borderRadius: 14,
              padding: '11px 12px',
              border: o.recommended
                ? `2px solid ${badgeColor}`
                : '1.5px solid var(--neutral-muted)',
              boxShadow: o.recommended
                ? `0 4px 18px ${badgeColor}25`
                : '0 1px 4px rgba(0,0,0,0.05)',
              position: 'relative',
            }}
          >
            {o.recommended && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 12,
                  transform: 'translateY(-50%)',
                  background: badgeColor,
                  color: 'var(--neutral-white)',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 99,
                }}
              >
                🤖 AI แนะนำ
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 5,
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--neutral-black)',
                    marginBottom: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {o.name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--neutral-subtle)' }}>
                  ⏱ {o.leadTime} วัน &nbsp;⭐ {o.rating}{' '}
                  {o.verified ? (
                    <span style={{ color: 'var(--status-success-bright)', fontWeight: 600 }}>
                      ✓ ยืนยัน
                    </span>
                  ) : null}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--neutral-black)' }}>
                  {formatCurrency(o.price, 'THB')}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--neutral-placeholder)' }}>รวมทั้งหมด</div>
              </div>
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--neutral-subtle)',
                background: 'var(--neutral-surface)',
                borderRadius: 8,
                padding: '4px 8px',
                marginBottom: o.recommended ? 8 : 0,
              }}
            >
              💡 {o.reason}
            </div>
            {o.recommended && (
              <Button
                variant='unstyled'
                type='button'
                className='tour-btn-glow'
                style={
                  {
                    width: '100%',
                    padding: '9px',
                    borderRadius: 10,
                    border: 'none',
                    background: badgeColor,
                    color: 'var(--neutral-white)',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'default',
                    '--tour-glow': 'rgba(124,58,237,0.55)',
                    '--tour-glow-soft': 'rgba(124,58,237,0.28)',
                  } as React.CSSProperties
                }
              >
                ✓ ยอมรับข้อเสนอนี้
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockOrderDetail({ badgeColor }: { badgeColor: string }) {
  const timeline = [
    {
      title: 'ยืนยันคำสั่งซื้อ',
      date: '15 ม.ค. 2569',
      status: 'done',
      desc: 'ชำระมัดจำและยืนยันแล้ว',
    },
    {
      title: 'จัดซื้อวัตถุดิบ',
      date: '18 ม.ค. 2569',
      status: 'done',
      desc: 'ไนลอนและหนังสังเคราะห์พร้อมแล้ว',
    },
    {
      title: 'เริ่มกระบวนการผลิต',
      date: '22 ม.ค. 2569',
      status: 'done',
      desc: 'ตัดเย็บและประกอบตามแบบ',
    },
    {
      title: 'Quality Check ครั้งที่ 1',
      date: '5 ก.พ. 2569',
      status: 'current',
      desc: 'ตรวจสอบความแข็งแรงของชิ้นงาน',
    },
    { title: 'บรรจุและติดฉลาก', date: '', status: 'pending', desc: '' },
    { title: 'QC ขั้นสุดท้ายและจัดส่ง', date: '', status: 'pending', desc: '' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MockStatusBar />
      <MockNav title='คำสั่งซื้อ: สายจูงสัตว์เลี้ยง' />
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--neutral-surface)' }}>
        <div style={{ padding: '10px 12px 0' }}>
          <div
            style={{
              background: 'var(--neutral-white)',
              borderRadius: 14,
              padding: 12,
              border: '1px solid var(--neutral-muted)',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--brand-ink)',
                    marginBottom: 3,
                  }}
                >
                  สายจูงและปลอกคอสัตว์เลี้ยง
                </div>
                <div style={{ fontSize: 11, color: 'var(--brand-violet)' }}>
                  ของเล่นสัตว์เลี้ยง แฮปปี้ • 500 ชิ้น
                </div>
              </div>
              <span
                style={{
                  background: 'var(--status-warning-soft)',
                  color: 'var(--status-warning-deep)',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 99,
                  whiteSpace: 'nowrap',
                }}
              >
                กำลังผลิต
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--neutral-subtle)',
                marginBottom: 4,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>ความคืบหน้า</span>
              <span style={{ fontWeight: 700, color: badgeColor }}>65%</span>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--neutral-muted)',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '65%',
                  background: `linear-gradient(90deg, ${badgeColor}, var(--brand-purple))`,
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ padding: '0 12px 10px' }}>
          <div
            style={{
              background: 'var(--neutral-white)',
              borderRadius: 14,
              padding: 12,
              border: '1.5px solid var(--neutral-muted)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--neutral-black)',
                marginBottom: 8,
              }}
            >
              💳 สรุปการชำระเงิน (Escrow)
            </div>
            {[
              ['ยอดรวม', '฿42,000', false],
              ['ชำระมัดจำแล้ว', '฿21,000 ✓', true],
              ['ยอดที่ต้องชำระ', '฿21,000', false],
            ].map(([label, val, green]) => (
              <div
                key={label as string}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 5,
                }}
              >
                <span style={{ color: 'var(--neutral-subtle)' }}>{label}</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: green ? 'var(--status-success-bright)' : 'var(--neutral-black)',
                  }}
                >
                  {val}
                </span>
              </div>
            ))}
            <Button
              variant='unstyled'
              type='button'
              className='tour-btn-glow'
              style={
                {
                  width: '100%',
                  marginTop: 8,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: badgeColor,
                  color: 'var(--neutral-white)',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'default',
                  '--tour-glow': 'rgba(34,197,94,0.55)',
                  '--tour-glow-soft': 'rgba(34,197,94,0.28)',
                } as React.CSSProperties
              }
            >
              💰 ชำระยอดที่เหลือ ฿21,000
            </Button>
          </div>
        </div>

        <div style={{ padding: '0 12px 14px' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--neutral-black)',
              marginBottom: 9,
            }}
          >
            📋 ความคืบหน้าการผลิต
          </div>
          {timeline.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background:
                      t.status === 'done'
                        ? 'var(--status-success-bright)'
                        : t.status === 'current'
                          ? badgeColor
                          : 'var(--neutral-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'var(--neutral-white)',
                    fontWeight: 700,
                  }}
                >
                  {t.status === 'done' ? '✓' : t.status === 'current' ? '●' : ''}
                </div>
                {i < timeline.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 14,
                      background:
                        t.status === 'done' ? 'var(--status-success-soft)' : 'var(--neutral-muted)',
                      margin: '2px 0',
                    }}
                  />
                )}
              </div>
              <div style={{ paddingTop: 1, paddingBottom: 6 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: t.status === 'current' ? 700 : 500,
                    color:
                      t.status === 'pending'
                        ? 'var(--neutral-placeholder)'
                        : 'var(--neutral-black)',
                    lineHeight: 1.3,
                  }}
                >
                  {t.title}
                </div>
                {t.date && (
                  <div style={{ fontSize: 10, color: 'var(--neutral-placeholder)', marginTop: 1 }}>
                    {t.date}
                  </div>
                )}
                {t.status === 'current' && (
                  <div style={{ fontSize: 10, color: badgeColor, fontWeight: 600, marginTop: 2 }}>
                    ● กำลังดำเนินการ
                  </div>
                )}
                {t.desc && t.status !== 'current' && (
                  <div style={{ fontSize: 10, color: 'var(--neutral-placeholder)', marginTop: 1 }}>
                    {t.desc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

function findTarget(def: TourStepDef): Element | null {
  if (def.targetSelector) {
    const candidates = Array.from(document.querySelectorAll(def.targetSelector));
    const visible = candidates.find(isVisible);
    if (visible) return visible;
  }
  if (def.targetTexts) {
    const interactiveSel = 'button, a, [role="button"], [role="tab"], input';
    for (const text of def.targetTexts) {
      const matches = Array.from(document.querySelectorAll(interactiveSel));
      const found = matches.find((el) => {
        const card = el.closest('[style*="z-index: 9999"]');
        if (card) return false;
        if (!isVisible(el)) return false;
        const t = (el.textContent || '').trim();
        const ph = (el as HTMLInputElement).placeholder || '';
        return t.includes(text) || ph.includes(text);
      });
      if (found) return found;
    }
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

export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [autoShown, setAutoShown] = useState(false);
  const originPath = useRef('/');

  injectTourCSS();

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

  useEffect(() => {
    if (!open) return;
    const def = TOUR_STEPS[step];
    if (def.mockScenario) {
      activateTourMocks(def.mockScenario);
    } else {
      clearTourMocks();
    }
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const def = TOUR_STEPS[step];
    if (!def.route) return;
    const current = `${location.pathname}${location.search}`;
    if (current !== def.route) {
      navigate(def.route);
    }
  }, [open, step, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!open) return;
    const def = TOUR_STEPS[step];
    if (!def.route) {
      setTargetRect(null);
      return;
    }
    const current = `${location.pathname}${location.search}`;
    if (current !== def.route) {
      setTargetRect(null);
      return;
    }

    const t = setTimeout(() => {
      const el = findTarget(def);
      if (!el) {
        setTargetRect(null);
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
    }, 700);
    return () => clearTimeout(t);
  }, [open, step, location.pathname, location.search]);

  const isPublicRoute = useCallback((path: string) => {
    if (path === '/' || path === '/factory-ideas' || path === '/factories') return true;
    if (path.startsWith('/factories/')) return true;
    if (path.startsWith('/factory-ideas/')) return true;
    if (path === '/product-detail' || path === '/promotion-detail' || path === '/idea-detail')
      return true;
    return false;
  }, []);

  const closeTo = useCallback(
    (target: string) => {
      localStorage.setItem(TOUR_KEY, '1');
      clearTourMocks();
      setOpen(false);
      setTargetRect(null);

      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
      window.setTimeout(() => setTourActive(false), 50);
    },
    [location.pathname, navigate],
  );

  const handleClose = useCallback(() => {
    const target = isPublicRoute(originPath.current) ? originPath.current : '/';
    closeTo(target);
  }, [closeTo, isPublicRoute]);

  const handleFinish = useCallback(() => {
    closeTo('/');
  }, [closeTo]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  useEffect(() => {
    return () => {
      clearTourMocks();
      setTourActive(false);
    };
  }, []);

  const handleNext = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setTargetRect(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  if (!open) return null;

  const def = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

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
        total={TOUR_STEPS.length}
        rect={targetRect}
        isMock={false}
        onPrev={handlePrev}
        onNext={isLast ? handleFinish : handleNext}
        onClose={handleClose}
      />
    </>
  );
}
