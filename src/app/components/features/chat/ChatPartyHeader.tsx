import React from 'react';
import { BadgeCheck } from 'lucide-react';
import type { CounterpartyView } from '../../../utils/counterparty';
import { FACTORY_FALLBACK_AVATAR } from '../../../utils/counterparty';

interface Props {
  view: CounterpartyView;
  density?: 'row' | 'header';
  trailing?: React.ReactNode;
  onClick?: () => void;
}

export function ChatPartyHeader({ view, density = 'row', trailing, onClick }: Props) {
  const size = density === 'header' ? 40 : 44;
  const frameClass = density === 'header' ? 'h-10 w-10' : 'h-11 w-11';
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 text-left" aria-label="ดูข้อมูลการสนทนา">
      <img
        src={view.avatarUrl}
        alt={view.title}
        width={size}
        height={size}
        className={`${frameClass} shrink-0 overflow-hidden rounded-full bg-gray-100 object-cover`}
        onError={(e) => {
          e.currentTarget.src = FACTORY_FALLBACK_AVATAR;
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="truncate text-sm text-gray-900" style={{ fontWeight: 600 }}>
            {view.title}
          </p>
          {view.verified ? <BadgeCheck size={14} className="text-[#A238FF]" /> : null}
        </div>
        {view.subtitle ? <p className="truncate text-xs text-gray-500">{view.subtitle}</p> : null}
      </div>
      {trailing}
    </button>
  );
}
