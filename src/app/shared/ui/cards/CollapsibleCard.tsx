import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type CollapsibleCardProps = {
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showChevron?: boolean;
};

export function CollapsibleCard({
  defaultOpen = true,
  onOpenChange,
  header,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  showChevron = true,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${headerClassName}`}
      >
        {header}
        {showChevron && (
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <div className={`px-4 pb-5 space-y-4 border-t border-gray-100 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}
