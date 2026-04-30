import React, { useEffect, useMemo, useState } from 'react';
import { Save, Plus, Trash2, Percent, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, platformConfigApi, type AdminCommissionExemption, type AdminCommissionRule } from '../../services/api';

const RANK: Record<string, number> = { AM: 1, AD: 2, SA: 3 };
function canEdit(role: string, minRole: 'AM' | 'AD' | 'SA'): boolean {
  return (RANK[role] ?? 0) >= RANK[minRole];
}

interface GeneralConfig {
  platform_name: string;
  contact_email: string;
  support_phone: string;
}

interface FactoryOption {
  id: number;
  name: string;
}

interface VerificationRequirement {
  id: string;
  label: string;
  enabled: boolean;
}

type TabKey = 'general' | 'commission' | 'exemptions' | 'verification';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'ทั่วไป' },
  { key: 'commission', label: 'ค่าคอม & VAT' },
  { key: 'exemptions', label: 'โรงงานยกเว้น' },
  { key: 'verification', label: 'การยืนยันโรงงาน' },
];

const DEFAULT_REQUIREMENTS: VerificationRequirement[] = [
  { id: 'dbd', label: 'ต้องมีเอกสาร DBD', enabled: true },
  { id: 'photo', label: 'ต้องมีรูปถ่ายโรงงาน', enabled: true },
  { id: 'email', label: 'ต้องยืนยัน email', enabled: true },
  { id: 'iso', label: 'ต้องมี ISO certificate', enabled: false },
  { id: 'address', label: 'ต้องมีที่อยู่จดทะเบียน', enabled: true },
];

function toRows<T extends Record<string, unknown>>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.rows)) return obj.rows as T[];
  }
  return [];
}

function SaveButton({ saving, saved, disabled, onClick }: { saving: boolean; saved: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
    >
      <Save size={14} />
      {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}
    </button>
  );
}

