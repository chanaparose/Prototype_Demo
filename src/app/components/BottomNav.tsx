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
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-6 py-3 z-50">
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        
        {/* Left Tabs */}
        {leftTabs.map((tab) => (
          <NavItem 
            key={tab.id}
            icon={<tab.icon size={24} />} 
            label={tab.label} 
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}

        {/* Floating Center Button */}
        <div className="relative -top-7">
          <button 
            onClick={() => onTabChange(centerTabId)}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all active:scale-90 border-4 border-white
              ${activeTab === centerTabId 
                ? 'bg-blue-600 text-white shadow-blue-600/40' 
                : 'bg-slate-800 text-white shadow-slate-800/30'}`}
          >
            <CenterIcon size={24} />
          </button>
          <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap
            ${activeTab === centerTabId ? 'text-blue-600' : 'text-slate-400'}`}>
            {centerLabel}
          </span>
        </div>

        {/* Right Tabs */}
        {rightTabs.map((tab) => (
          <NavItem 
            key={tab.id}
            icon={<tab.icon size={24} />} 
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
function NavItem({ icon, label, active, onClick }: { 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  onClick: () => void 
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group min-w-[64px]">
      <div className={`transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'text-blue-600' : 'text-slate-400'}`}>
        {label}
      </span>
    </button>
  );
}