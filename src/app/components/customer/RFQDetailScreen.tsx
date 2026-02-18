import { ArrowLeft, Eye, FileText, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface RFQDetailScreenProps {
  onBack: () => void;
  rfqId: string;
}

export function RFQDetailScreen({ onBack, rfqId }: RFQDetailScreenProps) {
  const rfqDetail = {
    id: 'RFQ-2026-003',
    productName: 'ขนมสุนัข Freeze Dried สูตรตับไก่',
    imageUrl: 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=800',
    quantity: 200,
    budgetPerUnit: 100,
    totalBudget: 20000,
    targetFactory: 'โรงงานมาตรฐาน GMP, เขตปทุมธานี',
    description: 'ต้องการขนมสุนัขฟรีซดราย สูตรตับไก่แท้ ไม่เค็ม ไม่มีสารกันเสีย บรรจุถุงซิปล็อค ขนาด 50g/ถุง',
    requirements: [
      'ต้องมีใบรับรอง อย.',
      'โรงงานมีมาตรฐาน GMP',
      'ส่งตัวอย่างก่อนผลิตจริง',
      'รับประกันคุณภาพ'
    ],
    location: 'กรุงเทพมหานคร',
    postedDate: '2026-02-15',
    status: 'pending',
    seenCount: 15,
    quotedCount: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-semibold">รายละเอียดคำขอ</h1>
            <p className="text-blue-100 text-sm">{rfqDetail.id}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <Badge className="bg-orange-500">
          กำลังรอใบเสนอราคา
        </Badge>
      </div>

      {/* Main Image */}
      <div className="px-4 pt-4">
        <img
          src={rfqDetail.imageUrl}
          alt={rfqDetail.productName}
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>

      {/* Product Spec Card */}
      <div className="px-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-3">{rfqDetail.productName}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">จำนวน</p>
                <p className="text-lg font-semibold text-blue-600">
                  {rfqDetail.quantity} ชิ้น
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">งบต่อชิ้น</p>
                <p className="text-lg font-semibold text-green-600">
                  ฿{rfqDetail.budgetPerUnit}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 mb-1">งบประมาณรวม</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{rfqDetail.totalBudget.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">โรงงานที่ต้องการ</p>
                  <p className="text-sm text-gray-600">{rfqDetail.targetFactory}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">สถานที่จัดส่ง</p>
                  <p className="text-sm text-gray-600">{rfqDetail.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <div className="px-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">รายละเอียดสินค้า</h3>
            <p className="text-sm text-gray-700 mb-4">{rfqDetail.description}</p>
            
            <h4 className="font-semibold mb-2 text-sm">ข้อกำหนด</h4>
            <ul className="space-y-2">
              {rfqDetail.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600">✓</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Status Section */}
      <div className="px-4 mt-4">
        <Card className="border-2 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              สถานะการตอบรับ
            </h3>
            
            <div className="space-y-4">
              {/* Seen Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">โรงงานที่เห็นโพสต์</span>
                  </div>
                  <span className="font-semibold text-blue-600">{rfqDetail.seenCount} โรงงาน</span>
                </div>
                <Progress value={(rfqDetail.seenCount / 20) * 100} className="h-2" />
              </div>

              {/* Quoted Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">โรงงานที่เสนอราคา</span>
                  </div>
                  <span className="font-semibold text-orange-600">{rfqDetail.quotedCount} โรงงาน</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>

            {rfqDetail.quotedCount === 0 && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700">
                  💡 ยังไม่มีโรงงานเสนอราคา โปรดรอสักครู่
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Posted Date */}
      <div className="px-4 mt-4 mb-4">
        <p className="text-sm text-gray-500 text-center">
          โพสต์เมื่อ: {rfqDetail.postedDate}
        </p>
      </div>
    </div>
  );
}
