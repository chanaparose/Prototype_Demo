import { Home, ShoppingBag, FileText, Receipt, User, LayoutDashboard, Briefcase, FileStack, Wallet } from 'lucide-react';

interface BottomNavProps {
  userType: 'customer' | 'factory';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ userType, activeTab, onTabChange }: BottomNavProps) {
  const customerTabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'order', icon: ShoppingBag, label: 'Order' },
    { id: 'req-his', icon: FileText, label: 'Req His' },
    { id: 'transaction', icon: Receipt, label: 'Transaction' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const factoryTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'my-jobs', icon: Briefcase, label: 'My Jobs' },
    { id: 'quotes', icon: FileStack, label: 'Quotes' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const tabs = userType === 'customer' ? customerTabs : factoryTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
