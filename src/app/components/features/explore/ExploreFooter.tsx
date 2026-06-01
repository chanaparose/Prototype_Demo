import React from 'react';
import { Facebook, Instagram, Youtube, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExploreFooter() {
  const [open, setOpen] = React.useState<null | 'support' | 'categories' | 'knowledge' | 'apps'>(
    null,
  );
  const toggle = (key: 'support' | 'categories' | 'knowledge' | 'apps') =>
    setOpen((prev) => (prev === key ? null : key));

  return (
    <footer className='w-full bg-neutral-footer border-t border-gray-200 pt-6 md:pt-10 mt-8 md:mt-12 flex-shrink-0'>
      <div className='max-w-[1600px] mx-auto px-4 md:px-6'>
        <div className='md:hidden mb-6 space-y-2'>
          <AccordionItem
            title='ศูนย์ดูแลลูกค้า'
            open={open === 'support'}
            onToggle={() => toggle('support')}
          >
            <ul className='space-y-2 text-[11px] text-gray-600'>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ขั้นตอน "เปิดร้าน"
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  เริ่มขายสินค้า/บริการ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ติดต่อเรา
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ลงทะเบียนธุรกิจ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ศูนย์ช่วยเหลือลูกค้า
                </a>
              </li>
            </ul>
          </AccordionItem>
          <AccordionItem
            title='หมวดหมู่บริการและสินค้า'
            open={open === 'categories'}
            onToggle={() => toggle('categories')}
          >
            <div className='grid grid-cols-2 gap-2 text-[11px] text-gray-600'>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    โรงพยาบาลสัตว์
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    อาบน้ำตัดขน
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    รับฝากสัตว์เลี้ยง
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    โรงเรียนฝึกสอน
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    สระว่ายน้ำสุนัข
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    คาเฟ่-ร้านอาหาร
                  </a>
                </li>
              </ul>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    อาหารสัตว์
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    อุปกรณ์สัตว์เลี้ยง
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ห้องน้ำและทราย
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ทำความสะอาด
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ชุดสัตว์เลี้ยง
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ดูแลสุขภาพ
                  </a>
                </li>
              </ul>
            </div>
          </AccordionItem>
          <AccordionItem
            title='แหล่งความรู้และคูปอง'
            open={open === 'knowledge'}
            onToggle={() => toggle('knowledge')}
          >
            <ul className='space-y-2 text-[11px] text-gray-600'>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  คูปอง
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ค้นหาสถานที่และบริการ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  บทความ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  กิจกรรม
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  วิดีโอ
                </a>
              </li>
            </ul>
          </AccordionItem>
          <AccordionItem
            title='ดาวน์โหลดแอปพลิเคชัน'
            open={open === 'apps'}
            onToggle={() => toggle('apps')}
          >
            <AppDownloadBadges className='pt-0.5' />
          </AccordionItem>
        </div>

        <div className='hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-7 md:mb-10'>
          <div>
            <h3 className='font-bold text-brand-navy-ink mb-2.5 text-sm md:text-base border-b-2 border-brand-magenta pb-1 inline-block'>
              ศูนย์ดูแลลูกค้า
            </h3>
            <ul className='space-y-2 text-[11px] md:text-xs text-gray-600'>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ขั้นตอน "เปิดร้าน"
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  เริ่มขายสินค้า/บริการ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ติดต่อเรา
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ลงทะเบียนธุรกิจ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ศูนย์ช่วยเหลือลูกค้า
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-brand-navy-ink mb-2.5 text-sm md:text-base'>
              หมวดหมู่บริการและสินค้า
            </h3>
            <div className='grid grid-cols-2 gap-2 text-[11px] md:text-xs text-gray-600'>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    โรงพยาบาลสัตว์
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    อาบน้ำตัดขน
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    รับฝากสัตว์เลี้ยง
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    โรงเรียนฝึกสอน
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    สระว่ายน้ำสุนัข
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    คาเฟ่-ร้านอาหาร
                  </a>
                </li>
              </ul>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    อาหารสัตว์
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    อุปกรณ์สัตว์เลี้ยง
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ห้องน้ำและทราย
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ทำความสะอาด
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ชุดสัตว์เลี้ยง
                  </a>
                </li>
                <li>
                  <a href='#' className='hover:text-brand-magenta transition-colors'>
                    ดูแลสุขภาพ
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className='font-bold text-brand-navy-ink mb-2.5 text-sm md:text-base'>
              แหล่งความรู้และคูปอง
            </h3>
            <ul className='space-y-2 text-[11px] md:text-xs text-gray-600'>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  คูปอง
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  ค้นหาสถานที่และบริการ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  บทความ
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  กิจกรรม
                </a>
              </li>
              <li>
                <a href='#' className='hover:text-brand-magenta transition-colors'>
                  วิดีโอ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-brand-navy-ink mb-1.5 text-sm md:text-base'>
              ดาวน์โหลดแอปพลิเคชัน
            </h3>
            <AppDownloadBadges />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 py-4 md:py-6 border-t border-gray-300'>
          <div>
            <h4 className='font-bold text-brand-navy-ink mb-2.5 text-xs md:text-sm'>ติดตามเรา</h4>
            <div className='flex items-center gap-3'>
              <a
                href='#'
                className='w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:shadow-lg transition-shadow'
                title='Facebook'
              >
                <Facebook size={20} />
              </a>
              <a
                href='#'
                className='w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#00B900] text-white flex items-center justify-center hover:shadow-lg transition-shadow'
                title='LINE'
              >
                <span className='font-bold text-xs'>LINE</span>
              </a>
              <a
                href='#'
                className='w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FF0000] text-white flex items-center justify-center hover:shadow-lg transition-shadow'
                title='YouTube'
              >
                <Youtube size={20} />
              </a>
              <a
                href='#'
                className='w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#E4405F] text-white flex items-center justify-center hover:shadow-lg transition-shadow'
                title='Instagram'
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className='font-bold text-brand-navy-ink mb-2.5 text-xs md:text-sm'>การจัดส่ง</h4>
            <div className='flex flex-wrap items-center gap-2.5 opacity-70 grayscale'>
              <span className='font-bold text-base md:text-lg italic text-red-600'>KERRY</span>
              <span className='font-bold text-base md:text-lg italic text-yellow-500'>FLASH</span>
              <span className='font-bold text-base md:text-lg text-blue-800'>EMS</span>
            </div>
          </div>

          <div>
            <h4 className='font-bold text-brand-navy-ink mb-2.5 text-xs md:text-sm'>
              ช่องทางการชำระเงิน
            </h4>
            <div className='flex flex-wrap items-center gap-2.5 opacity-70 grayscale'>
              <span className='font-bold text-base md:text-lg text-blue-700 italic'>VISA</span>
              <span className='font-bold text-base md:text-lg'>Mastercard</span>
              <span className='font-bold text-base md:text-lg text-blue-500'>PromptPay</span>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-brand-navy-ink text-white py-2.5 md:py-3 text-[11px] md:text-xs mt-2 md:mt-3'>
        <div className='max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3'>
          <div>&copy; 2026 Tryly Shopping. By Digital Media Advertising Co., Ltd.</div>
          <div className='flex items-center gap-4 md:gap-6'>
            <a href='#' className='hover:underline'>
              เงื่อนไขในการให้บริการ
            </a>
            <a href='#' className='hover:underline'>
              นโยบายความปลอดภัย
            </a>
            <a href='#' className='hover:underline'>
              Cookie Policy
            </a>
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
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      {badges.map((badge) => (
        <a
          key={badge.src}
          href='#'
          className='inline-block w-fit hover:opacity-80 transition-opacity leading-none'
        >
          <img
            src={badge.src}
            alt={badge.alt}
            width={badge.width}
            height={badge.height}
            className='h-11 md:h-12 w-auto max-w-full block'
            decoding='async'
          />
        </a>
      ))}
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
    <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
      <Button
        variant='unstyled'
        type='button'
        onClick={onToggle}
        className='w-full px-3 py-2.5 text-left text-sm font-semibold text-brand-navy-ink flex items-center justify-between'
      >
        <span>{title}</span>
        <ChevronDown
          size={14}
          className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </Button>
      {open ? <div className='px-3 pt-0 pb-2'>{children}</div> : null}
    </div>
  );
}
