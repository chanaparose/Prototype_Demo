import React from 'react';
import { platformConfigApi } from '@/services/api/adminApi';
import type { IPlatformConfigResponse } from '@/services/api/types/admin.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = {
  default_commission_rate: number;
  promo_enabled: boolean;
  promo_commission_rate: number;
  promo_label: string;
  promo_start_at: string;
  promo_end_at: string;
  vat_rate: number;
};

function fromConfig(c: IPlatformConfigResponse): FormState {
  return {
    default_commission_rate: c.default_commission_rate,
    promo_enabled: c.promo_commission_rate != null,
    promo_commission_rate: c.promo_commission_rate ?? 0,
    promo_label: c.promo_label ?? '',
    promo_start_at: c.promo_start_at ?? '',
    promo_end_at: c.promo_end_at ?? '',
    vat_rate: c.vat_rate,
  };
}

export function CommissionConfig() {
  const [active, setActive] = React.useState<IPlatformConfigResponse | null>(null);
  const [history, setHistory] = React.useState<IPlatformConfigResponse[]>([]);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const [a, h] = await Promise.all([
        platformConfigApi.getActive(),
        platformConfigApi.history(),
      ]);
      setActive(a);
      setHistory(h);
      setForm(fromConfig(a));
    })();
  }, []);

  if (!form || !active) return <div className='px-4 py-8 text-sm text-gray-500'>กำลังโหลด...</div>;

  return (
    <div className='max-w-3xl mx-auto px-4 py-6 space-y-4'>
      <div className='bg-white rounded-2xl border border-gray-100 p-4 space-y-3'>
        <p className='text-base font-bold text-gray-900'>Commission Config</p>
        <Label className='block text-sm'>
          <span className='text-gray-500'>Default Rate (%)</span>
          <Input
            type='number'
            step='0.01'
            placeholder='0.00'
            value={form.default_commission_rate}
            onChange={(e) =>
              setForm({
                ...form,
                default_commission_rate: Number(e.target.value) || 0,
              })
            }
            className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2'
          />
        </Label>
        <div className='border-t border-gray-100 pt-3 space-y-3'>
          <Label className='inline-flex items-center gap-2 text-sm'>
            <Checkbox
              checked={form.promo_enabled}
              onCheckedChange={(checked) => setForm({ ...form, promo_enabled: checked === true })}
            />
            Enable Promo
          </Label>
          {form.promo_enabled ? (
            <>
              <Input
                type='number'
                step='0.01'
                value={form.promo_commission_rate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    promo_commission_rate: Number(e.target.value) || 0,
                  })
                }
                placeholder='Promo rate (%)'
                className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
              />
              <Input
                value={form.promo_label}
                onChange={(e) => setForm({ ...form, promo_label: e.target.value })}
                placeholder='Promo label'
                className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
              />
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  type='date'
                  title='วันเริ่มต้นโปรโมชัน'
                  value={form.promo_start_at}
                  onChange={(e) => setForm({ ...form, promo_start_at: e.target.value })}
                  className='rounded-xl border border-gray-200 px-3 py-2 text-sm'
                />
                <Input
                  type='date'
                  title='วันสิ้นสุดโปรโมชัน'
                  value={form.promo_end_at}
                  onChange={(e) => setForm({ ...form, promo_end_at: e.target.value })}
                  className='rounded-xl border border-gray-200 px-3 py-2 text-sm'
                />
              </div>
            </>
          ) : null}
        </div>
        <Label className='block text-sm'>
          <span className='text-gray-500'>VAT (%)</span>
          <Input
            type='number'
            step='0.01'
            placeholder='0.00'
            value={form.vat_rate}
            onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) || 0 })}
            className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2'
          />
        </Label>
        <div className='rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600'>
          <p>Preview Impact</p>
          <p>- Draft quotes affected: 47</p>
          <p>- Accepted quotes (locked): 103</p>
          <p>- Est monthly commission: ฿245k → ฿0</p>
        </div>
        <Button
          variant='unstyled'
          type='button'
          disabled={saving}
          onClick={async () => {
            const ok = window.confirm(
              'การเปลี่ยน rate จะมีผลกับ quote ใหม่เท่านั้น quote ที่ submit แล้วใช้ rate เดิม',
            );
            if (!ok) return;
            setSaving(true);
            try {
              const created = await platformConfigApi.create({
                default_commission_rate: form.default_commission_rate,
                promo_commission_rate: form.promo_enabled ? form.promo_commission_rate : null,
                promo_label: form.promo_enabled ? form.promo_label : null,
                promo_start_at: form.promo_enabled ? form.promo_start_at : null,
                promo_end_at: form.promo_enabled ? form.promo_end_at : null,
                vat_rate: form.vat_rate,
                currency_code: active.currency_code,
              });
              setActive(created);
              setForm(fromConfig(created));
              const h = await platformConfigApi.history();
              setHistory(h);
            } finally {
              setSaving(false);
            }
          }}
          className='w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50'
        >
          {saving ? 'Saving...' : 'Save -> New Ver'}
        </Button>
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 p-4'>
        <p className='text-sm font-bold text-gray-900 mb-2'>History</p>
        <div className='space-y-1 text-xs'>
          {history.map((h) => (
            <div key={h.config_id} className='flex items-center justify-between text-gray-600'>
              <span>v{h.config_id}</span>
              <span>{h.effective_from}</span>
              <span>{h.effective_to ?? 'active'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
