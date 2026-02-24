import React from 'react';
import { Home, ShoppingBag, FileText, Receipt, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const leftTabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'order', icon: ShoppingBag, label: 'Order' },
  ];
  const rightTabs = [
    { id: 'transaction', icon: Receipt, label: 'Wallet' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];
  const centerTabId = 'req-his';
  const CenterIcon = FileText;
  const centerLabel = 'Request';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#3A3B6F] to-[#4A4B8F] pt-px">
      <div
        className="bg-gradient-to-r from-[#3A3B6F] to-[#4A4B8F] backdrop-blur-lg px-2 py-2 flex items-center justify-around border-t border-white/20 w-full min-h-[56px]"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Left Tabs */}
        {leftTabs.map((tab) => (
          <NavItem
            key={tab.id}
            icon={<tab.icon size={22} />}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}

        {/* Center Button - ref style gradient */}
        <div className="relative -top-4 mx-1">
          <button
            onClick={() => onTabChange(centerTabId)}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border-2 border-white/30
              ${activeTab === centerTabId
                ? 'bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500 text-white shadow-purple-500/40'
                : 'bg-[#3A3B6F] text-white/90 shadow-[#2D2E5F]/40'}`}
          >
            <CenterIcon size={22} />
          </button>
          <span className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap
            ${activeTab === centerTabId ? 'text-purple-300' : 'text-white/50'}`}>
            {centerLabel}
          </span>
        </div>

        {/* Right Tabs */}
        {rightTabs.map((tab) => (
          <NavItem
            key={tab.id}
            icon={<tab.icon size={22} />}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Sub-component สำหรับ Navigation Item
function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 group min-w-[52px]">
      <div className={`transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-tighter ${active ? 'text-white' : 'text-white/60'}`}>
        {label}
      </span>
    </button>
  );
}