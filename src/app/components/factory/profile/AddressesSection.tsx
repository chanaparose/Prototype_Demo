import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyAddresses } from '@/hooks/factory/useMyAddresses';
import { addressesApi } from '@/services/api';
import { AddressList } from '@/components/factory/AddressList';
import { AddressFormModal, type AddressFormPayload } from '@/components/factory/AddressFormModal';

type Row = Record<string, unknown>;

export function AddressesSection() {
  const qc = useQueryClient();
  const { data: addresses = [] } = useMyAddresses();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['addresses', 'me'] });

  const submit = async (payload: AddressFormPayload, editingId?: string | number) => {
    setSaving(true);
    try {
      if (mode === 'create') {
        await addressesApi.create(payload);
      } else if (editingId != null) {
        await addressesApi.update(editingId, payload);
      }
      setModalOpen(false);
      setEditing(null);
      invalidate();
    } finally {
      setSaving(false);
    }
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
          setModalOpen(true);
        }}
        onEdit={(row) => {
          setMode('edit');
          setEditing(row);
          setModalOpen(true);
        }}
        onDelete={(row) => void remove(row)}
        onSetDefault={(row) => void setDefault(row)}
      />

      <AddressFormModal
        open={modalOpen}
        mode={mode}
        initial={editing}
        saving={saving}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={submit}
      />
    </div>
  );
}
