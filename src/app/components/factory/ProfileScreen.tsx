import { ChevronRight, Edit, Image, Bell, Star, LogOut, Award, Shield } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface ProfileScreenProps {
  onSwitchMode: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ onSwitchMode, onLogout }: ProfileScreenProps) {
  const certifications = [
    { name: 'อย.', verified: true },
    { name: 'GMP', verified: true },
    { name: 'HACCP', verified: true },
    { name: 'ISO 9001', verified: false }
  ];

  const menuItems = [
    {
      icon: Edit,
      title: 'แก้ไขข้อมูลโรงงาน / MOQ',
      subtitle: 'ข้อมูลติดต่อและเงื่อนไข',
      onClick: () => {}
    },
    {
      icon: Image,
      title: 'จัดการรูปผลงาน',
      subtitle: 'พอร์ตโฟลิโอและรูปตัวอย่าง',
      onClick: () => {}
    },
    {
      icon: Bell,
      title: 'ตั้งค่าการแจ้งเตือน',
      subtitle: 'งานใหม่และข้อความ',
      onClick: () => {}
    },
    {
      icon: Star,
      title: 'อ่านรีวิวจากลูกค้า',
      subtitle: '48 รีวิว (4.8 ดาว)',
      onClick: () => {}
    }
  ];

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 pb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-3xl">
            🏭
          </div>
          <div className="flex-1 text-white">
            <h1 className="text-xl font-semibold mb-1">โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม</h1>
            <p className="text-sm text-green-100 mb-2">factory@email.com</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-400 text-green-900">
                <Shield className="w-3 h-3 mr-1" />
                Verified Factory
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="px-6 -mt-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              ใบรับรอง
            </h3>
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert) => (
                <Badge
                  key={cert.name}
                  variant={cert.verified ? 'default' : 'secondary'}
                  className={cert.verified ? 'bg-green-500' : ''}
                >
                  {cert.verified && '✓ '}
                  {cert.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-6 space-y-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={item.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Switch Mode */}
        <Card className="border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onSwitchMode}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-600">สลับไปใช้โหมดลูกค้า</h3>
                <p className="text-sm text-gray-500">เปลี่ยนเป็นโหมดลูกค้า</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-red-200 hover:shadow-md transition-shadow cursor-pointer" onClick={onLogout}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-600">ออกจากระบบ</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-medium text-gray-600 mb-3">สถิติโรงงาน</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-green-600">48</p>
              <p className="text-xs text-gray-600 mt-1">โครงการทั้งหมด</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-blue-600">4.8</p>
              <p className="text-xs text-gray-600 mt-1">คะแนนเฉลี่ย</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-orange-600">95%</p>
              <p className="text-xs text-gray-600 mt-1">อัตราตอบกลับ</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
