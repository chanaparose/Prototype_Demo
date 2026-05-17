import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, UserPlus, LogIn, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useLoginSubmission } from '@/components/features/auth/hooks/useLoginSubmission';
import {
  authLoginSchema,
  authRegisterSchema,
  type AuthLoginFormValues,
  type AuthRegisterFormValues,
} from '@/domain/auth/schemas/authForm.schema';
import { ErrorAlert } from '@/components/common/ErrorAlert';
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

type Mode = 'login' | 'register';
type ServerStatus = 'unknown' | 'checking' | 'online' | 'offline';

const HEALTH_URL = '/health';

const inputClassName =
  'w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all';

export function Login() {
  const { submitLogin, submitRegister, isSubmitting, error, clearError } = useLoginSubmission();

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const loading = isSubmitting;
  const rootError = error;
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');

  const loginForm = useForm<AuthLoginFormValues>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: { email: 'test@example.com', password: '1234' },
    mode: 'onSubmit',
  });

  const registerForm = useForm<AuthRegisterFormValues>({
    resolver: zodResolver(authRegisterSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  const checkServer = async () => {
    setServerStatus('checking');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000);
      const res = await fetch(HEALTH_URL, { signal: controller.signal });
      clearTimeout(timer);
      setServerStatus(res.ok ? 'online' : 'offline');
    } catch (err) {
      console.error('[Health Check]', err);
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    void checkServer();
  }, []);

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const loadingHint =
    elapsed < 10
      ? 'กำลังเชื่อมต่อเซิร์ฟเวอร์...'
      : elapsed < 30
        ? 'เซิร์ฟเวอร์กำลัง cold start... กรุณารอสักครู่'
        : 'ยังรออยู่... Render free tier อาจใช้เวลานานถึง 60 วินาที';

  return (
    <div className='relative min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4'>
      <Link
        to='/'
        className='absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-brand-royal hover:bg-white/80 transition-colors'
      >
        <ArrowLeft className='w-4 h-4 shrink-0' aria-hidden />
        ย้อนกลับ
      </Link>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col items-center mb-8'>
          <Image
            src='/assets/tryly-logo.png'
            alt='Tryly'
            className='h-20 w-auto object-contain -ml-[5px]'
          />
          <p className='text-gray-500 text-sm'>Manufacturing Platform</p>
        </div>

        <div className='flex justify-center mb-4'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void checkServer()}
            disabled={serverStatus === 'checking'}
            className='flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all'
            style={{
              background:
                serverStatus === 'online'
                  ? '#ECFDF5'
                  : serverStatus === 'offline'
                    ? '#FEF2F2'
                    : serverStatus === 'checking'
                      ? '#F5F3FF'
                      : 'var(--neutral-surface)',
              color:
                serverStatus === 'online'
                  ? 'var(--status-success)'
                  : serverStatus === 'offline'
                    ? 'var(--status-danger-deep)'
                    : serverStatus === 'checking'
                      ? 'var(--brand-royal)'
                      : 'var(--neutral-subtle)',
              fontWeight: 600,
            }}
          >
            {serverStatus === 'online' && (
              <>
                <Wifi size={14} /> เซิร์ฟเวอร์พร้อมใช้งาน
              </>
            )}
            {serverStatus === 'offline' && (
              <>
                <WifiOff size={14} /> เซิร์ฟเวอร์ไม่ตอบสนอง — กดเพื่อลองใหม่
              </>
            )}
            {serverStatus === 'checking' && (
              <>
                <RefreshCw size={14} className='animate-spin' />
                กำลังตรวจสอบเซิร์ฟเวอร์... (อาจใช้เวลา 30-60 วินาที)
              </>
            )}
            {serverStatus === 'unknown' && (
              <>
                <Wifi size={14} /> ตรวจสอบเซิร์ฟเวอร์...
              </>
            )}
          </Button>
        </div>

        <div className='bg-white rounded-3xl shadow-sm p-6 space-y-5'>
          <div className='flex bg-gray-100 rounded-xl p-1'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => {
                setMode('login');
                clearError();
                loginForm.reset({ email: 'test@example.com', password: '1234' });
              }}
              className='flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm transition-all'
              style={{
                background: mode === 'login' ? 'var(--neutral-white)' : 'transparent',
                color: mode === 'login' ? 'var(--brand-royal)' : 'var(--neutral-subtle)',
                fontWeight: mode === 'login' ? 600 : 500,
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <LogIn size={16} />
              เข้าสู่ระบบ
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => {
                setMode('register');
                clearError();
                registerForm.reset({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '',
                  password: '',
                });
              }}
              className='flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm transition-all'
              style={{
                background: mode === 'register' ? 'var(--neutral-white)' : 'transparent',
                color: mode === 'register' ? 'var(--brand-royal)' : 'var(--neutral-subtle)',
                fontWeight: mode === 'register' ? 600 : 500,
                boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <UserPlus size={16} />
              สมัครสมาชิก
            </Button>
          </div>

          {rootError ? <ErrorAlert size='sm'>{rootError}</ErrorAlert> : null}

          {mode === 'login' ? (
            <Form {...loginForm}>
              <form
                onSubmit={(e) => void loginForm.handleSubmit(submitLogin)(e)}
                className='space-y-4'
              >
                <FormField
                  control={loginForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-gray-500'>อีเมล</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='email@example.com'
                          className={inputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-gray-500'>รหัสผ่าน</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='รหัสผ่าน'
                            className={`${inputClassName} pr-12`}
                            {...field}
                          />
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={() => setShowPassword((v) => !v)}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SubmitButton
                  loading={loading}
                  elapsed={elapsed}
                  serverChecking={serverStatus === 'checking'}
                  idleLabel='เข้าสู่ระบบ'
                  loadingLabel='กำลังเข้าสู่ระบบ'
                  loadingHint={loadingHint}
                />
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form
                onSubmit={(e) => void registerForm.handleSubmit(submitRegister)(e)}
                className='space-y-4'
              >
                <div className='grid grid-cols-2 gap-3'>
                  <FormField
                    control={registerForm.control}
                    name='first_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs text-gray-500'>ชื่อ</FormLabel>
                        <FormControl>
                          <Input type='text' placeholder='ชื่อ' className={inputClassName} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name='last_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs text-gray-500'>นามสกุล</FormLabel>
                        <FormControl>
                          <Input
                            type='text'
                            placeholder='นามสกุล'
                            className={inputClassName}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={registerForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-gray-500'>อีเมล</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='email@example.com'
                          className={inputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-gray-500'>เบอร์โทรศัพท์</FormLabel>
                      <FormControl>
                        <Input
                          type='tel'
                          placeholder='08x-xxx-xxxx'
                          className={inputClassName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs text-gray-500'>รหัสผ่าน</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='อย่างน้อย 8 ตัวอักษร'
                            className={`${inputClassName} pr-12`}
                            {...field}
                          />
                          <Button
                            variant='unstyled'
                            type='button'
                            onClick={() => setShowPassword((v) => !v)}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SubmitButton
                  loading={loading}
                  elapsed={elapsed}
                  serverChecking={serverStatus === 'checking'}
                  idleLabel='สมัครสมาชิก'
                  loadingLabel='กำลังสมัคร'
                  loadingHint={loadingHint}
                />
              </form>
            </Form>
          )}
        </div>

        <div className='mt-5 bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3 border border-purple-100'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl bg-brand-lavender flex items-center justify-center shrink-0'>
              <UserPlus size={18} className='text-brand-royal' />
            </div>
            <div>
              <p className='text-sm font-semibold text-gray-800'>เป็นเจ้าของโรงงาน?</p>
              <p className='text-xs text-gray-400'>รับ RFQ จากลูกค้าทั่วประเทศ</p>
            </div>
          </div>
          <Link
            to='/register/factory'
            className='shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95'
            style={{ background: 'linear-gradient(135deg, var(--brand-royal), #8B5CF6)' }}
          >
            สมัครบัญชีโรงงาน
          </Link>
        </div>

        <p className='text-center text-xs text-gray-400 mt-5'>Tryly Manufacturing Platform v1.0</p>
      </div>
    </div>
  );
}

function SubmitButton({
  loading,
  elapsed,
  serverChecking,
  idleLabel,
  loadingLabel,
  loadingHint,
}: {
  loading: boolean;
  elapsed: number;
  serverChecking: boolean;
  idleLabel: string;
  loadingLabel: string;
  loadingHint: string;
}) {
  return (
    <>
      <Button
        variant='unstyled'
        type='submit'
        disabled={loading || serverChecking}
        className='w-full py-3.5 rounded-xl text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2'
        style={{
          background: 'linear-gradient(135deg, var(--brand-royal), #8B5CF6)',
          fontWeight: 700,
        }}
      >
        {loading && (
          <div className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
        )}
        {loading ? `${loadingLabel}... (${elapsed}s)` : idleLabel}
      </Button>
      {loading ? (
        <p className='text-[11px] text-gray-400 text-center animate-pulse'>{loadingHint}</p>
      ) : null}
    </>
  );
}
