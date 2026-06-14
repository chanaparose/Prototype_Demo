import { useMemo } from 'react';
import { Link } from 'react-router';
import { LayoutGrid } from 'lucide-react';

export type CategoryMarqueeTile = {
  categoryId: string;
  displayName: string;
  color?: string;
};

type CategoryMarqueeStripProps = {
  tiles: CategoryMarqueeTile[];
  className?: string;
};

const PASTEL_PALETTE = [
  'bg-rose-50 text-rose-500 ring-rose-100',
  'bg-sky-50 text-sky-500 ring-sky-100',
  'bg-emerald-50 text-emerald-500 ring-emerald-100',
  'bg-violet-50 text-violet-500 ring-violet-100',
  'bg-amber-50 text-amber-500 ring-amber-100',
  'bg-teal-50 text-teal-500 ring-teal-100',
] as const;

const ITEM_WIDTH = 'w-[5.25rem]';

function sortTilesByCategoryId(tiles: CategoryMarqueeTile[]) {
  return tiles
    .filter((tile) => {
      const id = Number(tile.categoryId);
      return Number.isFinite(id) && id >= 1 && id <= 6;
    })
    .sort((a, b) => Number(a.categoryId) - Number(b.categoryId));
}

function CategoryCircleItem({
  tile,
  index,
}: {
  tile: CategoryMarqueeTile;
  index: number;
}) {
  const palette = PASTEL_PALETTE[index % PASTEL_PALETTE.length];

  return (
    <li className={`${ITEM_WIDTH} shrink-0 snap-start list-none md:w-full md:max-w-none`}>
      <Link
        to={`/factory-ideas?category_id=${encodeURIComponent(tile.categoryId)}`}
        className='group flex w-full flex-col items-center gap-2 transition-transform active:scale-95'
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md md:h-12 md:w-12 xl:h-14 xl:w-14 ${palette}`}
          aria-hidden
        >
          <LayoutGrid size={18} strokeWidth={1.5} className='md:h-5 md:w-5' />
        </span>
        <span className='flex min-h-[2.5rem] w-full items-start justify-center text-center text-[11px] font-medium leading-snug text-slate-500 transition-colors group-hover:text-slate-800 md:min-h-0 md:text-xs xl:text-[13px]'>
          <span className='line-clamp-2 w-full break-words px-0.5'>{tile.displayName}</span>
        </span>
      </Link>
    </li>
  );
}

export function CategoryMarqueeStrip({ tiles, className }: CategoryMarqueeStripProps) {
  const sortedTiles = useMemo(() => sortTilesByCategoryId(tiles), [tiles]);

  return (
    <nav className={`relative ${className ?? ''}`} aria-label='หมวดหมู่สินค้า'>
      <div
        className='pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[var(--brand-page,#ffffff)] to-transparent md:hidden'
        aria-hidden
      />

      <div className='overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth scroll-pl-4 scroll-pr-2 md:overflow-visible md:scroll-pl-0 md:scroll-pr-0'>
        <ul className='m-0 flex w-max list-none flex-row flex-nowrap items-start gap-3 px-4 pb-1 md:grid md:w-full md:grid-cols-6 md:gap-3 md:px-0 md:pb-0'>
          {sortedTiles.map((tile, index) => (
            <CategoryCircleItem key={tile.categoryId} tile={tile} index={index} />
          ))}
        </ul>
      </div>
    </nav>
  );
}
