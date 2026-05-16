import React from 'react';

type TabItem = {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
};

type TabNavigationProps = {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
};

export function TabNavigation({
  tabs,
  activeTabId,
  onTabChange,
  className = '',
  tabClassName = '',
}: TabNavigationProps) {
  return (
    <div className={`flex gap-2 border-b border-gray-100 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${tabClassName} ${
            activeTabId === tab.id
              ? 'text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count != null && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {tab.count}
              </span>
            )}
          </div>
          {activeTabId === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
          )}
        </button>
      ))}
    </div>
  );
}
