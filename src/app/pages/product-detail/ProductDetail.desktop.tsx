import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { SHOWCASE_DETAIL_BRAND as BRAND, formatShowcaseTHB as formatTHB, formatShowcaseThaiDate as formatThaiDate, normalizeShowcaseMarkdown as normalizeMarkdownContent } from '@/components/features/showcase-detail/showcaseDetailShared';
import { ShowcaseHeroGallery } from '@/components/features/showcase-detail/ShowcaseHeroGallery';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight as Chevron,
  Heart,
  ImageIcon,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Store,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { useDetailPageLogic } from '@/hooks/useDetailPageLogic';
import { useData } from '@/stores/useDataStore';
import { MarkdownBody } from '@/shared/markdown/MarkdownBody';
import { getCurrentHref } from '@/utils/navigation/redirect';
import { SubCategoryTag } from '@/components/SubCategoryTag';
import { StrictSpecsBlock } from '@/shared/ui/StrictSpecsBlock/StrictSpecsBlock';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function ProductDetailDesktop() {
  const navigate = useNavigate();
  const data = useData();
  const {
    item,
    loading,
    error,
    factory,
    reviews,
    isIdea,
    isMaterial,
    resolvedId,
    relatedProducts,
    isLiked,
    toggleFavorite,
    handleBack,
    handleStartChat,
    starting,
    canChat,
  } = useDetailPageLogic('product');

  const gallery = useMemo(() => {
    const urls = Array.isArray(item?.imageUrls)
      ? item.imageUrls.filter((u) => String(u).trim() !== '')
      : [];
    if (urls.length > 0) return urls.slice(0, 8);
    return item?.image ? [item.image] : [];
  }, [item?.image, item?.imageUrls]);

  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [item?.id]);

  if (loading) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F5F3FF] lg:flex'>
        <LoadingSpinner size='lg' color='border-purple-600 border-t-transparent' />
      </div>
    );
  }

  if (!item || !resolvedId) {
    return (
      <div className='hidden min-h-[calc(100vh-4rem)] bg-[#F5F3FF] px-8 pb-20 pt-8 lg:block'>
        <Button
          variant='unstyled'
          type='button'
          onClick={handleBack}
          className='mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand-purple)]'
        >
          <ArrowLeft className='w-4 h-4' /> กลับ
        </Button>
        <div className='bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm'>
          <p className='text-4xl mb-3'>📦</p>
          <p className='text-[14px] text-gray-500 font-medium'>{error || 'ไม่พบข้อมูลสินค้า'}</p>
        </div>
      </div>
    );
  }

  const subName = item.sub_category_name?.trim() ?? null;

  const markdown = normalizeMarkdownContent(item.content || item.excerpt || '');
  const priceText = formatTHB(item.basePrice) ?? (item.priceRange?.trim() || null);
  const liked = isLiked;
  const likeCount = item ? item.likes + (liked ? 1 : 0) : 0;
  const avgRating = Number(reviews?.summary.average ?? factory?.rating ?? 0);
  const reviewCount = Number(reviews?.summary.total ?? factory?.reviews ?? 0);
  const breakdown = reviews?.summary.breakdown ?? { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  const latestReviews = reviews?.items ?? [];

  const specRows: { label: string; value: ReactNode }[] = [];
  if (item.category) specRows.push({ label: 'หมวดหมู่', value: item.category });
  if (subName && !isMaterial) specRows.push({ label: 'ประเภทย่อย', value: subName });
  const leadTimeDays = Number(String(item.leadTime ?? '').replace(/[^\d.]/g, ''));
  if (factory?.location) specRows.push({ label: 'สถานที่ผลิต', value: factory.location });
  if (Array.isArray(item.specs) && item.specs.length > 0) {
    const sorted = [...item.specs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const s of sorted) {
      const label = String(s.spec_key ?? '').trim();
      const value = String(s.spec_value ?? '').trim();
      if (label && value) specRows.push({ label, value });
    }
  }

  return (
    <div className='hidden min-h-[calc(100vh-4rem)] bg-[var(--brand-panel)] lg:block'>
      <div className='px-8 pt-5 pb-3'>
        <div className='flex items-center gap-1.5 text-[12px] text-gray-500'>
          <Button
            variant='unstyled'
            type='button'
            onClick={handleBack}
            className='inline-flex items-center gap-1 font-medium text-[var(--brand-purple)] hover:opacity-80'
          >
            <ArrowLeft className='w-3.5 h-3.5' /> กลับ
          </Button>
          <Chevron className='w-3 h-3 text-gray-300' />
          <span>{item.category || 'ทั้งหมด'}</span>
          {subName && !isMaterial ? (
            <>
              <Chevron className='w-3 h-3 text-gray-300' />
              <span>{subName}</span>
            </>
          ) : null}
          <Chevron className='w-3 h-3 text-gray-300' />
          <span className='max-w-[32rem] truncate text-[var(--brand-ink)]'>{item.title}</span>
        </div>
      </div>

      <div className='px-8 pb-10 space-y-4'>
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <div className='flex gap-8'>
            <div className='w-[450px] shrink-0'>
              <ShowcaseHeroGallery
                gallery={gallery}
                fallbackImage={item.image}
                title={item.title}
                activeImage={activeImage}
                onActiveImageChange={setActiveImage}
                accentColor={BRAND.orange}
                borderColor={BRAND.border}
                className=''
              />

              <div className='mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500'>
                <Button
                  variant='unstyled'
                  type='button'
                  className='inline-flex items-center gap-1.5 hover:text-gray-700 transition-colors'
                  onClick={() => {
                    const url = getCurrentHref();
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      void navigator.share({ title: item.title, url });
                    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      void navigator.clipboard.writeText(url);
                    }
                  }}
                >
                  <Share2 className='w-4 h-4' /> แชร์สินค้านี้
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void toggleFavorite()}
                  className='inline-flex items-center gap-1.5 hover:text-gray-700 transition-colors'
                >
                  <Heart
                    className='w-4 h-4'
                    style={
                      liked
                        ? { color: 'var(--status-danger)', fill: 'var(--status-danger)' }
                        : { color: BRAND.orange }
                    }
                  />
                  {likeCount} สนใจ
                </Button>
              </div>
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex flex-wrap items-center gap-2 mb-2'>
                {factory?.verified ? (
                  <span className='inline-flex items-center gap-1 rounded-sm bg-[var(--brand-orange)] px-2 py-0.5 text-[10px] font-bold text-white'>
                    <BadgeCheck className='w-3 h-3' /> Preferred
                  </span>
                ) : null}
                <span className='inline-flex items-center rounded-sm bg-[#F5F3FF] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-purple)]'>
                  {isIdea ? 'ไอเดีย / บทความ' : isMaterial ? 'วัตถุดิบ' : 'สินค้า'}
                </span>
                {item.category ? (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium text-gray-500 border border-gray-200'>
                    {item.category}
                  </span>
                ) : null}
                {subName && !isMaterial ? (
                  <SubCategoryTag name={subName} size='sm' showSubPrefix />
                ) : null}
              </div>

              <h1 className='text-[20px] font-medium leading-snug text-[var(--brand-ink)]'>
                {item.title}
              </h1>

              <div className='flex items-center gap-4 py-3 mt-1 border-b border-gray-100 text-[13px] text-gray-500'>
                <span className='inline-flex items-center gap-1'>
                  <span className='border-b border-[var(--brand-orange)] text-[var(--brand-orange)]'>
                    {avgRating.toFixed(1)}
                  </span>
                  <Star className='w-3.5 h-3.5 fill-current text-[var(--brand-orange)]' />
                </span>
                <span className='h-3 w-px bg-gray-200' />
                <span>
                  <span className='text-gray-700 border-b border-gray-300'>{reviewCount}</span>
                  <span className='ml-1'>รีวิว</span>
                </span>
                <span className='h-3 w-px bg-gray-200' />
                <span>
                  <span className='text-gray-700'>{likeCount}</span>
                  <span className='ml-1'>คนสนใจ</span>
                </span>
                <span className='h-3 w-px bg-gray-200' />
                <span>เผยแพร่ {formatThaiDate(item.postedAt)}</span>
              </div>

              <div className='mt-4 rounded-xl border border-[#F8DEC1] bg-[var(--surface-paper-warm)] px-4 py-4'>
                {priceText ? (
                  <div className='flex items-baseline gap-2'>
                    <p className='text-[26px] font-bold leading-none text-[var(--brand-violet)]'>
                      {priceText}
                    </p>
                    {item.promoPrice && item.basePrice && item.promoPrice < item.basePrice ? (
                      <p className='text-[14px] line-through text-gray-400'>
                        {formatTHB(item.basePrice)}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className='text-[20px] font-semibold leading-none text-[var(--brand-violet)]'>
                    สอบถามราคากับโรงงาน
                  </p>
                )}
                <p className='text-[11px] text-gray-500 mt-2'>
                  ราคาต่อชิ้นอาจแตกต่างตามปริมาณสั่งผลิต กรุณาแชทเพื่อขอใบเสนอราคา
                </p>
              </div>

              <div className='mt-5 grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-[13px]'>
                <span className='text-gray-400'>ขั้นต่ำผลิต</span>
                <span className='text-[var(--brand-ink)]'>
                  <span className='font-semibold'>{item.minOrder}</span>{' '}
                  <span className='text-gray-500'>ชิ้น (MOQ)</span>
                </span>

                {item.leadTime ? (
                  <>
                    <span className='text-gray-400'>ระยะเวลาผลิต</span>
                    <span className='text-[var(--brand-ink)]'>{item.leadTime}</span>
                  </>
                ) : null}

                {factory?.location ? (
                  <>
                    <span className='text-gray-400'>สถานที่ผลิต</span>
                    <span className='inline-flex items-center gap-1 text-[var(--brand-ink)]'>
                      <MapPin className='w-3.5 h-3.5 text-gray-400' /> {factory.location}
                    </span>
                  </>
                ) : null}
              </div>

              {item.tags.length > 0 ? (
                <div className='mt-5 grid grid-cols-[120px_1fr] gap-x-4 items-start text-[13px]'>
                  <span className='text-gray-400 pt-1'>แท็ก</span>
                  <div className='flex flex-wrap gap-1.5'>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className='inline-flex cursor-pointer items-center rounded-sm bg-[#F5F3FF] px-2 py-1 text-[11px] font-medium text-[var(--brand-purple)] transition-colors hover:opacity-80'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className='mt-6 flex items-center gap-3'>
                {canChat ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={handleStartChat}
                    disabled={starting}
                    className='inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--brand-orange)] bg-[var(--surface-orange-tint)] px-5 text-[14px] font-semibold text-[var(--brand-orange-vivid)] transition-colors disabled:opacity-70'
                  >
                    {starting ? (
                      <LoadingSpinner size='sm' color={`border-[${BRAND.orangeDark}] border-t-transparent`} />
                    ) : (
                      <MessageCircle className='w-4 h-4' />
                    )}
                    แชทกับโรงงาน
                  </Button>
                ) : null}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => navigate(`/factories/${item.factoryId}`)}
                  className='inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--brand-orange)] px-5 text-[14px] font-bold text-white transition-opacity hover:opacity-90'
                >
                  <Store className='w-4 h-4' />
                  ดูโปรไฟล์โรงงาน
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5'>
          <div className='flex items-center gap-5'>
            <div className='flex items-center gap-4 min-w-0'>
              <div className='w-fit shrink-0 rounded-2xl'>
                <div
                  className={`relative block h-17 w-17 overflow-hidden rounded-2xl border-2 shadow-md ring-1 ring-white ${
                    factory?.image ? 'border-white' : 'border-dashed border-indigo-200 bg-violet-50'
                  }`}
                >
                  {factory?.image ? (
                    <ImageWithFallback
                      src={factory.image}
                      alt={item.factoryName}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <span className='flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center'>
                      <ImageIcon size={20} className='text-indigo-400' strokeWidth={1.5} />
                      <span className='text-[9px] font-semibold leading-tight text-indigo-600'>
                        โปรไฟล์
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5'>
                  <p className='truncate text-[15px] font-semibold text-[var(--brand-ink)]'>
                    {item.factoryName}
                  </p>
                  {factory?.verified ? (
                    <BadgeCheck className='w-4 h-4 shrink-0 text-[var(--brand-purple)]' />
                  ) : null}
                </div>
                <p className='text-[12px] text-gray-500 truncate mt-0.5'>
                  {factory?.specialization || 'โรงงานรับผลิต OEM / Private Label'}
                </p>
                <div className='flex items-center gap-2 mt-3'>
                  {canChat ? (
                    <Button
                      variant='unstyled'
                      type='button'
                      onClick={handleStartChat}
                      disabled={starting}
                      className='inline-flex h-9 items-center gap-1.5 rounded-sm border border-[var(--brand-orange)] bg-[var(--surface-orange-tint)] px-3.5 text-[13px] font-medium text-[var(--brand-orange-vivid)] transition-colors disabled:opacity-70'
                    >
                      <MessageCircle className='w-3.5 h-3.5' /> แชท
                    </Button>
                  ) : null}
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => navigate(`/factories/${item.factoryId}`)}
                    className='inline-flex h-9 items-center gap-1.5 rounded-sm border border-[#E7E2F0] px-3.5 text-[13px] font-medium text-[var(--neutral-text)] transition-colors hover:opacity-80'
                  >
                    <Store className='w-3.5 h-3.5' /> ดูโรงงาน
                  </Button>
                </div>
              </div>
            </div>

            <div className='w-px h-24 bg-gray-100 mx-2' />

            <div className='grid grid-cols-3 gap-6 text-[13px] flex-1'>
              <div>
                <p className='text-gray-400 mb-1'>เรตติ้งเฉลี่ย</p>
                <p className='font-semibold text-[var(--brand-orange)]'>
                  {avgRating.toFixed(1)} <span className='text-[11px] text-gray-400'>/ 5.0</span>
                </p>
              </div>
              <div>
                <p className='text-gray-400 mb-1'>รีวิวทั้งหมด</p>
                <p className='font-semibold text-[var(--brand-orange)]'>{reviewCount}</p>
              </div>
              <div>
                <p className='text-gray-400 mb-1'>ออเดอร์ที่เสร็จแล้ว</p>
                <p className='font-semibold text-[var(--brand-orange)]'>
                  {factory?.completedOrders ?? 0}
                </p>
              </div>
              <div>
                <p className='text-gray-400 mb-1'>ที่ตั้ง</p>
                <p className='font-semibold text-[var(--brand-ink)]'>{factory?.location ?? '-'}</p>
              </div>
              <div>
                <p className='text-gray-400 mb-1'>MOQ เริ่มต้น</p>
                <p className='font-semibold text-[var(--brand-ink)]'>
                  {factory?.minOrder ?? item.minOrder}
                </p>
              </div>
              <div>
                <p className='text-gray-400 mb-1'>Lead time</p>
                <p className='font-semibold text-[var(--brand-ink)]'>
                  {factory?.leadTime || item.leadTime || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='border-b border-[#E7E2F0] bg-[#F5F3FF] px-6 py-3'>
            <p className='text-[14px] font-bold text-[var(--brand-ink)]'>ข้อมูลจำเพาะของสินค้า</p>
          </div>
          <div className='p-6'>
            <StrictSpecsBlock
              showcase={{
                moq: Number.isFinite(Number(item.minOrder)) ? Number(item.minOrder) : null,
                lead_time_days:
                  Number.isFinite(leadTimeDays) && leadTimeDays > 0 ? leadTimeDays : null,
              }}
            />
            <Table className='w-full text-[13px]'>
              <TableBody>
                {specRows.map((row, idx) => (
                  <TableRow
                    key={`${row.label}-${idx}`}
                    className='border-b border-[#E7E2F0] last:border-0'
                  >
                    <TableCell className='py-2.5 pr-6 w-48 text-gray-500 align-top'>
                      {row.label}
                    </TableCell>
                    <TableCell className='py-2.5 text-[var(--brand-ink)]'>{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='border-b border-[#E7E2F0] bg-[#F5F3FF] px-6 py-3'>
            <p className='text-[14px] font-bold text-[var(--brand-ink)]'>รายละเอียดสินค้า</p>
          </div>
          <div className='p-6'>
            {markdown ? (
              <>
                <MarkdownBody
                  source={markdown}
                  className='max-w-none !text-[14px] md:!text-[14px] text-gray-700 leading-relaxed [&_p]:!text-[14px] [&_li]:!text-[14px] [&_a]:!text-[14px] [&_blockquote]:!text-[14px] [&_h1]:!text-[14px] [&_h2]:!text-[14px] [&_h3]:!text-[14px]'
                />
              </>
            ) : (
              <p className='text-[13px] text-gray-400'>ยังไม่มีรายละเอียดเพิ่มเติม</p>
            )}
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='border-b border-[#E7E2F0] bg-[#F5F3FF] px-6 py-3'>
            <p className='text-[14px] font-bold text-[var(--brand-ink)]'>คะแนนรีวิว</p>
          </div>
          <div className='p-6'>
            <div className='flex items-center gap-8'>
              <div>
                <p className='text-[34px] font-bold leading-none text-[var(--brand-orange)]'>
                  {avgRating.toFixed(1)}
                </p>
                <p className='text-[12px] text-gray-500 mt-1'>จาก {reviewCount} รีวิว</p>
              </div>
              <div className='flex-1 space-y-2'>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = Number(breakdown[String(star)] ?? 0);
                  const intensity =
                    reviewCount > 0 ? Math.max(0, Math.min(100, (count / reviewCount) * 100)) : 0;
                  return (
                    <div key={star} className='flex items-center gap-2'>
                      <span className='w-10 text-[12px] text-gray-500'>{star} ดาว</span>
                      <div className='h-2 flex-1 rounded-full bg-gray-100 overflow-hidden'>
                        <div
                          className='h-full rounded-full'
                          style={{ width: `${intensity}%`, background: BRAND.orange }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className='mt-5 border-t border-gray-100 pt-4 space-y-3'>
              <p className='text-[13px] font-semibold text-[var(--brand-ink)]'>
                รีวิวล่าสุดจากลูกค้า
              </p>
              {latestReviews.length === 0 ? (
                <p className='text-[12px] text-gray-400'>ยังไม่มีรีวิว</p>
              ) : (
                latestReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className='rounded-lg border border-gray-100 px-3 py-2'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-[12px] font-semibold text-gray-700 truncate'>
                        {r.reviewer}
                      </p>
                      <p className='text-[11px] text-amber-600'>
                        ★ {Number(r.rating || 0).toFixed(1)}
                      </p>
                    </div>
                    <p className='text-[12px] text-gray-600 mt-1 line-clamp-2'>
                      {r.comment || '-'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between rounded-2xl bg-[linear-gradient(135deg,var(--brand-navy-deep)_0%,#4A267D_100%)] p-5 shadow-sm'>
          <div className='min-w-0'>
            <p className='text-[13px] text-[#EBD3FF]'>สนใจผลิตกับโรงงานนี้?</p>
            <p className='text-[16px] font-bold text-white mt-0.5 truncate'>
              แชทสอบถามรายละเอียด พร้อมขอใบเสนอราคาได้ทันที
            </p>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            {canChat ? (
              <Button
                variant='unstyled'
                type='button'
                onClick={handleStartChat}
                disabled={starting}
                className='inline-flex h-11 items-center gap-2 rounded-md bg-[var(--brand-orange)] px-5 text-[13px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-70'
              >
                {starting ? (
                  <LoadingSpinner size='sm' color='border-white border-t-transparent' />
                ) : (
                  <MessageCircle className='w-4 h-4' />
                )}
                แชทกับโรงงาน
              </Button>
            ) : null}
            <Button
              variant='unstyled'
              type='button'
              onClick={() => navigate(`/factories/${item.factoryId}`)}
              className='inline-flex h-11 items-center gap-2 rounded-md border border-white/45 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10'
            >
              <ArrowUpRight className='w-4 h-4' /> ดูโปรไฟล์โรงงาน
            </Button>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
          <div className='border-b border-[#E7E2F0] bg-[#F5F3FF] px-6 py-3'>
            <p className='text-[14px] font-bold text-[var(--brand-ink)]'>สินค้าที่ใกล้เคียง</p>
          </div>
          {relatedProducts.length > 0 ? (
            <div className='p-6 grid grid-cols-4 gap-3'>
              {relatedProducts.map((rp) => {
                const rf = data.factories.find((f) => f.id === rp.factoryId);
                const rating = Number(rf?.rating ?? rp.factoryRating ?? 0);
                const reviews = Number(rf?.reviews ?? 0);
                const isPromo = rp.contentType === 'promotion';
                return (
                  <Button
                    variant='unstyled'
                    key={rp.id}
                    type='button'
                    onClick={() =>
                      navigate(
                        `/${isPromo ? 'promotion-detail' : 'product-detail'}?showcase_id=${rp.id}`,
                      )
                    }
                    className='bg-white rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-all group flex flex-col w-full text-left'
                  >
                    <div className='relative aspect-[4/3] overflow-hidden bg-gray-100'>
                      <ImageWithFallback
                        src={rp.image}
                        alt={rp.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                      <span
                        className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white ${
                          isPromo ? 'bg-[var(--brand-orange)]' : 'bg-[#2563EB]'
                        }`}
                      >
                        {isPromo ? 'โปรโมชัน' : 'สินค้า'}
                      </span>
                    </div>
                    <div className='p-2 flex flex-col flex-1 justify-between gap-0.5'>
                      <div>
                        <p className='text-gray-700 truncate mb-0.5 text-xs font-medium leading-tight group-hover:text-brand-purple transition-colors'>
                          {rp.title}
                        </p>
                        <div className='flex items-center gap-0.5 mt-0.5'>
                          <MapPin className='w-2.5 h-2.5 text-gray-400 shrink-0' />
                          <span className='text-gray-500 text-[10px] truncate'>
                            {(rf?.provinceName ?? rf?.location ?? '').trim() || '—'}
                          </span>
                        </div>
                      </div>
                      <div className='mt-auto pt-1 border-t border-gray-50'>
                        <div className='flex items-center justify-between min-w-0'>
                          <div className='flex items-center gap-0.5 min-w-0'>
                            <Star className='w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0' />
                            <span className='text-gray-700 text-[10px] font-semibold'>
                              {rating}
                            </span>
                            <span className='text-gray-400 text-[9px] truncate'>({reviews})</span>
                          </div>
                          <span className='text-gray-400 text-[8px] shrink-0'>
                            ขั้นต่ำ {rp.minOrder}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className='p-8 text-center text-sm text-gray-400'>
              ยังไม่มีสินค้าที่ใกล้เคียงในหมวดนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
