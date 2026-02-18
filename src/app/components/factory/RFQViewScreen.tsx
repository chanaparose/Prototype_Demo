import { ArrowLeft, MessageCircle, FileText, MapPin, Package, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface RFQViewScreenProps {
  onBack: () => void;
  onQuote: () => void;
  rfqId: string;
}

export function RFQViewScreen({ onBack, onQuote, rfqId }: RFQViewScreenProps) {
  const rfqDetail = {
    id: 'RFQ-2026-004',
    title: 'ขนมสุนัข Freeze Dried',
    productName: 'ขนมสุนัข Freeze Dried สูตรตับไก่',
    budget: 20000,
    quantity: 200,
    pricePerUnit: 100,
    location: 'กรุงเทพมหานคร',
    urgent: true,
    description: 'ต้องการสูตรไม่เค็ม เน้นเนื้อไก่แท้ ไม่มีสารกันเสีย บรรจุถุงซิปล็อค ขนาด 50g/ถุง',
    requirements: [
      'ต้องมีใบรับรอง อย.',
      'โรงงานมีมาตรฐาน GMP',
      'ส่งตัวอย่างก่อนผลิตจริง',
      'รับประกันคุณภาพ',
      'ส่งของภายใน 20 วัน'
    ],
    attachments: [
      'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=400',
      'https://images.unsplash.com/photo-1645623383208-84926ba8aa21?w=400'
    ],
    customerInfo: {
      name: 'คุณ Rose',
      rating: 4.5,
      completedOrders: 12
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-white font-semibold">งานใหม่</h1>
              {rfqDetail.urgent && (
                <Badge className="bg-red-500">ด่วน!</Badge>
              )}
            </div>
            <p className="text-green-100 text-sm">{rfqDetail.id}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Budget Highlight */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm mb-1">งบประมาณ</p>
            <p className="text-4xl font-bold mb-2">
              ฿{rfqDetail.budget.toLocaleString()}
            </p>
            <p className="text-green-100 text-sm">
              (฿{rfqDetail.pricePerUnit}/ชิ้น × {rfqDetail.quantity} ชิ้น)
            </p>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">ข้อมูลลูกค้า</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                R
              </div>
              <div className="flex-1">
                <p className="font-medium">{rfqDetail.customerInfo.name}</p>
                <p className="text-sm text-gray-600">
                  ⭐ {rfqDetail.customerInfo.rating} • 
                  {rfqDetail.customerInfo.completedOrders} โครงการสำเร็จ
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                ลูกค้าดี
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Spec Card */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">{rfqDetail.productName}</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <Package className="w-5 h-5 text-blue-600 mb-1" />
                <p className="text-xs text-gray-600">จำนวน</p>
                <p className="font-semibold text-blue-600">{rfqDetail.quantity} ชิ้น</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <DollarSign className="w-5 h-5 text-green-600 mb-1" />
                <p className="text-xs text-gray-600">ราคา/ชิ้น</p>
                <p className="font-semibold text-green-600">฿{rfqDetail.pricePerUnit}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>สถานที่จัดส่ง: {rfqDetail.location}</span>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">รูป Reference</h3>
            <div className="grid grid-cols-2 gap-3">
              {rfqDetail.attachments.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">คลิกเพื่อดูขนาดเต็ม</p>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              รายละเอียด
            </h3>
            <p className="text-sm text-gray-700 mb-4">{rfqDetail.description}</p>
            
            <h4 className="font-semibold mb-2 text-sm">ข้อกำหนดจากลูกค้า</h4>
            <ul className="space-y-2">
              {rfqDetail.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Profit Estimate */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-yellow-800">💡 คำนวณกำไรคร่าวๆ</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">งบประมาณลูกค้า</span>
                <span className="font-medium">฿20,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">ต้นทุนโดยประมาณ</span>
                <span className="font-medium text-red-600">-฿14,000</span>
              </div>
              <div className="border-t border-yellow-300 pt-1 mt-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">กำไรคาดการณ์</span>
                  <span className="font-bold text-green-600">฿6,000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-2 max-w-screen-xl mx-auto">
          <Button variant="outline" className="flex-1">
            <MessageCircle className="w-5 h-5 mr-2" />
            แชทสอบถาม
          </Button>
          <Button onClick={onQuote} className="flex-1 bg-green-600 hover:bg-green-700">
            <FileText className="w-5 h-5 mr-2" />
            เสนอราคา
          </Button>
        </div>
      </div>
    </div>
  );
}
