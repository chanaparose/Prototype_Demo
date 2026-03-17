import React from 'react';
import { IdeaDetailMobile } from './IdeaDetail.mobile';

export function IdeaDetailDesktop() {
  return (
    <div className="hidden lg:block">
      <div className="max-w-4xl mx-auto px-6">
        <IdeaDetailMobile />
      </div>
    </div>
  );
}

