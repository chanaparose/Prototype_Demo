import React, { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, Factory, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRegisterFactory } from '@/pages/auth/useRegisterFactory';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SectionHeading, FieldBlock } from '@/components/common/FormField';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { getInputClass } from '@/utils/formHelpers';
import { Label } from '@/components/ui/label';

export function RegisterFactoryPage() {
  const {
    form,
    errors,
    factoryTypes,
    provinces,
    lbiCategories,
    lbiSubCategories,
    certTypes,
    masterLoading,
    masterFailed,
    retryMaster,
    submitting,
    apiError,
    setField,
    submit,
    blurField,
    setFieldRef,
  } = useRegisterFactory();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const inClass = getInputClass;

  const bizSection = 1;
  const accountSection = 2;
  const categorySection = 3;
  const certSection = 4;

  return (
    <div className='min-h-screen bg-gradient-to-b from-brand-panel-hover to-white py-6 md:py-12 px-4 flex items-center justify-center'>
      <div className='w-full max-w-[1024px] bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden md:flex border border-brand-purple/10'>
        {/* Left panel */}
        <div className='hidden md:flex md:w-[42%] flex-col justify-between bg-brand-navy-deep text-white p-12 relative overflow-hidden'>
          <div
            className='absolute inset-0 opacity-40 mix-blend-overlay'
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1584867818838-5312e821fe15?w=900)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className='absolute inset-0 bg-gradient-to-t from-brand-hero-ink via-brand-navy-deep/80 to-transparent' />
          <div className='relative z-10 flex flex-col h-full justify-center'>
            <div className='flex items-center gap-3 mb-8'>
              <div className='bg-white/10 p-3 rounded-2xl backdrop-blur-sm'>
                <Factory className='text-white' size={32} strokeWidth={2} />
              </div>
              <span className='text-2xl font-bold tracking-tight'>Tryly</span>
            </div>
            <h1 className='text-4xl font-bold mb-4 leading-tight'>
              ขยายโอกาสธุรกิจ <br /> รับออเดอร์ทั่วประเทศ
            </h1>
            <p className='text-white/80 text-lg leading-relaxed max-w-sm'>
              สมัครฟรีภายในไม่กี่นาที เพื่อเข้าถึงใบเสนอราคา (RFQ)
              จากลูกค้าที่กำลังมองหาผู้ผลิตคุณภาพเช่นคุณ
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          className='flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto max-h-screen md:max-h-[calc(100vh-6rem)]'
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          noValidate
        >
          <div className='mb-6 md:mb-8'>
            <h2 className='text-2xl md:text-3xl font-bold text-brand-navy-deep mb-2'>
              สมัครบัญชีโรงงาน
            </h2>
            <p className='text-sm md:text-base text-gray-500'>
              กรอกข้อมูลให้ครบเพื่อส่งให้ Admin ตรวจสอบและอนุมัติ
            </p>
          </div>

          {apiError && (
            <ErrorAlert className='mb-6'>
              {apiError}
            </ErrorAlert>
          )}

          {masterFailed && (
            <div className='bg-amber-50 text-amber-700 text-sm p-4 rounded-xl border border-amber-100 mb-6 flex items-center gap-3'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              <span className='flex-1'>โหลดข้อมูลไม่สำเร็จ</span>
              <Button variant='unstyled' type='button' onClick={retryMaster} className='underline text-amber-700 font-medium'>
                ลองใหม่
              </Button>
            </div>
          )}

          <div className='space-y-8'>
            {/* ── Section 1: ข้อมูลธุรกิจ ── */}
            <div>
              <SectionHeading num={bizSection} label='ข้อมูลธุรกิจ' />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5'>
                <FieldBlock
                  label='ชื่อโรงงาน / บริษัท'
                  error={errors.factory_name}
                  fieldKey='factory_name'
                  setFieldRef={setFieldRef}
                  className='md:col-span-2'
                  required
                >
                  <Input
                    type='text'
                    autoComplete='organization'
                    maxLength={150}
                    value={form.factory_name}
                    onChange={(e) => setField('factory_name', e.target.value)}
                    onBlur={() => blurField('factory_name')}
                    className={inClass(errors.factory_name)}
                    placeholder='เช่น บริษัท เอบีซี แมนูแฟคเจอริ่ง จำกัด'
                  />
                </FieldBlock>

                <FieldBlock
                  label='ประเภทโรงงาน'
                  error={errors.factory_type_id}
                  fieldKey='factory_type_id'
                  setFieldRef={setFieldRef}
                  required
                >
                  <Select
                    value={form.factory_type_id ? String(form.factory_type_id) : ''}
                    onValueChange={(v) => {
                      setField('factory_type_id', v === '__empty' ? 0 : Number(v));
                      blurField('factory_type_id');
                    }}
                    disabled={masterLoading}
                  >
                    <SelectTrigger className={inClass(errors.factory_type_id)}>
                      <SelectValue placeholder={masterLoading ? 'กำลังโหลด...' : '— เลือกประเภท —'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__empty'>— เลือกประเภท —</SelectItem>
                    {factoryTypes.map((t) => (
                        <SelectItem key={t.factory_type_id} value={String(t.factory_type_id)}>
                        {t.name_th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>

                <FieldBlock
                  label='เลขประจำตัวผู้เสียภาษี'
                  error={errors.tax_id}
                  fieldKey='tax_id'
                  setFieldRef={setFieldRef}
                  required
                >
                  <Input
                    type='text'
                    inputMode='numeric'
                    autoComplete='off'
                    maxLength={13}
                    value={form.tax_id}
                    onChange={(e) => setField('tax_id', e.target.value.replace(/\D/g, '').slice(0, 13))}
                    onBlur={() => blurField('tax_id')}
                    className={inClass(errors.tax_id)}
                    placeholder='เลข 13 หลัก'
                  />
                </FieldBlock>

                <FieldBlock
                  label='จังหวัดที่ตั้งโรงงาน'
                  error={errors.province_id}
                  fieldKey='province_id'
                  setFieldRef={setFieldRef}
                  className='md:col-span-2'
                  required
                >
                  <Select
                    value={form.province_id ? String(form.province_id) : ''}
                    onValueChange={(v) => {
                      setField('province_id', v === '__empty' ? 0 : Number(v));
                      blurField('province_id');
                    }}
                    disabled={masterLoading}
                  >
                    <SelectTrigger className={inClass(errors.province_id)}>
                      <SelectValue placeholder={masterLoading ? 'กำลังโหลด...' : '— เลือกจังหวัด —'} />
                    </SelectTrigger>
                    <SelectContent className='max-h-64'>
                      <SelectItem value='__empty'>— เลือกจังหวัด —</SelectItem>
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
              </div>
            </div>

            <div className='h-px bg-gray-100' />

            {/* ── Section 2: บัญชีผู้ดูแลระบบ ── */}
                <div>
              <SectionHeading num={accountSection} label='บัญชีผู้ดูแลระบบ' />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5'>
                <FieldBlock label='อีเมล' error={errors.email} fieldKey='email' setFieldRef={setFieldRef} required>
                  <Input
                    type='email'
                    autoComplete='email'
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        onBlur={() => blurField('email')}
                        className={inClass(errors.email)}
                    placeholder='owner@factory.com'
                      />
                    </FieldBlock>

                <FieldBlock label='เบอร์โทรศัพท์' error={errors.phone} fieldKey='phone' setFieldRef={setFieldRef} required>
                  <Input
                    type='tel'
                    autoComplete='tel'
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        onBlur={() => blurField('phone')}
                        className={inClass(errors.phone)}
                    placeholder='081-234-5678'
                      />
                    </FieldBlock>

                <FieldBlock label='รหัสผ่าน' error={errors.password} fieldKey='password' setFieldRef={setFieldRef} required>
                  <div className='relative'>
                    <Input
                          type={showPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                          value={form.password}
                          onChange={(e) => setField('password', e.target.value)}
                          onBlur={() => blurField('password')}
                          className={`${inClass(errors.password)} pr-10`}
                      placeholder='8 ตัวอักษรขึ้นไป'
                        />
                    <Button
                      variant='unstyled'
                      type='button'
                          tabIndex={-1}
                          onClick={() => setShowPassword((v) => !v)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-purple'
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                      </div>
                    </FieldBlock>

                <FieldBlock label='ยืนยันรหัสผ่าน' error={errors.confirmPassword} fieldKey='confirmPassword' setFieldRef={setFieldRef} required>
                  <div className='relative'>
                    <Input
                          type={showConfirm ? 'text' : 'password'}
                      autoComplete='new-password'
                          value={form.confirmPassword}
                          onChange={(e) => setField('confirmPassword', e.target.value)}
                          onBlur={() => blurField('confirmPassword')}
                          className={`${inClass(errors.confirmPassword)} pr-10`}
                      placeholder='กรอกอีกครั้ง'
                        />
                    <Button
                      variant='unstyled'
                      type='button'
                          tabIndex={-1}
                          onClick={() => setShowConfirm((v) => !v)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-purple'
                        >
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                      </div>
                    </FieldBlock>
              </div>
            </div>

            <div className='h-px bg-gray-100' />

            {/* ── Section 3: หมวดหมู่ที่รับผลิต ── */}
            <div ref={setFieldRef('category_ids')}>
              <SectionHeading num={categorySection} label='หมวดหมู่สินค้าที่รับผลิต' />
              <p className='text-xs text-gray-400 mb-3'>เลือกอย่างน้อย 1 หมวด — ระบบจะใช้จับคู่กับ RFQ ของลูกค้า</p>

              {masterLoading ? (
                <div className='flex items-center gap-2 text-sm text-gray-400 py-4'>
                  <Loader2 size={14} className='animate-spin' />
                  กำลังโหลดหมวดหมู่...
                </div>
              ) : lbiCategories.length === 0 ? (
                <p className='text-sm text-gray-400'>ไม่พบข้อมูลหมวดหมู่</p>
              ) : (
                <div className='space-y-4'>
                  {/* Category grid — stable layout, never shifts */}
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                    {lbiCategories.map((cat) => {
                      const selected = form.category_ids.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-all select-none ${
                            selected
                              ? 'border-brand-purple bg-brand-purple/5 text-brand-purple font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type='checkbox'
                            className='sr-only'
                            checked={selected}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.category_ids, cat.id]
                                : form.category_ids.filter((id) => id !== cat.id);
                              setField('category_ids', next);
                              if (!e.target.checked) {
                                const subIds = (lbiSubCategories[cat.id] ?? []).map((s) => s.id);
                                if (subIds.length > 0) {
                                  setField(
                                    'sub_category_ids',
                                    form.sub_category_ids.filter((id) => !subIds.includes(id)),
                                  );
                                }
                              }
                            }}
                          />
                          <CheckCircle2
                            size={14}
                            className={selected ? 'text-brand-purple' : 'text-gray-200'}
                          />
                          {cat.name}
                        </label>
                      );
                    })}
                  </div>

                  {/* Sub-category panel — appears once below grid, never shifts grid above */}
                  {form.category_ids.some((id) => {
                    const cat = lbiCategories.find((c) => c.id === id);
                    return cat?.scope !== 'MT' && (lbiSubCategories[id] ?? []).length > 0;
                  }) && (
                    <div className='rounded-xl border border-brand-purple/15 bg-brand-lavender/40 p-4 space-y-4'>
                      <p className='text-xs font-semibold text-brand-purple/70 uppercase tracking-wide'>
                        หมวดย่อย (เลือกเพิ่มเติม)
                      </p>
                      {lbiCategories
                        .filter(
                          (cat) =>
                            cat.scope !== 'MT' &&
                            form.category_ids.includes(cat.id) &&
                            (lbiSubCategories[cat.id] ?? []).length > 0,
                        )
                        .map((cat) => (
                          <div key={`sub-${cat.id}`}>
                            <p className='text-xs font-medium text-gray-500 mb-2'>{cat.name}</p>
                            <div className='flex flex-wrap gap-1.5'>
                              {(lbiSubCategories[cat.id] ?? []).map((sub) => {
                                const subSelected = form.sub_category_ids.includes(sub.id);
                                return (
                                  <label
                                    key={sub.id}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-all select-none ${
                                      subSelected
                                        ? 'border-brand-purple bg-brand-purple text-white font-medium'
                                        : 'border-gray-200 text-gray-600 bg-white hover:border-brand-purple/40 hover:text-brand-purple'
                                    }`}
                                  >
                                    <input
                                      type='checkbox'
                                      className='sr-only'
                                      checked={subSelected}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? [...form.sub_category_ids, sub.id]
                                          : form.sub_category_ids.filter((id) => id !== sub.id);
                                        setField('sub_category_ids', next);
                                      }}
                                    />
                                    {sub.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              {errors.category_ids && (
                <p className='text-xs text-red-600 mt-2'>{errors.category_ids}</p>
              )}
            </div>

            <div className='h-px bg-gray-100' />

            {/* ── Section 4: เอกสารยืนยันตัวตน ── */}
            <div>
              <SectionHeading num={certSection} label='เอกสารยืนยันตัวตนโรงงาน' />
              <p className='text-xs text-gray-400 mb-4'>
                อัปโหลดใบรับรองอย่างน้อย 1 ใบ (GMP, ISO, อย. ฯลฯ) — Admin ใช้ตรวจสอบก่อนอนุมัติ
              </p>

              <div className='bg-gray-50/60 rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FieldBlock
                    label='ประเภทใบรับรอง'
                    error={errors.cert_id}
                    fieldKey='cert_id'
                    setFieldRef={setFieldRef}
                    required
                  >
                    <Select
                      value={form.cert_id ? String(form.cert_id) : ''}
                      onValueChange={(v) => {
                        setField('cert_id', v === '__empty' ? 0 : Number(v));
                        blurField('cert_id');
                      }}
                      disabled={masterLoading}
                    >
                      <SelectTrigger className={inClass(errors.cert_id)}>
                        <SelectValue placeholder={masterLoading ? 'กำลังโหลด...' : '— เลือกประเภท —'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__empty'>— เลือกประเภท —</SelectItem>
                        {certTypes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldBlock>

                  <FieldBlock
                    label='วันหมดอายุเอกสาร'
                    error={errors.cert_expire_date}
                    fieldKey='cert_expire_date'
                    setFieldRef={setFieldRef}
                    required
                  >
                    <Input
                      type='date'
                      value={form.cert_expire_date}
                      onChange={(e) => setField('cert_expire_date', e.target.value)}
                      onBlur={() => blurField('cert_expire_date')}
                      className={inClass(errors.cert_expire_date)}
                    />
                  </FieldBlock>
                </div>

                <FieldBlock
                  label='เลขที่เอกสาร (ถ้ามี)'
                  fieldKey='cert_number'
                  setFieldRef={setFieldRef}
                >
                  <Input
                    type='text'
                    value={form.cert_number}
                    onChange={(e) => setField('cert_number', e.target.value)}
                    className={inClass()}
                    placeholder='เช่น GMP-123456'
                  />
                </FieldBlock>

                <FieldBlock
                  label='ไฟล์เอกสาร (รูปภาพหรือ PDF)'
                  error={errors.cert_file}
                  fieldKey='cert_file'
                  setFieldRef={setFieldRef}
                  required
                >
                  <input
                    type='file'
                    accept='image/*,.pdf'
                    className='w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-purple/10 file:text-brand-purple hover:file:bg-brand-purple/20 cursor-pointer'
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setField('cert_file', f);
                      if (f) blurField('cert_file');
                    }}
                  />
                  {form.cert_file && (
                    <p className='text-xs text-emerald-600 mt-1 flex items-center gap-1'>
                      <CheckCircle2 size={12} />
                      {form.cert_file.name}
                    </p>
                  )}
                </FieldBlock>
              </div>
            </div>
          </div>

          {/* ── Terms + Submit ── */}
          <div className='mt-8 space-y-6'>
            <div ref={setFieldRef('acceptTerms')} className='bg-gray-50/50 p-4 rounded-xl border border-gray-100'>
              <Label className='flex items-start gap-3 cursor-pointer text-sm text-gray-600'>
                <Checkbox
                  checked={form.acceptTerms}
                  onCheckedChange={(checked) => setField('acceptTerms', checked === true)}
                  onBlur={() => blurField('acceptTerms')}
                  className='mt-1'
                />
                <span className='leading-relaxed'>
                  ข้าพเจ้ายอมรับ{' '}
                  <a href='#' className='font-semibold text-brand-purple hover:underline'>
                    ข้อตกลงและเงื่อนไขการใช้บริการ
                  </a>{' '}
                  และนโยบายความเป็นส่วนตัวของแพลตฟอร์ม
                </span>
              </Label>
              {errors.acceptTerms && (
                <p className='text-sm text-red-600 pl-7 mt-1.5'>{errors.acceptTerms}</p>
              )}
            </div>

            <Button
              variant='unstyled'
              type='submit'
              disabled={submitting || masterLoading}
              className='w-full flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-hover disabled:opacity-60 disabled:pointer-events-none text-white py-3.5 md:py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-brand-purple/20 active:scale-[0.98]'
            >
              {submitting ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin shrink-0' />
                  กำลังดำเนินการ...
                </>
              ) : (
                'สมัครและส่งข้อมูลเพื่อรับการอนุมัติ'
              )}
            </Button>

            <p className='text-sm text-center text-gray-500 font-medium'>
              มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
              <Link to='/login' className='text-brand-purple hover:text-brand-purple-hover transition-colors hover:underline'>
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
