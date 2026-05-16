import { useState, useCallback } from 'react';

interface UseTabsReturn {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  goToTab: (tab: string) => void;
}

/**
 * Manage tab navigation state
 * @param defaultTab - Initial active tab ID
 */
export function useTabs(defaultTab: string): UseTabsReturn {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const goToTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return { activeTab, setActiveTab, goToTab };
}
