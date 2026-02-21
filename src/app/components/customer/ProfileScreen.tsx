import { ChevronRight, Bookmark, MapPin, Users, HelpCircle, LogOut, ShieldCheck, Heart } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ProfileScreenProps {
  onSwitchMode: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ onSwitchMode, onLogout }: ProfileScreenProps) {
  const menuItems = [
    {
      icon: Heart,
      title: 'รายการโปรด',
      subtitle: 'โรงงานและรายการที่คุณชอบ',
      onClick: () => {}
    },
    {
      icon: Bookmark,
      title: 'โรงงานที่บันทึกไว้',
      subtitle: '5 โรงงาน',
      onClick: () => {}
    },
    {
      icon: MapPin,
      title: 'ที่อยู่สำหรับจัดส่ง',
      subtitle: '2 ที่อยู่',
      onClick: () => {}
    },
    {
      icon: Users,
      title: 'สลับไปใช้โหมดผู้ขาย/โรงงาน',
      subtitle: 'เปลี่ยนเป็นโหมดโรงงาน',
      onClick: onSwitchMode
    },
    {
      icon: HelpCircle,
      title: 'ศูนย์ช่วยเหลือ',
      subtitle: 'คำถามที่พบบ่อย',
      onClick: () => {}
    }
  ];

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div className="flex-1 text-white">
            <h1 className="text-xl font-semibold mb-1">คุณสมชาย</h1>
            <p className="text-sm text-blue-100 mb-2">somchai@email.com</p>
            <Badge className="bg-green-500">
              <ShieldCheck className="w-3 h-3 mr-1" />
              ยืนยันตัวตนแล้ว
            </Badge>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 -mt-4 space-y-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isFavorites = item.icon === Heart;
          return (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={item.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFavorites ? 'bg-rose-50' : 'bg-blue-50'}`}>
                    <Icon className={`w-5 h-5 ${isFavorites ? 'text-rose-600' : 'text-blue-600'}`} />
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

        {/* Logout Button */}
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
        <h2 className="text-sm font-medium text-gray-600 mb-3">สถิติของฉัน</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-blue-600">12</p>
              <p className="text-xs text-gray-600 mt-1">โครงการทั้งหมด</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-green-600">8</p>
              <p className="text-xs text-gray-600 mt-1">สำเร็จแล้ว</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-orange-600">4</p>
              <p className="text-xs text-gray-600 mt-1">กำลังดำเนินการ</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
