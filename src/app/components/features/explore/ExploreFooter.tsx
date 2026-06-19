import React from 'react';
import { Facebook, Instagram, Youtube, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUPPORT_LINKS = [
  'ขั้นตอน "เปิดร้าน"',
  'เริ่มขายสินค้า/บริการ',
  'ติดต่อเรา',
  'ลงทะเบียนธุรกิจ',
  'ศูนย์ช่วยเหลือลูกค้า',
] as const;

const CATEGORY_COL_1 = [
  'โรงพยาบาลสัตว์',
  'อาบน้ำตัดขน',
  'รับฝากสัตว์เลี้ยง',
  'โรงเรียนฝึกสอน',
  'สระว่ายน้ำสุนัข',
  'คาเฟ่-ร้านอาหาร',
] as const;

const CATEGORY_COL_2 = [
  'อาหารสัตว์',
  'อุปกรณ์สัตว์เลี้ยง',
  'ห้องน้ำและทราย',
  'ทำความสะอาด',
  'ชุดสัตว์เลี้ยง',
  'ดูแลสุขภาพ',
] as const;

const KNOWLEDGE_LINKS = ['คูปอง', 'ค้นหาสถานที่และบริการ', 'บทความ', 'กิจกรรม', 'วิดีโอ'] as const;

const LEGAL_LINKS = [
  { label: 'เงื่อนไขในการให้บริการ', href: '#' },
  { label: 'นโยบายความปลอดภัย', href: '#' },
  { label: 'Cookie Policy', href: '#' },
] as const;

function FooterLinkList({ items }: { items: readonly string[] }) {
  return (
    <ul className='space-y-2 text-[11px] text-slate-600 md:text-xs'>
      {items.map((item) => (
        <li key={item}>
          <a href='#' className='transition-colors hover:text-brand-violet-deep'>
            {item}
          </a>
        </li>
      ))}
    </ul>
  );
}

function CategoryGrid() {
  return (
    <div className='grid grid-cols-2 gap-2 text-[11px] text-slate-600 md:text-xs'>
      <FooterLinkList items={CATEGORY_COL_1} />
      <FooterLinkList items={CATEGORY_COL_2} />
    </div>
  );
}

export function ExploreFooter() {
  const [open, setOpen] = React.useState<null | 'support' | 'categories' | 'knowledge' | 'apps'>(
    null,
  );
  const toggle = (key: 'support' | 'categories' | 'knowledge' | 'apps') =>
    setOpen((prev) => (prev === key ? null : key));

  return (
    <footer className='mt-5 w-full flex-shrink-0 border-t border-gray-100 bg-[var(--brand-page)] pt-3 md:mt-12 md:border-gray-200 md:bg-neutral-footer md:pt-10'>
      <div className='mx-auto max-w-[1600px] px-4 md:px-6'>
        {/* ── Mobile header strip ── */}
        <div className='mb-2.5 md:hidden'>
          <p className='text-[10px] font-semibold uppercase tracking-wider text-brand-orange-deep'>
            Tryly
          </p>
          <h2 className='text-[14px] font-bold text-brand-navy-deep'>ช่วยเหลือ & ลิงก์ด่วน</h2>
        </div>

        {/* ── Mobile accordions ── */}
        <div className='mb-3 space-y-1.5 md:hidden'>
          <AccordionItem
            title='ศูนย์ดูแลลูกค้า'
            open={open === 'support'}
            onToggle={() => toggle('support')}
          >
            <FooterLinkList items={SUPPORT_LINKS} />
          </AccordionItem>
          <AccordionItem
            title='หมวดหมู่บริการและสินค้า'
            open={open === 'categories'}
            onToggle={() => toggle('categories')}
          >
            <CategoryGrid />
          </AccordionItem>
          <AccordionItem
            title='แหล่งความรู้และคูปอง'
            open={open === 'knowledge'}
            onToggle={() => toggle('knowledge')}
          >
            <FooterLinkList items={KNOWLEDGE_LINKS} />
          </AccordionItem>
          <AccordionItem
            title='ดาวน์โหลดแอปพลิเคชัน'
            open={open === 'apps'}
            onToggle={() => toggle('apps')}
          >
            <AppDownloadBadges className='pt-0.5' />
          </AccordionItem>
        </div>

        {/* ── Desktop columns ── */}
        <div className='mb-7 hidden gap-4 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:mb-10'>
          <FooterColumn title='ศูนย์ดูแลลูกค้า' accent>
            <FooterLinkList items={SUPPORT_LINKS} />
          </FooterColumn>
          <FooterColumn title='หมวดหมู่บริการและสินค้า'>
            <CategoryGrid />
          </FooterColumn>
          <FooterColumn title='แหล่งความรู้และคูปอง'>
            <FooterLinkList items={KNOWLEDGE_LINKS} />
          </FooterColumn>
          <FooterColumn title='ดาวน์โหลดแอปพลิเคชัน'>
            <AppDownloadBadges />
          </FooterColumn>
        </div>

        {/* ── Trust & social ── */}
        <div className='rounded-xl border border-white/80 bg-white p-3 shadow-[0_4px_20px_rgba(46,34,82,0.04)] md:rounded-none md:border-0 md:border-t md:border-gray-300 md:bg-transparent md:p-0 md:py-6 md:shadow-none'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6'>
            <div>
              <h4 className='mb-2 text-[11px] font-bold text-brand-navy-deep md:mb-3 md:text-sm'>
                ติดตามเรา
              </h4>
              <div className='flex flex-wrap items-center gap-2.5'>
                <SocialChip href='#' label='Facebook' className='bg-[#1877F2]'>
                  <Facebook size={18} />
                </SocialChip>
                <SocialChip href='#' label='LINE' className='bg-[#00B900]'>
                  <span className='text-[10px] font-bold'>LINE</span>
                </SocialChip>
                <SocialChip href='#' label='YouTube' className='bg-[#FF0000]'>
                  <Youtube size={18} />
                </SocialChip>
                <SocialChip href='#' label='Instagram' className='bg-[#E4405F]'>
                  <Instagram size={18} />
                </SocialChip>
              </div>
            </div>

            <div className='max-md:hidden'>
              <h4 className='mb-3 text-xs font-bold text-brand-navy-deep md:text-sm'>การจัดส่ง</h4>
              <div className='flex flex-wrap items-center gap-2'>
                <TrustChip>KERRY</TrustChip>
                <TrustChip>FLASH</TrustChip>
                <TrustChip>EMS</TrustChip>
              </div>
            </div>

            <div className='max-md:hidden'>
              <h4 className='mb-3 text-xs font-bold text-brand-navy-deep md:text-sm'>
                ช่องทางการชำระเงิน
              </h4>
              <div className='flex flex-wrap items-center gap-2'>
                <TrustChip>VISA</TrustChip>
                <TrustChip>Mastercard</TrustChip>
                <TrustChip>PromptPay</TrustChip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Copyright bar — extends to screen bottom on mobile (nav floats over) ── */}
      <div className='mt-3 bg-brand-navy-ink text-white max-md:pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:mt-3'>
        <div className='mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-2.5 text-[9px] md:flex-row md:gap-3 md:px-6 md:py-3 md:text-xs'>
          <div className='text-center md:text-left'>
            &copy; 2026 Tryly Shopping. By Digital Media Advertising Co., Ltd.
          </div>
          <div className='hidden flex-wrap items-center justify-center gap-3 md:flex md:gap-6'>
            {LEGAL_LINKS.map((link) => (
              <a key={link.label} href={link.href} className='hover:underline'>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

const APP_STORE_BADGE = {
  src: '/assets/badges/download-on-the-app-store-apple-logo.svg',
  alt: 'Download on the App Store',
  width: 540,
  height: 160,
} as const;

const GOOGLE_PLAY_BADGE = {
  src: '/assets/badges/google-play-badge-logo.svg',
  alt: 'Get it on Google Play',
  width: 135,
  height: 40,
} as const;

function AppDownloadBadges({ className }: { className?: string }) {
  const badges = [APP_STORE_BADGE, GOOGLE_PLAY_BADGE];

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      {badges.map((badge) => (
        <a
          key={badge.src}
          href='#'
          className='inline-block w-fit leading-none transition-opacity hover:opacity-80'
        >
          <img
            src={badge.src}
            alt={badge.alt}
            width={badge.width}
            height={badge.height}
            className='block h-10 w-auto max-w-full md:h-12'
            decoding='async'
          />
        </a>
      ))}
    </div>
  );
}

function FooterColumn({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className={`mb-2.5 inline-block text-sm font-bold text-brand-navy-ink md:text-base ${
          accent ? 'border-b-2 border-brand-magenta pb-1' : ''
        }`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function AccordionItem({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(46,34,82,0.035)]'>
      <Button
        variant='unstyled'
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[12px] font-semibold text-brand-navy-deep'
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </Button>
      {open ? <div className='border-t border-gray-100 px-3 pb-2.5 pt-2'>{children}</div> : null}
    </div>
  );
}

function SocialChip({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm transition-transform active:scale-95 md:h-11 md:w-11 md:rounded-full md:hover:shadow-md ${className}`}
    >
      {children}
    </a>
  );
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className='rounded-lg border border-gray-100 bg-[var(--brand-page)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 md:text-[11px]'>
      {children}
    </span>
  );
}
