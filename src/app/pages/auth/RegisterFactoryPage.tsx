import React, { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, Factory, Loader2 } from 'lucide-react';
import { useRegisterFactory } from './useRegisterFactory';
import type { FormState } from './useRegisterFactory';

const inputBase =
  'w-full px-4 py-2.5 md:py-3 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-shadow bg-gray-50/50 focus:bg-white';
const inputNormal = 'border-gray-200 focus:ring-2 focus:ring-[#A238FF]/25 focus:border-[#A238FF]';
const inputError = 'border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500';

function FieldBlock({
  label,
  error,
  fieldKey,
  setFieldRef,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  fieldKey: keyof FormState;
  setFieldRef: (key: keyof FormState) => (el: HTMLElement | null) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div ref={setFieldRef(fieldKey)} className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-[#2D1B4E]">{label}</label>
      {children}
      {error ? <p className="text-xs md:text-sm text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

export function RegisterFactoryPage() {
  const {
    form,
    errors,
    factoryTypes,
    factoryTypesLoading,
    factoryTypesLoadFailed,
    retryFactoryTypes,
    submitting,
    apiError,
    isAuthenticated,
    authLoading,
    setField,
    submit,
    blurField,
    setFieldRef,
  } = useRegisterFactory();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const inClass = (err?: string) => `${inputBase} ${err ? inputError : inputNormal}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F5FF] to-white py-6 md:py-12 px-4 flex items-center justify-center">
      {/* ปรับ Max Width ให้กว้างขึ้นเล็กน้อยเพื่อรองรับ Grid 2 คอลัมน์ */}
      <div className="w-full max-w-[1024px] bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden md:flex border border-[#A238FF]/10">
        
        {/* Left Side: Hero / Promo Banner (Desktop Only) */}
        <div className="hidden md:flex md:w-[45%] flex-col justify-between bg-[#2D1B4E] text-white p-12 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=900)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F2E] via-[#2D1B4E]/80 to-transparent" />
          <div className="relative z-10 flex flex-col h-full justify-center">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                <Factory className="text-white" size={32} strokeWidth={2} />
              </div>
              <span className="text-2xl font-bold tracking-tight">WeMake</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              ขยายโอกาสธุรกิจ <br/> รับออเดอร์ทั่วประเทศ
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              สมัครฟรีภายในไม่กี่นาที เพื่อเข้าถึงใบเสนอราคา (RFQ) จากลูกค้าที่กำลังมองหาผู้ผลิตคุณภาพเช่นคุณ
            </p>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <form
          className="flex-1 p-6 sm:p-8 md:p-12"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          noValidate
        >
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2D1B4E] mb-2">สมัครบัญชีโรงงาน</h2>
            <p className="text-sm md:text-base text-gray-500">
              กรุณากรอกข้อมูลธุรกิจของคุณเพื่อเริ่มต้นใช้งาน
            </p>
          </div>

          {apiError && (
            <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          <div className="space-y-8">
            {/* Section 1: Business Info */}
            <div>
              <h3 className="text-base font-semibold text-[#A238FF] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#A238FF]/10 flex items-center justify-center text-xs">1</span>
                ข้อมูลธุรกิจ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <FieldBlock
                  label="ชื่อโรงงาน / บริษัท"
                  error={errors.factory_name}
                  fieldKey="factory_name"
                  setFieldRef={setFieldRef}
                  className="md:col-span-2"
                >
                  <input
                    type="text"
                    autoComplete="organization"
                    maxLength={150}
                    value={form.factory_name}
                    onChange={(e) => setField('factory_name', e.target.value)}
                    onBlur={() => blurField('factory_name')}
                    className={inClass(errors.factory_name)}
                    placeholder="เช่น บริษัท เอบีซี แมนูแฟคเจอริ่ง จำกัด"
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
                    onChange={(e) => setField('factory_type_id', Number(e.target.value) || 0)}
                    onBlur={() => blurField('factory_type_id')}
                    disabled={factoryTypesLoading}
                    className={inClass(errors.factory_type_id)}
                  >
                    {factoryTypesLoading ? (
                      <option value="">กำลังโหลดประเภทโรงงาน...</option>
                    ) : (
                      <option value="">— เลือกประเภท —</option>
                    )}
                    {factoryTypes.map((t) => (
                      <option key={t.factory_type_id} value={t.factory_type_id}>
                        {t.name_th}
                      </option>
                    ))}
                  </select>
                  {factoryTypesLoadFailed && factoryTypes.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-2">
                      ไม่สามารถโหลดข้อมูลได้
                      <button
                        type="button"
                        onClick={retryFactoryTypes}
                        className="underline hover:text-amber-700 transition-colors"
                      >
                        ลองใหม่
                      </button>
                    </p>
                  )}
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
                    placeholder="เลข 13 หลัก"
                  />
                </FieldBlock>
              </div>
            </div>

            {!authLoading && !isAuthenticated && (
              <>
                <div className="h-px bg-gray-100" />

                {/* Section 2: Account Info — shown only for guests */}
                <div>
                  <h3 className="text-base font-semibold text-[#A238FF] mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#A238FF]/10 flex items-center justify-center text-xs">2</span>
                    บัญชีผู้ดูแลระบบ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
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
                        placeholder="081-234-5678"
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
                          className={`${inClass(errors.password)} pr-10`}
                          placeholder="8 ตัวอักษรขึ้นไป"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#A238FF] transition-colors"
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
                          className={`${inClass(errors.confirmPassword)} pr-10`}
                          placeholder="กรอกอีกครั้ง"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#A238FF] transition-colors"
                        >
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FieldBlock>
                  </div>
                </div>
              </>
            )}

            {/* Info banner for logged-in users */}
            {!authLoading && isAuthenticated && (
              <div className="flex items-start gap-3 bg-[#F5F0FF] border border-[#A238FF]/20 rounded-xl px-4 py-3">
                <svg className="w-5 h-5 text-[#A238FF] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[#6B21A8] leading-relaxed">
                  ระบบจะเชื่อมโยงโรงงานนี้กับบัญชีที่คุณล็อกอินอยู่โดยอัตโนมัติ ไม่จำเป็นต้องกรอกข้อมูลบัญชีซ้ำ
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <div ref={setFieldRef('acceptTerms')} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={(e) => setField('acceptTerms', e.target.checked)}
                  onBlur={() => blurField('acceptTerms')}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#A238FF] focus:ring-[#A238FF] transition-colors cursor-pointer"
                />
                <span className="leading-relaxed">
                  ข้าพเจ้ายอมรับ{' '}
                  <a href="#" className="font-semibold text-[#A238FF] hover:underline">ข้อตกลงและเงื่อนไขการใช้บริการ</a>
                  {' '}และนโยบายความเป็นส่วนตัวของแพลตฟอร์ม
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600 pl-7 mt-1.5">{errors.acceptTerms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#A238FF] hover:bg-[#8B2BE2] disabled:opacity-60 disabled:pointer-events-none text-white py-3.5 md:py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-[#A238FF]/20 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
                  กำลังดำเนินการ...
                </>
              ) : (
                'สมัครสมาชิกโรงงาน'
              )}
            </button>

            <p className="text-sm text-center text-gray-500 font-medium">
              มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
              <Link to="/login" className="text-[#A238FF] hover:text-[#8B2BE2] transition-colors hover:underline">
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}