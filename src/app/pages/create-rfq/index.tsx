import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useCreateRfqState } from '../../hooks/useCreateRfqState';
import { CreateRfqMobile } from './CreateRfq.mobile.tsx';
import { CreateRfqDesktop } from './CreateRfq.desktop.tsx';

export function CreateRfq() {
  const isDesktop = useIsDesktop();
  const state = useCreateRfqState();

  if (isDesktop) {
    return <CreateRfqDesktop state={state} />;
  }

  return <CreateRfqMobile state={state} />;
}

