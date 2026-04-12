import React, { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, Factory, Loader2 } from 'lucide-react';
import { useRegisterFactory } from './useRegisterFactory';
import type { FormState } from './useRegisterFactory';

const inputBase =
  'w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-shadow';
const inputNormal = 'border-gray-200 focus:ring-2 focus:ring-[#A238FF]/25 focus:border-[#A238FF]';
const inputError = 'border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500';

function FieldBlock({
  label,
  error,
  fieldKey,
  setFieldRef,
  children,
}: {
  label: string;
  error?: string;
  fieldKey: keyof FormState;
  setFieldRef: (key: keyof FormState) => (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div ref={setFieldRef(fieldKey)} className="space-y-1.5">
      <label className="block text-sm font-medium text-[#2D1B4E]">{label}</label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function RegisterFactoryPage() {
  const {
    form,
    errors,
    factoryTypes,
    factoryTypesLoadFailed,
    submitting,
    apiError,
    setField,
    submit,
    blurField,
    setFieldRef,
  } = useRegisterFactory();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const inClass = (err?: string) => `${inputBase} ${err ? inputError : inputNormal}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F5FF] to-white py-6 md:py-10 px-4">
      <div className="max-w-[960px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden md:flex border border-[#A238FF]/10">
        <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-[#2D1B4E] text-white p-10 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=900)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B4E] via-[#2D1B4E]/85 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Factory className="text-white" size={28} strokeWidth={2.2} />
              <span className="text-xl font-bold tracking-tight">WeMake</span>
            </div>
            <h1 className="text-3xl font-bold mb-3 leading-tight">
              เริ่มต้นรับออเดอร์ที่ WeMake ฟรี
            </h1>
            <p className="text-white/90 text-base leading-relaxed max-w-sm">
              สมัครภายในไม่กี่นาที เข้าถึง RFQ จากลูกค้าทั่วประเทศทันทีหลังยืนยันบัญชี
            </p>
          </div>
        </div>

        <form
          className="flex-1 p-6 md:p-10 space-y-4 md:space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          noValidate
        >
          <h2 className="text-2xl font-bold text-[#2D1B4E]">สมัครบัญชีโรงงาน</h2>
          <p className="text-sm text-gray-600 -mt-2">
            กรอกข้อมูลธุรกิจและบัญชีผู้ดูแล — ข้อมูลจะถูกใช้สำหรับติดต่อและออกใบกำกับภาษี
          </p>

          {apiError ? (
            <div
              className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100"
              role="alert"
            >
              {apiError}
            </div>
          ) : null}

          <FieldBlock
            label="ชื่อโรงงาน / บริษัท"
            error={errors.factory_name}
            fieldKey="factory_name"
            setFieldRef={setFieldRef}
          >
            <input
              type="text"
              autoComplete="organization"
              maxLength={150}
              value={form.factory_name}
              onChange={(e) => setField('factory_name', e.target.value)}
              onBlur={() => blurField('factory_name')}
              className={inClass(errors.factory_name)}
              placeholder="เช่น บริษัท เอบีซี จำกัด"
            />
          </FieldBlock>

          <FieldBlock
            label="ประเภทโรงงาน"
            error={errors.factory_type_id}
            fieldKey="factory_type_id"
            setFieldRef={setFieldRef}
          >
            <select
              value={form.factory_type_id || ''}
              onChange={(e) =>
                setField('factory_type_id', Number(e.target.value) || 0)
              }
              onBlur={() => blurField('factory_type_id')}
              className={inClass(errors.factory_type_id)}
            >
              <option value="">— เลือกประเภทโรงงาน —</option>
              {factoryTypes.map((t) => (
                <option key={t.factory_type_id} value={t.factory_type_id}>
                  {t.name_th}
                </option>
              ))}
            </select>
            {factoryTypesLoadFailed && factoryTypes.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                ไม่สามารถโหลดประเภทโรงงาน — กรุณารีเฟรชหน้าหรือลองใหม่ภายหลัง
              </p>
            ) : null}
          </FieldBlock>

          <FieldBlock
            label="เลขประจำตัวผู้เสียภาษี"
            error={errors.tax_id}
            fieldKey="tax_id"
            setFieldRef={setFieldRef}
          >
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={13}
              value={form.tax_id}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 13);
                setField('tax_id', v);
              }}
              onBlur={() => blurField('tax_id')}
              className={inClass(errors.tax_id)}
              placeholder="13 หลัก ไม่มีขีด"
            />
          </FieldBlock>

          <FieldBlock
            label="อีเมล"
            error={errors.email}
            fieldKey="email"
            setFieldRef={setFieldRef}
          >
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={() => blurField('email')}
              className={inClass(errors.email)}
              placeholder="owner@factory.com"
            />
          </FieldBlock>

          <FieldBlock
            label="เบอร์โทรศัพท์"
            error={errors.phone}
            fieldKey="phone"
            setFieldRef={setFieldRef}
          >
            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              onBlur={() => blurField('phone')}
              className={inClass(errors.phone)}
              placeholder="0812345678"
            />
          </FieldBlock>

          <FieldBlock
            label="รหัสผ่าน"
            error={errors.password}
            fieldKey="password"
            setFieldRef={setFieldRef}
          >
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                onBlur={() => blurField('password')}
                className={`${inClass(errors.password)} pr-12`}
                placeholder="อย่างน้อย 8 ตัว มีทั้งตัวเลขและตัวอักษร"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FieldBlock>

          <FieldBlock
            label="ยืนยันรหัสผ่าน"
            error={errors.confirmPassword}
            fieldKey="confirmPassword"
            setFieldRef={setFieldRef}
          >
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                onBlur={() => blurField('confirmPassword')}
                className={`${inClass(errors.confirmPassword)} pr-12`}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showConfirm ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FieldBlock>

          <div ref={setFieldRef('acceptTerms')} className="space-y-1.5">
            <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => setField('acceptTerms', e.target.checked)}
                onBlur={() => blurField('acceptTerms')}
                className="mt-1 rounded border-gray-300 text-[#A238FF] focus:ring-[#A238FF]"
              />
              <span>
                ยอมรับ{' '}
                <span className="font-semibold text-[#2D1B4E]">ข้อตกลงและเงื่อนไขการใช้บริการ</span>
              </span>
            </label>
            {errors.acceptTerms ? (
              <p className="text-sm text-red-600 pl-7">{errors.acceptTerms}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#A238FF] hover:bg-[#8B2BE2] disabled:opacity-55 disabled:pointer-events-none text-white py-3.5 rounded-xl font-bold text-sm md:text-base transition-colors shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
                กำลังสมัคร...
              </>
            ) : (
              'สมัครสมาชิกโรงงาน'
            )}
          </button>

          <p className="text-sm text-center text-gray-600 pt-1">
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="text-[#A238FF] font-bold hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
