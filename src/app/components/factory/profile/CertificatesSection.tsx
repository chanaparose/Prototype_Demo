import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useFactoryCerts } from '@/hooks/factory/useFactoryCerts';
import { useMasterCerts, type CertTypeOption } from '@/hooks/master/useMasterCerts';
import { certificatesApi, mediaApi } from '@/services/api';
import { CertStatusBadge } from '@/components/factory/CertStatusBadge';
import { CertUploadModal, type CertFormSubmitValue } from '@/components/factory/CertUploadModal';
import { Button } from '@/components/ui/button';

type Row = Record<string, unknown>;

interface Props {
  factoryId: number | string;
  /** Called by parent to register the "open add modal" handler */
  onRegisterAdd?: (handler: () => void) => void;
}

function certRowId(c: Row): string | number | null {
  const v = c.map_id ?? c.factory_certificate_id ?? c.id ?? c.cert_id;
  if (v == null || String(v).trim() === '') return null;
  return v as string | number;
}

function certTypeDisplay(c: Row, certTypes: CertTypeOption[]): string {
  const cid = Number(c.certificate_id ?? c.cert_id);
  const byMaster = certTypes.find((x) => x.id === cid)?.label;
  if (byMaster) return byMaster;
  return String(c.cert_name ?? c.name_th ?? c.name ?? c.cert_number ?? 'ใบรับรอง');
}

function certDocUrl(c: Row) {
  return String(c.document_url ?? c.image_url ?? '').trim();
}

function toDateInputValue(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  return s.length >= 10 ? s.slice(0, 10) : '';
}

export function CertificatesSection({ factoryId, onRegisterAdd }: Props) {
  const qc = useQueryClient();
  const { data: certs = [] } = useFactoryCerts(factoryId);
  const { data: masterCertTypes = [] } = useMasterCerts();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setMode('create');
    setEditing(null);
    setModalOpen(true);
  };

  // Register the add handler with parent once on mount
  useEffect(() => {
    onRegisterAdd?.(openAdd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['factory', String(factoryId), 'certs'] });

  const submit = async (value: CertFormSubmitValue, keepOpen: boolean) => {
    setSaving(true);
    try {
      let documentUrl = '';
      if (value.file) {
        const up = await mediaApi.upload(value.file);
        documentUrl = up.url;
      }
      if (mode === 'create') {
        if (!documentUrl) throw new Error('กรุณาอัปโหลดไฟล์เอกสาร');
        await certificatesApi.create(factoryId, {
          cert_id: value.cert_id,
          document_url: documentUrl,
          cert_number: value.cert_number,
          expire_date: value.expire_date,
        });
      } else {
        const id = certRowId(editing ?? {});
        if (id == null) throw new Error('ไม่พบรหัสใบรับรองที่จะแก้ไข');
        await certificatesApi.update(factoryId, id, {
          cert_id: value.cert_id,
          cert_number: value.cert_number,
          expire_date: value.expire_date,
          ...(documentUrl ? { document_url: documentUrl } : {}),
        });
      }
      invalidate();
      if (!keepOpen || mode === 'edit') {
        setModalOpen(false);
        setEditing(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Row) => {
    const id = certRowId(c);
    if (id == null) return;
    if (!window.confirm('ลบใบรับรองนี้?')) return;
    await certificatesApi.delete(factoryId, id);
    invalidate();
  };

  return (
    <div>
      {certs.length === 0 ? (
        <p className='text-sm text-gray-400'>ยังไม่มีใบรับรอง</p>
      ) : (
        <ul className='space-y-2'>
          {certs.map((c, i) => {
            const key = String(certRowId(c) ?? i);
            const docUrl = certDocUrl(c);
            const expire = toDateInputValue(c.expire_date);
            return (
              <li
                key={key}
                className='text-sm border border-gray-100 rounded-xl px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'
              >
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='font-semibold text-gray-900'>
                      {certTypeDisplay(c, masterCertTypes)}
                    </span>
                    <CertStatusBadge status={String(c.verify_status ?? c.status ?? 'PD')} />
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    เลขที่เอกสาร: {String(c.cert_number ?? '—')}
                    {expire ? ` · หมดอายุ: ${expire}` : ''}
                  </p>
                </div>
                <div className='flex items-center gap-1.5 shrink-0'>
                  {docUrl ? (
                    <a
                      href={docUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50'
                    >
                      <Download size={13} /> ดาวน์โหลด
                    </a>
                  ) : null}
                  <Button
                    onClick={() => {
                      setMode('edit');
                      setEditing(c);
                      setModalOpen(true);
                    }}
                    variant='outline'
                    size='icon-sm'
                    className='p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50'
                    aria-label='แก้ไข'
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    onClick={() => void remove(c)}
                    variant='outline'
                    size='icon-sm'
                    className='p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50'
                    aria-label='ลบ'
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CertUploadModal
        open={modalOpen}
        mode={mode}
        certTypes={masterCertTypes}
        initial={editing}
        submitting={saving}
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
