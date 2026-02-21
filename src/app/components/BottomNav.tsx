import React from 'react';
import { Home, ShoppingBag, FileText, Receipt, User, LayoutDashboard, Briefcase, FileStack, Wallet, Plus } from 'lucide-react';

interface BottomNavProps {
  userType: 'customer' | 'factory';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ userType, activeTab, onTabChange }: BottomNavProps) {
  // แยก Tab ออกเป็น 2 ฝั่งเพื่อเว้นที่ให้ปุ่มตรงกลาง (Floating Button)
  const customerTabsLeft = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'order', icon: ShoppingBag, label: 'Order' },
  ];
  const customerTabsRight = [
    { id: 'transaction', icon: Receipt, label: 'Wallet' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const factoryTabsLeft = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'my-jobs', icon: Briefcase, label: 'Jobs' },
  ];
  const factoryTabsRight = [
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const leftTabs = userType === 'customer' ? customerTabsLeft : factoryTabsLeft;
  const rightTabs = userType === 'customer' ? customerTabsRight : factoryTabsRight;
  
  // กำหนด ID สำหรับปุ่มกลางตาม UserType
  const centerTabId = userType === 'customer' ? 'req-his' : 'quotes';
  const CenterIcon = userType === 'customer' ? FileText : FileStack;
  const centerLabel = userType === 'customer' ? 'Request' : 'Quotes';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gradient-to-r from-[#3A3B6F] to-[#4A4B8F] backdrop-blur-lg rounded-full px-6 py-3 flex items-center gap-2 shadow-xl border border-white/20 max-w-md">
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
        <div className="relative -top-6 mx-1">
          <button
            onClick={() => onTabChange(centerTabId)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border-2 border-white/30
              ${activeTab === centerTabId
                ? 'bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500 text-white shadow-purple-500/40'
                : 'bg-[#3A3B6F] text-white/90 shadow-[#2D2E5F]/40'}`}
          >
            <CenterIcon size={22} />
          </button>
          <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap
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