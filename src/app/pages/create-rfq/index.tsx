import React from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useCreateRfqState } from '../../hooks/useCreateRfqState';
import { AddressFormModal } from '../../components/factory/AddressFormModal';
import { CreateRfqMobile } from './CreateRfq.mobile.tsx';
import { CreateRfqDesktop } from './CreateRfq.desktop.tsx';

export function CreateRfq() {
  const isDesktop = useIsDesktop();
  const state = useCreateRfqState();
  const {
    addressModalOpen,
    addressModalSaving,
    closeAddressModal,
    submitAddress,
  } = state;

  return (
    <>
      {isDesktop ? <CreateRfqDesktop state={state} /> : <CreateRfqMobile state={state} />}
      <AddressFormModal
        open={addressModalOpen}
        mode="create"
        initial={null}
        saving={addressModalSaving}
        onClose={closeAddressModal}
        onSubmit={submitAddress}
      />
    </>
  );
}
