import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Star, Loader2, Copy, Check } from 'lucide-react';
import { bankAccountApi } from '@/services/api/factoryApi';
import type { IBankAccountResponse } from '@/services/api/types/admin.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  factoryBadgeClass,
  factoryButtonClass,
  factoryCardClass,
} from '@/pages/factory-portal/factoryUi';
import { FactoryPageHeader } from '@/pages/factory-portal/components/FactoryPageHeader';

const THAI_BANKS = [
  'กสิกรไทย',
  'ไทยพาณิชย์',
  'กรุงเทพ',
  'กรุงไทย',
  'ทหารไทยธนชาต',
  'กรุงศรีอยุธยา',
  'ออมสิน',
  'ธ.ก.ส.',
  'ซีไอเอ็มบี ไทย',
  'ยูโอบี',
  'แลนด์ แอนด์ เฮ้าส์',
  'อื่นๆ',
];

type FactoryBankSettingsPageProps = {
  embedded?: boolean;
  onRegisterAdd?: (handler: () => void) => void;
};

export function FactoryBankSettingsPage({
  embedded = false,
  onRegisterAdd,
}: FactoryBankSettingsPageProps = {}) {
  const [accounts, setAccounts] = useState<IBankAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  // Form state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await bankAccountApi.list();
      setAccounts(res.accounts ?? []);
    } catch {
      setError('โหลดบัญชีธนาคารไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const resetForm = useCallback(() => {
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setIsDefault(true);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  useEffect(() => {
    onRegisterAdd?.(openAdd);
  }, [onRegisterAdd, openAdd]);

  const openEdit = (acc: IBankAccountResponse) => {
    setBankName(acc.bank_name);
    setAccountNumber(acc.account_number);
    setAccountName(acc.account_name);
    setIsDefault(acc.is_default);
    setEditingId(acc.account_id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await bankAccountApi.update(editingId, {
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          account_name: accountName.trim(),
          is_default: isDefault,
        });
      } else {
        await bankAccountApi.create({
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          account_name: accountName.trim(),
          is_default: isDefault,
        });
      }
      resetForm();
      await loadAccounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (acc: IBankAccountResponse) => {
    if (!window.confirm(`ลบบัญชี ${acc.bank_name} ${acc.account_number} ?`)) return;
    setError('');
    try {
      await bankAccountApi.delete(acc.account_id);
      await loadAccounts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบบัญชีไม่สำเร็จ');
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 1500);
  };

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-6'}>
      {embedded ? (
        <p className='text-xs text-gray-400'>บัญชีหลักจะแสดงให้ลูกค้าเมื่อสั่งซื้อสินค้า</p>
      ) : (
        <FactoryPageHeader
          title='บัญชีธนาคาร'
          subtitle='Factory / Bank settings · บัญชีหลักจะแสดงให้ลูกค้าเมื่อสั่งซื้อสินค้า'
          icon={Building2}
          actionNode={
            !showForm ? (
              <Button
                variant='unstyled'
                type='button'
                onClick={openAdd}
                className={factoryButtonClass({
                  variant: 'primary',
                  size: 'md',
                  className: 'min-w-[126px]',
                })}
              >
                <Plus size={14} />
                เพิ่มบัญชี
              </Button>
            ) : null
          }
        />
      )}

      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700'>
          {error}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div
          className={factoryCardClass({
            variant: 'section',
            className: 'space-y-4 border-brand-purple/20',
          })}
        >
          <h3 className='text-sm font-bold text-slate-900'>
            {editingId ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีใหม่'}
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <Label className='text-xs font-semibold text-slate-700'>ธนาคาร</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger className='mt-1 w-full text-slate-900'>
                  <SelectValue placeholder='เลือกธนาคาร' />
                </SelectTrigger>
                <SelectContent>
                  {THAI_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='text-xs font-semibold text-slate-700'>เลขบัญชี</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                placeholder='0123456789'
                className='mt-1'
                maxLength={20}
              />
            </div>
            <div className='sm:col-span-2'>
              <Label className='text-xs font-semibold text-slate-700'>ชื่อบัญชี</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder='ชื่อ-สกุล หรือ ชื่อบริษัท'
                className='mt-1'
              />
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='is_default'
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className='cursor-pointer rounded border-slate-300 accent-brand-purple focus:ring-2 focus:ring-brand-purple/25'
              />
              <label
                htmlFor='is_default'
                className='cursor-pointer text-xs font-normal text-slate-700'
              >
                ตั้งเป็นบัญชีหลัก
              </label>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={handleSave}
              disabled={saving}
              className={factoryButtonClass({ variant: 'primary', size: 'md', className: 'px-4' })}
            >
              {saving ? <Loader2 size={13} className='animate-spin' /> : null}
              {editingId ? 'บันทึก' : 'เพิ่มบัญชี'}
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={resetForm}
              className={factoryButtonClass({
                variant: 'secondary',
                size: 'md',
                className: 'px-4',
              })}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {/* Account list */}
      {loading ? (
        <div className='space-y-3'>
          {[1, 2].map((i) => (
            <div key={i} className={factoryCardClass({ variant: 'section' })}>
              <div className='h-5 w-32 bg-slate-100 rounded animate-pulse mb-2' />
              <div className='h-4 w-48 bg-slate-100 rounded animate-pulse' />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 && !showForm ? (
        <div className={factoryCardClass({ variant: 'empty' })}>
          <Building2 size={36} className='mx-auto text-slate-300 mb-3' />
          <p className='text-sm text-slate-500'>ยังไม่มีบัญชีธนาคาร</p>
          <p className='text-xs text-slate-400 mt-1'>เพิ่มบัญชีเพื่อให้ลูกค้าโอนเงินได้</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {accounts.map((acc) => (
            <div
              key={acc.account_id}
              className={`rounded-lg border bg-white p-4 sm:p-5 ${
                acc.is_default
                  ? 'border-brand-purple/20 ring-1 ring-brand-purple/15'
                  : 'border-slate-200'
              }`}
            >
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <Building2 size={14} className='text-slate-400' />
                    <span className='text-sm font-bold text-slate-900'>{acc.bank_name}</span>
                    {acc.is_default && (
                      <span className={factoryBadgeClass({ variant: 'count', className: 'gap-1' })}>
                        <Star size={9} />
                        หลัก
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-slate-700 font-mono'>{acc.account_number}</span>
                    <button
                      type='button'
                      onClick={() => handleCopy(acc.account_number, `num-${acc.account_id}`)}
                      className='text-slate-400 hover:text-brand-purple transition-colors'
                      title='คัดลอกเลขบัญชี'
                    >
                      {copiedField === `num-${acc.account_id}` ? (
                        <Check size={13} className='text-emerald-500' />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-slate-600'>{acc.account_name}</span>
                    <button
                      type='button'
                      onClick={() => handleCopy(acc.account_name, `name-${acc.account_id}`)}
                      className='text-slate-400 hover:text-brand-purple transition-colors'
                      title='คัดลอกชื่อบัญชี'
                    >
                      {copiedField === `name-${acc.account_id}` ? (
                        <Check size={13} className='text-emerald-500' />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
                <div className='flex items-center gap-1'>
                  <button
                    type='button'
                    onClick={() => openEdit(acc)}
                    className={factoryButtonClass({ variant: 'ghostIcon', size: 'icon' })}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDelete(acc)}
                    className={factoryButtonClass({ variant: 'dangerIcon', size: 'icon' })}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
