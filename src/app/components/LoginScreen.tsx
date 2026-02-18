import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Factory, User } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">ยินดีต้อนรับ</CardTitle>
          <CardDescription>เลือกประเภทผู้ใช้งานของคุณ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedType ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedType('customer')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <User className="w-12 h-12 text-blue-600 mb-2" />
                <span className="font-medium">ลูกค้า</span>
                <span className="text-sm text-gray-500">หาโรงงานผลิต</span>
              </button>
              <button
                onClick={() => setSelectedType('factory')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <Factory className="w-12 h-12 text-green-600 mb-2" />
                <span className="font-medium">โรงงาน</span>
                <span className="text-sm text-gray-500">รับงานผลิต</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  เข้าสู่ระบบ {selectedType === 'customer' ? 'ลูกค้า' : 'โรงงาน'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  เปลี่ยน
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">อีเมล</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">รหัสผ่าน</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleLogin}
              >
                เข้าสู่ระบบ
              </Button>
              <div className="text-center text-sm text-gray-500">
                ยังไม่มีบัญชี? <a href="#" className="text-blue-600 hover:underline">สมัครสมาชิก</a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
