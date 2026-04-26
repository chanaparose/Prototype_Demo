import React from 'react';
import { Outlet } from 'react-router';

/**
 * โครงห่อพอร์ทัลโรงงาน — padding / safe-area แบบเดียวกับหน้าลูกค้าบนมือถือ
 * นำทางหลักอยู่ที่ sidebar (FACTORY_SIDEBAR_NAV) บน lg+
 */
export function FactoryPortalLayout() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 w-full min-w-0">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))] space-y-4">
        <Outlet />
      </div>
    </div>
  );
}
