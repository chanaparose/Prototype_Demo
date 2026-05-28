import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAuth } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import {
  authLoginSchema,
  type AuthLoginFormValues,
} from '@/domain/auth/schemas/authForm.schema';
import { getErrorMessage } from '@/lib/apiError';
import { getAvailableRoles } from '@/services/api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RolePickerModal, type RoleChoice } from '@/components/auth/RolePickerModal';

const HEALTH_URL = '/health';
type ServerStatus = 'unknown' | 'checking' | 'online' | 'offline';

export function LoginModal() {
  const { isOpen, close, pendingRedirect } = useAuthModalStore();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);

  const form = useForm<AuthLoginFormValues>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  /* ── Server health check ── */
  const checkServer = async () => {
    setServerStatus('checking');
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 90_000);
      const res = await fetch(HEALTH_URL, { signal: ctrl.signal });
      clearTimeout(t);
      setServerStatus(res.ok ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    if (isOpen) void checkServer();
  }, [isOpen]);

  /* ── Submit timer ── */
  useEffect(() => {
    if (isSubmitting) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitting]);

  const handleClose = () => {
    if (isSubmitting) return;
    close();
    form.reset();
    setError('');
  };

  const { switchRole } = useAuth();

  const navigateByRole = (role: string) => {
    if (pendingRedirect && pendingRedirect.startsWith('/') && !pendingRedirect.startsWith('//')) {
      navigate(pendingRedirect, { replace: true });
    } else {
      navigate(role === 'FT' ? '/factory' : '/', { replace: true });
    }
  };

  const submitLogin = async (values: AuthLoginFormValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const session = await login(values);
      let roles: string[] = [];
      try {
        const res = await getAvailableRoles();
        roles = res.roles ?? [];
      } catch {
        // API not available — fall back to session role
      }
      const hasBoth = roles.includes('FT') && roles.includes('CT');
      if (hasBoth) {
        close();
        setShowRolePicker(true);
      } else {
        const role = roles[0] || String(session?.user?.role ?? 'CT').toUpperCase();
        close();
        navigateByRole(role);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'เข้าสู่ระบบไม่สำเร็จ'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRolePick = async (role: RoleChoice) => {
    setRoleSwitching(true);
    try {
      await switchRole(role);
      setShowRolePicker(false);
      navigateByRole(role);
    } catch {
      setShowRolePicker(false);
      navigateByRole(role);
    } finally {
      setRoleSwitching(false);
    }
  };

  const loadingHint =
    elapsed < 10
      ? 'กำลังเชื่อมต่อเซิร์ฟเวอร์...'
      : elapsed < 30
        ? 'เซิร์ฟเวอร์กำลัง cold start... กรุณารอสักครู่'
        : 'ยังรออยู่... Render free tier อาจใช้เวลานานถึง 60 วินาที';

  return (
    <>
    <DialogPrimitive.Root open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />

        {/* Dialog content */}
        <DialogPrimitive.Content
          className='fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
          aria-describedby={undefined}
        >
          {/* Close button */}
          <DialogPrimitive.Close
            onClick={handleClose}
            className='absolute right-4 top-4 z-10 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none'
          >
            <X size={16} />
            <span className='sr-only'>ปิด</span>
          </DialogPrimitive.Close>

          {/* Header gradient */}
          <div
            className='rounded-t-3xl px-6 pt-7 pb-5 text-center'
            style={{ background: 'linear-gradient(135deg, #f3f0ff 0%, #ede9fe 50%, #faf5ff 100%)' }}
          >
            <Image
              src='/assets/tryly-logo.png'
              alt='Tryly'
              className='mx-auto mb-2 h-14 w-auto object-contain'
            />
            <DialogPrimitive.Title className='text-lg font-bold text-gray-900'>
              ยินดีต้อนรับกลับมา
            </DialogPrimitive.Title>
            <p className='mt-0.5 text-xs text-gray-500'>เข้าสู่ระบบเพื่อใช้งาน Tryly Platform</p>
          </div>

          {/* Body */}
          <div className='px-6 pb-6 pt-5 space-y-4'>
            {/* Server status */}
            <div className='flex justify-center'>
              <button
                type='button'
                onClick={() => void checkServer()}
                disabled={serverStatus === 'checking'}
                className='flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all'
                style={{
                  background:
                    serverStatus === 'online'
                      ? '#ECFDF5'
                      : serverStatus === 'offline'
                        ? '#FEF2F2'
                        : serverStatus === 'checking'
                          ? '#F5F3FF'
                          : '#F9FAFB',
                  color:
                    serverStatus === 'online'
                      ? '#15803D'
                      : serverStatus === 'offline'
                        ? '#B91C1C'
                        : serverStatus === 'checking'
                          ? 'var(--brand-royal)'
                          : '#9CA3AF',
                }}
              >
                {serverStatus === 'online' && <><Wifi size={11} /> เซิร์ฟเวอร์พร้อมใช้งาน</>}
                {serverStatus === 'offline' && <><WifiOff size={11} /> ไม่ตอบสนอง — กดลองใหม่</>}
                {serverStatus === 'checking' && <><RefreshCw size={11} className='animate-spin' /> ตรวจสอบอยู่...</>}
                {serverStatus === 'unknown' && <><Wifi size={11} /> ตรวจสอบเซิร์ฟเวอร์</>}
              </button>
            </div>

            {/* Google sign-in (UI only) */}
            <button
              type='button'
              disabled
              className='relative w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm opacity-60 cursor-not-allowed'
            >
              {/* Google colour logo SVG */}
              <svg width='18' height='18' viewBox='0 0 18 18' fill='none' aria-hidden>
                <path
                  d='M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z'
                  fill='#4285F4'
                />
                <path
                  d='M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z'
                  fill='#34A853'
                />
                <path
                  d='M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z'
                  fill='#FBBC05'
                />
                <path
                  d='M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z'
                  fill='#EA4335'
                />
              </svg>
              เข้าสู่ระบบด้วย Google
              <span className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-400'>
                เร็วๆ นี้
              </span>
            </button>

            {/* Divider */}
            <div className='flex items-center gap-3'>
              <div className='flex-1 h-px bg-gray-100' />
              <span className='text-xs text-gray-400 font-medium'>หรือเข้าสู่ระบบด้วยอีเมล</span>
              <div className='flex-1 h-px bg-gray-100' />
            </div>

            {/* Error */}
            {error ? (
              <div className='rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-700 font-medium'>
                {error}
              </div>
            ) : null}

            {/* Login form */}
            <Form {...form}>
              <form
                onSubmit={(e) => void form.handleSubmit(submitLogin)(e)}
                className='space-y-3'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-medium text-gray-600'>อีเมล</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='email@example.com'
                          autoComplete='username email'
                          className='w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs font-medium text-gray-600'>รหัสผ่าน</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='รหัสผ่าน'
                            autoComplete='current-password'
                            className='w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all'
                            {...field}
                          />
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={() => setShowPassword((v) => !v)}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <Button
                  variant='unstyled'
                  type='submit'
                  disabled={isSubmitting || serverStatus === 'checking'}
                  className='mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all active:scale-[0.98]'
                  style={{ background: 'linear-gradient(135deg, var(--brand-royal), #8B5CF6)' }}
                >
                  {isSubmitting && (
                    <span className='h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin' />
                  )}
                  {isSubmitting ? `กำลังเข้าสู่ระบบ... (${elapsed}s)` : 'เข้าสู่ระบบ'}
                </Button>

                {isSubmitting && (
                  <p className='text-center text-[11px] text-gray-400 animate-pulse'>{loadingHint}</p>
                )}
              </form>
            </Form>

            {/* Register link */}
            <p className='text-center text-xs text-gray-500'>
              ยังไม่มีบัญชี?{' '}
              <Link
                to='/register'
                onClick={handleClose}
                className='font-semibold text-violet-600 hover:text-violet-700 hover:underline transition-colors'
              >
                สมัครสมาชิกฟรี
              </Link>
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>

    <RolePickerModal open={showRolePicker} loading={roleSwitching} onPick={handleRolePick} />
    </>
  );
}
