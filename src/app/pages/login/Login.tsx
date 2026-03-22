import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Factory, Eye, EyeOff, UserPlus, LogIn, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'login' | 'register';
type ServerStatus = 'unknown' | 'checking' | 'online' | 'offline';

const HEALTH_URL = 'https://wemake-server.onrender.com/health';

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

  // ── Server status check ─────────────────────────────────────
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/', { replace: true });
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
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[Register Error]', err);
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-12 px-4 rounded-2xl flex items-center gap-2 mb-3"
            style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)' }}
          >
            <Factory className="text-white" size={20} strokeWidth={2.5} />
            <span className="text-white text-lg font-bold">WeMake</span>
          </div>
          <p className="text-gray-500 text-sm">Manufacturing Platform</p>
        </div>

        {/* Server Status Badge */}
        <div className="flex justify-center mb-4">
          <button
            type="button"
            onClick={checkServer}
            disabled={serverStatus === 'checking'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all"
            style={{
              background:
                serverStatus === 'online' ? '#ECFDF5'
                : serverStatus === 'offline' ? '#FEF2F2'
                : serverStatus === 'checking' ? '#F5F3FF'
                : '#F9FAFB',
              color:
                serverStatus === 'online' ? '#059669'
                : serverStatus === 'offline' ? '#DC2626'
                : serverStatus === 'checking' ? '#6C47FF'
                : '#6B7280',
              fontWeight: 600,
            }}
          >
            {serverStatus === 'online' && <><Wifi size={14} /> เซิร์ฟเวอร์พร้อมใช้งาน</>}
            {serverStatus === 'offline' && <><WifiOff size={14} /> เซิร์ฟเวอร์ไม่ตอบสนอง — กดเพื่อลองใหม่</>}
            {serverStatus === 'checking' && (
              <>
                <RefreshCw size={14} className="animate-spin" />
                กำลังตรวจสอบเซิร์ฟเวอร์... (อาจใช้เวลา 30-60 วินาที)
              </>
            )}
            {serverStatus === 'unknown' && <><Wifi size={14} /> ตรวจสอบเซิร์ฟเวอร์...</>}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setEmail('test@example.com');
                setPassword('1234');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: mode === 'login' ? '#fff' : 'transparent',
                color: mode === 'login' ? '#6C47FF' : '#6B7280',
                fontWeight: mode === 'login' ? 600 : 500,
                boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <LogIn size={16} />
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setEmail('');
                setPassword('');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: mode === 'register' ? '#fff' : 'transparent',
                color: mode === 'register' ? '#6C47FF' : '#6B7280',
                fontWeight: mode === 'register' ? 600 : 500,
                boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <UserPlus size={16} />
              สมัครสมาชิก
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่าน"
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || serverStatus === 'checking'}
                className="w-full py-3.5 rounded-xl text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)', fontWeight: 700 }}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? `กำลังเข้าสู่ระบบ... (${elapsed}s)` : 'เข้าสู่ระบบ'}
              </button>
              {loading && (
                <p className="text-[11px] text-gray-400 text-center animate-pulse">
                  {elapsed < 10
                    ? 'กำลังเชื่อมต่อเซิร์ฟเวอร์...'
                    : elapsed < 30
                    ? 'เซิร์ฟเวอร์กำลัง cold start... กรุณารอสักครู่'
                    : 'ยังรออยู่... Render free tier อาจใช้เวลานานถึง 60 วินาที'}
                </p>
              )}
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ชื่อ</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ชื่อ"
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">นามสกุล</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="นามสกุล"
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || serverStatus === 'checking'}
                className="w-full py-3.5 rounded-xl text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6C47FF, #8B5CF6)', fontWeight: 700 }}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {loading ? `กำลังสมัคร... (${elapsed}s)` : 'สมัครสมาชิก'}
              </button>
              {loading && (
                <p className="text-[11px] text-gray-400 text-center animate-pulse">
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

        <p className="text-center text-xs text-gray-400 mt-6">
          WeMake Manufacturing Platform v1.0
        </p>
      </div>
    </div>
  );
}
