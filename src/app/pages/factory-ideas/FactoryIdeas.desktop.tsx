import React from 'react';
import { FactoryIdeasMobile } from './FactoryIdeas.mobile';

// Desktop UI can diverge later; keep behavior identical for now.
export function FactoryIdeasDesktop() {
  return (
    <div className="hidden lg:block">
      <div className="max-w-6xl mx-auto px-6">
        <FactoryIdeasMobile />
      </div>
    </div>
  );
}

