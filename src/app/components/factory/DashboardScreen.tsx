import { TrendingUp, Clock, Star, DollarSign, Package } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockNewRFQs } from '../../data/mockData';
import { RFQViewScreen } from './RFQViewScreen';
import { CreateBOQScreen } from './CreateBOQScreen';

export function DashboardScreen() {
  const [selectedView, setSelectedView] = useState<'list' | 'rfq' | 'quote'>('list');
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);

  const monthlyRevenue = 125000;
  const responseRate = 95;
  const averageRating = 4.8;

  if (selectedView === 'rfq' && selectedRFQ) {
    return (
      <RFQViewScreen
        onBack={() => setSelectedView('list')}
        onQuote={() => setSelectedView('quote')}
        rfqId={selectedRFQ.id}
      />
    );
  }

  if (selectedView === 'quote' && selectedRFQ) {
    return (
      <CreateBOQScreen
        onBack={() => setSelectedView('list')}
        customerName="คุณ Rose"
      />
    );
  }

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 pb-8">
        <h1 className="text-white text-xl font-semibold mb-1">โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม</h1>
        <p className="text-green-100 text-sm mb-4">ยอดขายเดือนนี้</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            ฿{monthlyRevenue.toLocaleString()}
          </span>
          <Badge className="bg-green-400 text-green-900">
            <TrendingUp className="w-3 h-3 mr-1" />
            +15%
          </Badge>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="px-6 -mt-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">ประสิทธิภาพร้าน</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{responseRate}%</p>
                  <p className="text-xs text-gray-600">อัตราการตอบกลับ</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{averageRating}</p>
                  <p className="text-xs text-gray-600">คะแนนรีวิว</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New RFQs */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">งานมาใหม่</h2>
          <Badge variant="secondary">{mockNewRFQs.length} งาน</Badge>
        </div>

        <div className="space-y-3">
          {mockNewRFQs.map((rfq) => (
            <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{rfq.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rfq.quantity} ชิ้น
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {rfq.budget.toLocaleString()} บาท
                      </Badge>
                      <Badge className="bg-red-500 text-xs">
                        ด่วน
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">งบประมาณ:</span> {rfq.budget.toLocaleString()} บาท
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    โพสต์เมื่อ: {rfq.datePosted}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600" onClick={() => { setSelectedView('rfq'); setSelectedRFQ(rfq); }}>
                    เสนอราคา
                  </Button>
                  <Button variant="outline" className="flex-1">
                    ข้าม
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-medium text-gray-600 mb-3">สรุปรวดเร็ว</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-blue-600">5</p>
              <p className="text-xs text-gray-600 mt-1">งานใหม่</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-green-600">12</p>
              <p className="text-xs text-gray-600 mt-1">กำลังผลิต</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold text-orange-600">8</p>
              <p className="text-xs text-gray-600 mt-1">รอตอบกลับ</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}