import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyAddresses } from '@/hooks/factory/useMyAddresses';
import { useModal } from '@/hooks/ui/useModal';
import { addressesApi } from '@/services/api';
import { AddressList } from '@/components/factory/AddressList';
import { AddressFormModal, type AddressFormPayload } from '@/components/factory/AddressFormModal';

type Row = Record<string, unknown>;

export function AddressesSection() {
  const qc = useQueryClient();
  const { data: addresses = [] } = useMyAddresses();
  const modal = useModal();

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Row | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['addresses', 'me'] });

  const submit = async (payload: AddressFormPayload, editingId?: string | number) => {
    const ok = await modal.runAsync(async () => {
      if (mode === 'create') {
        await addressesApi.create(payload);
      } else if (editingId != null) {
        await addressesApi.update(editingId, payload);
      }
      invalidate();
    });
    if (ok === undefined) return;
    modal.closeModal();
    setEditing(null);
  };

  const remove = async (row: Row) => {
    const id = row.address_id ?? row.id;
    if (id == null) return;
    if (!window.confirm('ลบที่อยู่นี้?')) return;
    await addressesApi.delete(id as string | number);
    invalidate();
  };

  const setDefault = async (row: Row) => {
    const id = row.address_id ?? row.id;
    if (id == null) return;
    await addressesApi.update(id as string | number, { is_default: true });
    invalidate();
  };

  return (
    <div>
      <AddressList
        addresses={addresses}
        onCreate={() => {
          setMode('create');
          setEditing(null);
          modal.openModal();
        }}
        onEdit={(row) => {
          setMode('edit');
          setEditing(row);
          modal.openModal();
        }}
        onDelete={(row) => void remove(row)}
        onSetDefault={(row) => void setDefault(row)}
      />

      <AddressFormModal
        open={modal.isOpen}
        mode={mode}
        initial={editing}
        saving={modal.isLoading}
        onClose={() => {
          if (modal.isLoading) return;
          modal.closeModal();
          setEditing(null);
        }}
        onSubmit={submit}
      />
    </div>
  );
}
