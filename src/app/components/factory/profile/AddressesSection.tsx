import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addressKeys } from '@/lib/queryKeys';
import { useMyAddresses } from '@/hooks/factory/useMyAddresses';
import { useModal } from '@/hooks/ui/useModal';
import { addressesApi } from '@/services/api/masterApi';
import { AddressList } from '@/components/factory/AddressList';
import { AddressFormModal, type AddressFormPayload } from '@/components/factory/AddressFormModal';
import { useConfirmDialog } from '@/shared/ui/modals/ConfirmDialog';

type Row = Record<string, unknown>;

export function AddressesSection() {
  const qc = useQueryClient();
  const { data: addresses = [] } = useMyAddresses();
  const modal = useModal();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Row | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: addressKeys.me() });

  const submit = async (payload: AddressFormPayload, editingId?: string | number) => {
    modal.setLoading(true);
    modal.clearError();
    try {
      if (mode === 'create') {
        await addressesApi.create(payload);
      } else if (editingId != null) {
        await addressesApi.update(editingId, payload);
      }
      invalidate();
      modal.closeModal();
      setEditing(null);
    } catch (err) {
      throw err;
    } finally {
      modal.setLoading(false);
    }
  };

  const remove = async (row: Row) => {
    const id = row.address_id ?? row.id;
    if (id == null) return;
    const ok = await confirm({
      title: 'ลบที่อยู่นี้?',
      description: 'ที่อยู่นี้จะถูกลบออกจากโปรไฟล์โรงงาน',
      confirmText: 'ลบที่อยู่',
      destructive: true,
    });
    if (!ok) return;
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
      <ConfirmDialog />
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
