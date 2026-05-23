import { formatCurrency } from '@/utils/formatting/formatCurrency';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import {
  MockBottomAction,
  MockField,
  MockPill,
  MockScreen,
  TourGlowButton,
} from '@/components/features/explore/product-tour/TourMockPrimitives';
import {
  CREATE_RFQ_CATEGORIES,
  CREATE_RFQ_FIELDS,
  ORDER_PAYMENT_ROWS,
  ORDER_TIMELINE,
  PRODUCT_STATS,
  RFQ_OFFERS,
} from '@/components/features/explore/product-tour/tourMockData';

export function MockCreateRfq({ badgeColor }: { badgeColor: string }) {
  return (
    <MockScreen title='ส่งคำขอราคา (RFQ)'>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 14px 20px',
          background: 'var(--neutral-surface)',
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {CREATE_RFQ_CATEGORIES.map((c, i) => (
            <MockPill key={c} active={i === 0} color={badgeColor}>
              {c}
            </MockPill>
          ))}
        </div>

        {CREATE_RFQ_FIELDS.map((f) => (
          <MockField
            key={f.label}
            label={f.label}
            placeholder={f.placeholder}
            value={f.value}
            filled={f.filled}
            multiline={'multiline' in f ? f.multiline : false}
          />
        ))}

        <MockField label='กำหนดส่ง' value='15 มี.ค. 2569' trailing='📅' />

        <TourGlowButton
          color={badgeColor}
          glow='rgba(242,138,46,0.55)'
          glowSoft='rgba(242,138,46,0.28)'
          style={{ width: '100%', padding: 12, borderRadius: 12, fontSize: 14, marginTop: 4 }}
        >
          📋 ส่งคำขอราคาให้โรงงาน
        </TourGlowButton>
      </div>
    </MockScreen>
  );
}

export function MockProductDetail({ badgeColor }: { badgeColor: string }) {
  return (
    <MockScreen>

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
        {PRODUCT_STATS.map(([label, value]) => (
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
        <MockBottomAction icon='🏭' label='โปรไฟล์' />
        <MockBottomAction icon='♡' label='1' />
        <TourGlowButton
          color={badgeColor}
          glow='rgba(13,148,136,0.55)'
          glowSoft='rgba(13,148,136,0.28)'
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          💬 แชทกับโรงงาน
        </TourGlowButton>
      </div>
    </MockScreen>
  );
}

export function MockMessages({ badgeColor }: { badgeColor: string }) {
  return (
    <MockScreen title='ของเล่นสัตว์เลี้ยง แฮปปี้'>

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
    </MockScreen>
  );
}

export function MockRfqDetail({ badgeColor }: { badgeColor: string }) {
  return (
    <MockScreen title='คำขอผลิต: อาหารสัตว์แห้ง'>

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
        {RFQ_OFFERS.map((o, i) => (
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
    </MockScreen>
  );
}

export function MockOrderDetail({ badgeColor }: { badgeColor: string }) {
  return (
    <MockScreen title='คำสั่งซื้อ: สายจูงสัตว์เลี้ยง'>
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
            {ORDER_PAYMENT_ROWS.map(([label, val, green]) => (
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
          {ORDER_TIMELINE.map((t, i) => (
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
                {i < ORDER_TIMELINE.length - 1 && (
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
    </MockScreen>
  );
}
