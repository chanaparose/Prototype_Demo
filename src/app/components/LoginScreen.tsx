import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Factory, User, Star } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (userType: 'customer' | 'factory') => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedType, setSelectedType] = useState<'customer' | 'factory' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (selectedType) {
      onLogin(selectedType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated stars - ref style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Star className="w-2 h-2" fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-gradient-to-br from-[#3A3B6F] to-[#4A4B8F] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-4 right-4 text-white/20">
            <Star className="w-6 h-6" fill="currentColor" />
          </div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">ยินดีต้อนรับ</h1>
            <p className="text-white/80 text-sm">เลือกประเภทผู้ใช้งานของคุณ</p>
          </div>

          {!selectedType ? (
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType('customer')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
              >
                <User className="w-12 h-12 text-white mb-2" />
                <span className="font-medium text-white">ลูกค้า</span>
                <span className="text-xs text-white/70">หาโรงงานผลิต</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType('factory')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
              >
                <Factory className="w-12 h-12 text-white mb-2" />
                <span className="font-medium text-white">โรงงาน</span>
                <span className="text-xs text-white/70">รับงานผลิต</span>
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  เข้าสู่ระบบ {selectedType === 'customer' ? 'ลูกค้า' : 'โรงงาน'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className="text-white/90 hover:text-white hover:bg-white/10"
                >
                  เปลี่ยน
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">อีเมล</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/15 border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">รหัสผ่าน</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/15 border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={handleLogin}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500 text-white rounded-full font-medium shadow-lg shadow-purple-500/30"
                >
                  เข้าสู่ระบบ
                </button>
              </motion.div>
              <div className="text-center text-sm text-white/70">
                ยังไม่มีบัญชี? <a href="#" className="text-white underline">สมัครสมาชิก</a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
