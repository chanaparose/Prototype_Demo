import React from 'react';
import { Outlet } from 'react-router';

/**
 * โครงห่อเนื้อหาพอร์ทัลโรงงาน — นำทางหลักอยู่ที่ sidebar (FACTORY_SIDEBAR_NAV)
 */
export function FactoryPortalLayout() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Outlet />
      </div>
    </div>
  );
}