export function AdminConfigPage() {
  const { user } = useAuth();
  const role = String(user?.role ?? '');
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [general, setGeneral] = useState<GeneralConfig>({
    platform_name: 'Tryly B2B Manufacturing',
    contact_email: 'support@wemake.co.th',
    support_phone: '-',
  });
  const [vatRate, setVatRate] = useState<number>(7);
  const [globalCommission, setGlobalCommission] = useState<number>(10);

  const [factoryOptions, setFactoryOptions] = useState<FactoryOption[]>([]);
  const [rules, setRules] = useState<AdminCommissionRule[]>([]);
  const [exemptions, setExemptions] = useState<AdminCommissionExemption[]>([]);

  const [newRule, setNewRule] = useState({ factory_id: '', commission_rate: '', effective_from: '' });
  const [newExemption, setNewExemption] = useState({ factory_id: '', reason: '', expires_at: '' });

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState(false);

  const [savingCommission, setSavingCommission] = useState(false);
  const [savedCommission, setSavedCommission] = useState(false);

  const [savingVerification, setSavingVerification] = useState(false);
  const [savedVerification, setSavedVerification] = useState(false);
  const [requirements, setRequirements] = useState<VerificationRequirement[]>(DEFAULT_REQUIREMENTS);

  const isGeneralAllowed = canEdit(role, 'SA');
  const isCommissionAllowed = canEdit(role, 'AD');
  const isExemptionAllowed = canEdit(role, 'SA');

  const factoryNameMap = useMemo(() => {
    const map = new Map<number, string>();
    factoryOptions.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [factoryOptions]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [platformConfig, factoriesRaw, rulesRaw, exemptionsRaw] = await Promise.all([
        platformConfigApi.getActive(),
        adminApi.listFactories({ page: 1, page_size: 200 }),
        adminApi.listCommissionRules({ active_only: true }),
        adminApi.listCommissionExemptions({ active_only: true }),
      ]);

      setVatRate(Number(platformConfig.vat_rate ?? 7));
      setGlobalCommission(Number(platformConfig.default_commission_rate ?? 10));
      setGeneral((prev) => ({
        ...prev,
        platform_name: prev.platform_name,
      }));

      const factoryRows = toRows<Record<string, unknown>>(factoriesRaw).map((row) => ({
        id: Number(row.factory_id ?? row.id ?? 0),
        name: String(row.factory_name ?? row.name ?? '-'),
      })).filter((r) => r.id > 0);
      setFactoryOptions(factoryRows);

      setRules(Array.isArray(rulesRaw) ? rulesRaw : []);
      setExemptions(Array.isArray(exemptionsRaw) ? exemptionsRaw : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดการตั้งค่าระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSaveGeneral = async () => {
    if (!isGeneralAllowed) return;
    setSavingGeneral(true);
    try {
      await platformConfigApi.create({
        default_commission_rate: Number(globalCommission),
        vat_rate: Number(vatRate),
        currency_code: 'THB',
        effective_from: new Date().toISOString(),
      });
      setSavedGeneral(true);
      setTimeout(() => setSavedGeneral(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกการตั้งค่าทั่วไปไม่สำเร็จ');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveGlobalRates = async () => {
    if (!isGeneralAllowed) return;
    setSavingCommission(true);
    try {
      await platformConfigApi.create({
        default_commission_rate: Number(globalCommission),
        vat_rate: Number(vatRate),
        currency_code: 'THB',
        effective_from: new Date().toISOString(),
      });
      setSavedCommission(true);
      setTimeout(() => setSavedCommission(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกค่าคอม/VAT ไม่สำเร็จ');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleAddRule = async () => {
    if (!isCommissionAllowed) return;
    const factory_id = Number(newRule.factory_id);
    const commission_rate = Number(newRule.commission_rate);
    if (!factory_id || !Number.isFinite(commission_rate)) return;

    setSavingCommission(true);
    try {
      await adminApi.createCommissionRule({
        factory_id,
        commission_rate,
        effective_from: newRule.effective_from || undefined,
      });
      setNewRule({ factory_id: '', commission_rate: '', effective_from: '' });
      const latest = await adminApi.listCommissionRules({ active_only: true });
      setRules(Array.isArray(latest) ? latest : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เพิ่ม commission override ไม่สำเร็จ');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!isCommissionAllowed) return;
    try {
      await adminApi.deleteCommissionRule(ruleId);
      setRules((prev) => prev.filter((r) => r.rule_id !== ruleId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบ commission override ไม่สำเร็จ');
    }
  };

  const handleAddExemption = async () => {
    if (!isExemptionAllowed) return;
    const factory_id = Number(newExemption.factory_id);
    if (!factory_id || newExemption.reason.trim().length < 5) return;

    try {
      await adminApi.createCommissionExemption({
        factory_id,
        reason: newExemption.reason.trim(),
        expires_at: newExemption.expires_at || undefined,
      });
      setNewExemption({ factory_id: '', reason: '', expires_at: '' });
      const latest = await adminApi.listCommissionExemptions({ active_only: true });
      setExemptions(Array.isArray(latest) ? latest : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เพิ่มโรงงานยกเว้นไม่สำเร็จ');
    }
  };

  const handleDeleteExemption = async (id: number) => {
    if (!isExemptionAllowed) return;
    try {
      await adminApi.deleteCommissionExemption(id);
      setExemptions((prev) => prev.filter((r) => r.exemption_id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบโรงงานยกเว้นไม่สำเร็จ');
    }
  };

  const handleSaveVerification = async () => {
    setSavingVerification(true);
    setTimeout(() => {
      setSavingVerification(false);
      setSavedVerification(true);
      setTimeout(() => setSavedVerification(false), 2200);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-400 font-medium">Admin / ตั้งค่า</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">ตั้งค่าระบบ</h2>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-sm text-slate-500">กำลังโหลดการตั้งค่า...</p>
          ) : null}

          {!loading && activeTab === 'general' ? (
            <div className="space-y-5 max-w-lg">
              {!isGeneralAllowed ? (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  เฉพาะ Super Admin เท่านั้นที่แก้ไขการตั้งค่าทั่วไปได้
                </div>
              ) : null}

              <Field label="ชื่อแพลตฟอร์ม" value={general.platform_name} disabled={!isGeneralAllowed} onChange={(v) => setGeneral((p) => ({ ...p, platform_name: v }))} />
              <Field label="อีเมลติดต่อ" value={general.contact_email} type="email" disabled={!isGeneralAllowed} onChange={(v) => setGeneral((p) => ({ ...p, contact_email: v }))} />
              <Field label="โทรศัพท์สนับสนุน" value={general.support_phone} disabled={!isGeneralAllowed} onChange={(v) => setGeneral((p) => ({ ...p, support_phone: v }))} />

              {isGeneralAllowed ? <SaveButton saving={savingGeneral} saved={savedGeneral} onClick={handleSaveGeneral} /> : null}
            </div>
          ) : null}

          {!loading && activeTab === 'commission' ? (
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4">อัตรา Global</h4>
                {!isGeneralAllowed ? (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4">
                    เฉพาะ Super Admin เท่านั้นที่แก้ไขอัตรา Global ได้
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <RateField label="VAT (%)" value={vatRate} disabled={!isGeneralAllowed} onChange={setVatRate} />
                  <RateField label="ค่าคอมมิชชัน (%)" value={globalCommission} disabled={!isGeneralAllowed} onChange={setGlobalCommission} />
                </div>
                {isGeneralAllowed ? <div className="mt-4"><SaveButton saving={savingCommission} saved={savedCommission} onClick={handleSaveGlobalRates} /></div> : null}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Override รายโรงงาน</h4>
                <p className="text-xs text-slate-400 mb-4">กำหนดอัตราค่าคอมเฉพาะโรงงาน (override Global rate)</p>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">โรงงาน</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">อัตรา (%)</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">มีผลตั้งแต่</th>
                        {isCommissionAllowed ? <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rules.length === 0 ? (
                        <tr>
                          <td colSpan={isCommissionAllowed ? 4 : 3} className="px-4 py-8 text-center text-sm text-slate-400">ยังไม่มี override</td>
                        </tr>
                      ) : (
                        rules.map((r) => (
                          <tr key={r.rule_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-700">{r.factory_name || factoryNameMap.get(Number(r.factory_id)) || `Factory #${r.factory_id}`}</td>
                            <td className="px-4 py-3 text-sm font-bold text-indigo-700 text-right tabular-nums">{Number(r.commission_rate).toLocaleString('th-TH')}%</td>
                            <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{String(r.effective_from ?? '').slice(0, 10)}</td>
                            {isCommissionAllowed ? (
                              <td className="px-4 py-3 text-right">
                                <button type="button" onClick={() => void handleDeleteRule(r.rule_id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {isCommissionAllowed ? (
                  <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-700 mb-3">เพิ่ม Override ใหม่</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={newRule.factory_id}
                        onChange={(e) => setNewRule((p) => ({ ...p, factory_id: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">เลือกโรงงาน</option>
                        {factoryOptions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          placeholder="อัตรา %"
                          value={newRule.commission_rate}
                          onChange={(e) => setNewRule((p) => ({ ...p, commission_rate: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Percent size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        value={newRule.effective_from}
                        onChange={(e) => setNewRule((p) => ({ ...p, effective_from: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAddRule()}
                      disabled={!newRule.factory_id || !newRule.commission_rate}
                      className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
                    >
                      <Plus size={14} />
                      เพิ่ม
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'exemptions' ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">รายการยกเว้นค่าคอมมิชชัน</h4>
                <p className="text-xs text-slate-400 mb-4">โรงงานในรายการนี้จะไม่ถูกหักค่าคอมตลอดช่วงเวลาที่กำหนด</p>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">โรงงาน</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">เหตุผล</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">หมดอายุ</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">เพิ่มโดย</th>
                        {isExemptionAllowed ? <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exemptions.length === 0 ? (
                        <tr>
                          <td colSpan={isExemptionAllowed ? 5 : 4} className="px-4 py-8 text-center text-sm text-slate-400">ยังไม่มีโรงงานในรายการยกเว้น</td>
                        </tr>
                      ) : (
                        exemptions.map((ex) => (
                          <tr key={ex.exemption_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{ex.factory_name || factoryNameMap.get(Number(ex.factory_id)) || `Factory #${ex.factory_id}`}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">{String(ex.reason ?? '-')}</td>
                            <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{String(ex.expires_at ?? '-').slice(0, 10)}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{String(ex.added_by ?? '-')}</td>
                            {isExemptionAllowed ? (
                              <td className="px-4 py-3 text-right">
                                <button type="button" onClick={() => void handleDeleteExemption(ex.exemption_id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {isExemptionAllowed ? (
                  <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-700 mb-3">เพิ่มโรงงานยกเว้น</p>
                    <div className="space-y-3">
                      <select
                        value={newExemption.factory_id}
                        onChange={(e) => setNewExemption((p) => ({ ...p, factory_id: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">เลือกโรงงาน</option>
                        {factoryOptions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <textarea
                        rows={2}
                        value={newExemption.reason}
                        onChange={(e) => setNewExemption((p) => ({ ...p, reason: e.target.value }))}
                        placeholder="ระบุเหตุผลในการยกเว้น..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">หมดอายุวันที่</label>
                          <input
                            type="date"
                            value={newExemption.expires_at}
                            onChange={(e) => setNewExemption((p) => ({ ...p, expires_at: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="pt-5">
                          <button
                            type="button"
                            onClick={() => void handleAddExemption()}
                            disabled={!newExemption.factory_id || newExemption.reason.trim().length < 5}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            <Plus size={14} />
                            เพิ่ม
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'verification' ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">เงื่อนไขการยืนยันโรงงาน</h4>
                <p className="text-xs text-slate-400 mb-5">เปิด/ปิดข้อกำหนดที่โรงงานต้องผ่านก่อนได้รับการอนุมัติ</p>

                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setRequirements((prev) => prev.map((r) => (r.id === req.id ? { ...r, enabled: !r.enabled } : r)))}
                    >
                      <div className="flex items-center gap-3">
                        {req.enabled ? <CheckSquare size={18} className="text-indigo-600 shrink-0" /> : <Square size={18} className="text-slate-300 shrink-0" />}
                        <span className={`text-sm ${req.enabled ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{req.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <SaveButton saving={savingVerification} saved={savedVerification} onClick={handleSaveVerification} />
                  <p className="text-xs text-slate-400">เปิดใช้งาน {requirements.filter((r) => r.enabled).length} / {requirements.length} เงื่อนไข</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">หมายเหตุ: backend ปัจจุบันยังไม่มี endpoint checklist กลางสำหรับ tab นี้ จึงบันทึกแบบ local ชั่วคราว</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, type = 'text', disabled, onChange }: { label: string; value: string; type?: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
      />
    </div>
  );
}

function RateField({ label, value, disabled, onChange }: { label: string; value: number; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
        />
        <Percent size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}
