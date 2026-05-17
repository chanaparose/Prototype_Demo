import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Eye, EyeOff, UserPlus, LogIn, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '@/stores/useAuthStore';
import { frontendApi } from '@/services/api/exploreApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';

type Mode = 'login' | 'register';
type ServerStatus = 'unknown' | 'checking' | 'online' | 'offline';

// Use Vite proxy in dev and same-origin in production.
const HEALTH_URL = '/health';

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('1234');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');

  const checkServer = async () => {
    setServerStatus('checking');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000); // 90s for cold start
      const res = await fetch(HEALTH_URL, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (err) {
      console.error('[Health Check]', err);
      setServerStatus('offline');
    }
  };

  // Auto-check on mount
  useEffect(() => {
    checkServer();
  }, []);

  // Elapsed timer while loading
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      try {
        const me = (await frontendApi.getMe()) as Record<string, unknown>;
        const role = String(me.role ?? '').toUpperCase();
        navigate(role === 'FT' ? '/factory' : '/', { replace: true });
      } catch {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('[Login Error]', err);
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        role: 'CT',
        email,
        phone,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      try {
        const me = (await frontendApi.getMe()) as Record<string, unknown>;
        const role = String(me.role ?? '').toUpperCase();
        navigate(role === 'FT' ? '/factory' : '/', { replace: true });
      } catch {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('[Register Error]', err);
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

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
            onClick={checkServer}
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
                setError('');
                setEmail('test@example.com');
                setPassword('1234');
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
                setError('');
                setEmail('');
                setPassword('');
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

          {error && (
            <div className='bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl'>{error}</div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className='space-y-4'>
              <div>
                <Label className='text-xs text-gray-500 mb-1 block'>อีเมล</Label>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='email@example.com'
                  required
                  className='w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all'
                />
              </div>
              <div>
                <Label className='text-xs text-gray-500 mb-1 block'>รหัสผ่าน</Label>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='รหัสผ่าน'
                    required
                    className='w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all pr-12'
                  />
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
              <Button
                variant='unstyled'
                type='submit'
                disabled={loading || serverStatus === 'checking'}
                className='w-full py-3.5 rounded-xl text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2'
                style={{
                  background: 'linear-gradient(135deg, var(--brand-royal), #8B5CF6)',
                  fontWeight: 700,
                }}
              >
                {loading && (
                  <div className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
                )}
                {loading ? `กำลังเข้าสู่ระบบ... (${elapsed}s)` : 'เข้าสู่ระบบ'}
              </Button>
              {loading && (
                <p className='text-[11px] text-gray-400 text-center animate-pulse'>
                  {elapsed < 10
                    ? 'กำลังเชื่อมต่อเซิร์ฟเวอร์...'
                    : elapsed < 30
                      ? 'เซิร์ฟเวอร์กำลัง cold start... กรุณารอสักครู่'
                      : 'ยังรออยู่... Render free tier อาจใช้เวลานานถึง 60 วินาที'}
                </p>
              )}
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label className='text-xs text-gray-500 mb-1 block'>ชื่อ</Label>
                  <Input
                    type='text'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder='ชื่อ'
                    required
                    className='w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all'
                  />
                </div>
                <div>
                  <Label className='text-xs text-gray-500 mb-1 block'>นามสกุล</Label>
                  <Input
                    type='text'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder='นามสกุล'
                    required
                    className='w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all'
                  />
                </div>
              </div>
              <div>
                <Label className='text-xs text-gray-500 mb-1 block'>อีเมล</Label>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='email@example.com'
                  required
                  className='w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all'
                />
              </div>
              <div>
                <Label className='text-xs text-gray-500 mb-1 block'>เบอร์โทรศัพท์</Label>
                <Input
                  type='tel'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='08x-xxx-xxxx'
                  required
                  className='w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all'
                />
              </div>
              <div>
                <Label className='text-xs text-gray-500 mb-1 block'>รหัสผ่าน</Label>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='อย่างน้อย 8 ตัวอักษร'
                    required
                    minLength={8}
                    className='w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all pr-12'
                  />
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
              <Button
                variant='unstyled'
                type='submit'
                disabled={loading || serverStatus === 'checking'}
                className='w-full py-3.5 rounded-xl text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2'
                style={{
                  background: 'linear-gradient(135deg, var(--brand-royal), #8B5CF6)',
                  fontWeight: 700,
                }}
              >
                {loading && (
                  <div className='w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin' />
                )}
                {loading ? `กำลังสมัคร... (${elapsed}s)` : 'สมัครสมาชิก'}
              </Button>
              {loading && (
                <p className='text-[11px] text-gray-400 text-center animate-pulse'>
                  {elapsed < 10
                    ? 'กำลังเชื่อมต่อเซิร์ฟเวอร์...'
                    : elapsed < 30
                      ? 'เซิร์ฟเวอร์กำลัง cold start... กรุณารอสักครู่'
                      : 'ยังรออยู่... Render free tier อาจใช้เวลานานถึง 60 วินาที'}
                </p>
              )}
            </form>
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
