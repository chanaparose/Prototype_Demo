import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useModal } from '@/hooks/ui/useModal';
import { useMasterCerts, type CertTypeOption } from '@/hooks/master/useMasterCerts';
import { certificatesApi } from '@/services/api/userApi';
import { mediaApi } from '@/services/api/factoryApi';
import { CertStatusBadge } from '@/components/factory/CertStatusBadge';
import { CertUploadModal, type CertFormSubmitValue } from '@/components/factory/CertUploadModal';
import { Button } from '@/components/ui/button';
import { factoryButtonClass, factoryCardClass } from '@/pages/factory-portal/factoryUi';

type Row = Record<string, unknown>;

interface Props {
  factoryId: number | string;
  certs?: Row[];
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

export function CertificatesSection({ factoryId, certs = [], onRegisterAdd }: Props) {
  const qc = useQueryClient();
  const { data: masterCertTypes = [] } = useMasterCerts();

  const modal = useModal();
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Row | null>(null);

  const openAdd = () => {
    setMode('create');
    setEditing(null);
    modal.openModal();
  };

  // Register the add handler with parent once on mount
  useEffect(() => {
    onRegisterAdd?.(openAdd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['factory', 'me'] });

  const submit = async (value: CertFormSubmitValue, keepOpen: boolean) => {
    modal.setLoading(true);
    modal.clearError();
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
        modal.closeModal();
        setEditing(null);
      }
    } catch (err) {
      throw err;
    } finally {
      modal.setLoading(false);
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
                className={factoryCardClass({
                  variant: 'list',
                  className:
                    'flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between',
                })}
              >
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='font-medium text-gray-900'>
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
                      className={factoryButtonClass({ variant: 'secondary', size: 'sm' })}
                    >
                      <Download size={13} /> ดาวน์โหลด
                    </a>
                  ) : null}
                  <Button
                    onClick={() => {
                      setMode('edit');
                      setEditing(c);
                      modal.openModal();
                    }}
                    variant='unstyled'
                    size='icon-sm'
                    className={factoryButtonClass({ variant: 'ghostIcon', size: 'icon' })}
                    aria-label='แก้ไข'
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    onClick={() => void remove(c)}
                    variant='unstyled'
                    size='icon-sm'
                    className={factoryButtonClass({ variant: 'dangerIcon', size: 'icon' })}
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
        open={modal.isOpen}
        mode={mode}
        certTypes={masterCertTypes}
        initial={editing}
        submitting={modal.isLoading}
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
