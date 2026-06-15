import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { factoryIdeasTheme as COLORS } from '@/components/features/factory-ideas/factoryIdeasTheme';
import {
  buildUnitGroups,
  parseMasterUnits,
  type UnitGroup,
} from '@/domain/master/mappers/mapMasterUnits';

export type UnitGroupDropdownOption = { id: number; name: string; groupTh?: string };

type Props = {
  value?: number;
  onChange: (unitId: number) => void;
  units: UnitGroupDropdownOption[];
  placeholder?: string;
  className?: string;
  /** Match CategoryCard MOQ row trigger */
  compact?: boolean;
};

function groupsFromOptions(units: UnitGroupDropdownOption[]): UnitGroup[] {
  const parsed = parseMasterUnits(
    units.map((u) => ({
      unit_id: u.id,
      unit_name_th: u.name,
      group_th: u.groupTh ?? '',
    })),
  );
  return buildUnitGroups(parsed);
}

export function UnitGroupDropdown({
  value,
  onChange,
  units,
  placeholder = '— หน่วย —',
  className = '',
  compact = true,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => groupsFromOptions(units), [units]);

  const selectedGroupKey = useMemo(() => {
    if (!value || value <= 0) return null;
    return groups.find((g) => g.units.some((u) => u.id === value))?.key ?? groups[0]?.key ?? null;
  }, [groups, value]);

  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const effectiveHighlight = highlightKey ?? selectedGroupKey ?? groups[0]?.key ?? null;

  const triggerLabel = useMemo(() => {
    if (!value || value <= 0) return placeholder;
    return units.find((u) => u.id === value)?.name ?? placeholder;
  }, [value, units, placeholder]);

  const panelUnits = useMemo(() => {
    const g = groups.find((gr) => gr.key === effectiveHighlight);
    return g?.units ?? [];
  }, [groups, effectiveHighlight]);

  useEffect(() => {
    if (!open) return;
    setHighlightKey(selectedGroupKey);
  }, [open, selectedGroupKey]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pickUnit = (unitId: number) => {
    onChange(unitId);
    setOpen(false);
  };

  const clearUnit = () => {
    onChange(0);
    setOpen(false);
  };

  const triggerClass = compact
    ? 'h-7 rounded-lg text-xs px-2 w-28 border border-gray-200 bg-white'
    : 'h-9 rounded-lg text-[13px] px-3 min-w-[7rem] border border-gray-200 bg-white';

  return (
    <div ref={menuRef} className={`relative shrink-0 z-30 ${className}`}>
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-1 ${triggerClass}`}
        style={{
          color: value && value > 0 ? COLORS.purple : 'var(--neutral-text)',
          fontWeight: value && value > 0 ? 600 : 400,
        }}
      >
        <span className='truncate min-w-0 text-left'>{triggerLabel}</span>
        <ChevronDown
          size={compact ? 12 : 14}
          className={`shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </Button>

      {open && groups.length > 0 ? (
        <div className='absolute top-full mt-1 left-0 flex rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden z-40 max-w-[calc(100vw-2rem)]'>
          <div className='max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0 border-r border-gray-100 w-36 sm:w-44'>
            <Button
              variant='unstyled'
              type='button'
              onClick={clearUnit}
              className='w-full px-3 py-2 text-left text-[12px] text-gray-500 hover:bg-gray-50'
            >
              {placeholder}
            </Button>
            {groups.map((g) => {
              const rowHi = effectiveHighlight === g.key;
              const groupSelected = g.units.some((u) => u.id === value);
              return (
                <Button
                  variant='unstyled'
                  key={g.key}
                  type='button'
                  onMouseEnter={() => setHighlightKey(g.key)}
                  onClick={() => setHighlightKey(g.key)}
                  className='w-full flex items-center justify-between gap-1 px-3 py-2 text-left text-[12px] transition-colors'
                  style={{
                    color: groupSelected ? COLORS.purple : 'var(--neutral-text)',
                    fontWeight: groupSelected ? 600 : 500,
                    backgroundColor: rowHi ? COLORS.lightPurpleBg : 'transparent',
                  }}
                >
                  <span className='truncate'>{g.label}</span>
                  <ChevronRight size={13} className='shrink-0 opacity-40' aria-hidden />
                </Button>
              );
            })}
          </div>
          <div className='w-36 sm:w-44 max-h-[min(75vh,22rem)] overflow-y-auto py-1 shrink-0'>
            {panelUnits.length === 0 ? (
              <p className='px-3 py-4 text-[11px] text-gray-400'>ไม่มีหน่วยในกลุ่มนี้</p>
            ) : (
              panelUnits.map((u) => {
                const active = value === u.id;
                return (
                  <Button
                    variant='unstyled'
                    key={u.id}
                    type='button'
                    onClick={() => pickUnit(u.id)}
                    className='w-full px-3 py-2 text-left text-[12px] transition-colors'
                    style={{
                      color: active ? COLORS.purple : 'var(--neutral-text)',
                      fontWeight: active ? 600 : 400,
                      backgroundColor: active ? COLORS.lightPurpleBg : 'transparent',
                    }}
                  >
                    {u.name}
                  </Button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
