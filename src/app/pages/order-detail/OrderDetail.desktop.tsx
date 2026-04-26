import React from 'react';
import { OrderDetailMobile } from './OrderDetail.mobile';

/**
 * Desktop layout shell only. All data hooks live in OrderDetailMobileBody so they run
 * under OrderDetailContext.Provider (avoids useOrderDetail outside provider edge cases).
 */
export function OrderDetailDesktop() {
  return (
    <div className="hidden lg:block max-w-6xl mx-auto px-6 py-4">
      <div className="space-y-4">
        <main className="w-full space-y-4">
          <OrderDetailMobile />
        </main>
      </div>
    </div>
  );
}
