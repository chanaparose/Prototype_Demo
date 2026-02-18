import { ArrowLeft, MessageCircle, CheckCircle, Circle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ProductionUpdateScreenProps {
  onBack: () => void;
  orderId: string;
}

export function ProductionUpdateScreen({ onBack, orderId }: ProductionUpdateScreenProps) {
  const timeline = [
    {
      id: '1',
      title: 'มัดจำแล้ว',
      status: 'completed',
      date: '16 Feb 2026',
      description: 'ได้รับเงินมัดจำ 50% เรียบร้อยแล้ว',
      images: []
    },
    {
      id: '2',
      title: 'กำลังผลิต',
      status: 'current',
      date: '17-25 Feb 2026',
      description: 'ขึ้นรูปเสร็จแล้ว กำลังเข้าอบ',
      images: [
        'https://images.unsplash.com/photo-1579784340946-55a7bbd51d57?w=400',
        'https://images.unsplash.com/photo-1645623383208-84926ba8aa21?w=400',
        'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=400'
      ],
      updateTime: '20 Feb 2026, 14:30'
    },
    {
      id: '3',
      title: 'QC & Packing',
      status: 'pending',
      date: 'รอการดำเนินการ',
      description: 'ตรวจสอบคุณภาพและบรรจุภัณฑ์',
      images: []
    },
    {
      id: '4',
      title: 'จัดส่ง',
      status: 'pending',
      date: 'รอการดำเนินการ',
      description: 'จัดส่งสินค้าถึงมือคุณ',
      images: []
    }
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-500 fill-green-500" />;
    } else if (status === 'current') {
      return (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
        </div>
      );
    } else {
      return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'border-green-500';
    if (status === 'current') return 'border-blue-500';
    return 'border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-white font-semibold">ความคืบหน้าการผลิต</h1>
            <p className="text-blue-100 text-sm">รหัส: {orderId}</p>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src="https://images.unsplash.com/photo-1645623383208-84926ba8aa21?w=200"
                alt="Product"
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h2 className="font-semibold mb-1">ขนมแมวเลีย รสปลาทูน่า</h2>
                <p className="text-sm text-gray-600">500 ชิ้น</p>
                <Badge className="mt-2 bg-blue-600">กำลังผลิต</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="px-4">
        <h3 className="font-semibold mb-4">ขั้นตอนการผลิต</h3>
        
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          <div className="space-y-6">
            {timeline.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Icon */}
                <div className="absolute left-0 top-0 z-10 bg-gray-50">
                  {getStatusIcon(step.status)}
                </div>
                
                {/* Content */}
                <div className="ml-12">
                  <Card className={`border-l-4 ${getStatusColor(step.status)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{step.title}</h4>
                        <Badge
                          variant={
                            step.status === 'completed'
                              ? 'default'
                              : step.status === 'current'
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            step.status === 'completed'
                              ? 'bg-green-500'
                              : step.status === 'current'
                              ? 'bg-blue-500'
                              : ''
                          }
                        >
                          {step.status === 'completed' && '✓ เสร็จสิ้น'}
                          {step.status === 'current' && 'กำลังดำเนินการ'}
                          {step.status === 'pending' && 'รอดำเนินการ'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      <p className="text-xs text-gray-500">{step.date}</p>
                      
                      {/* Images Grid */}
                      {step.images.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">
                            อัปเดตล่าสุด: {step.updateTime}
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {step.images.map((img, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={img}
                                alt={`Update ${imgIndex + 1}`}
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            คลิกรูปเพื่อดูขนาดใหญ่
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <Button className="w-full bg-blue-600">
          <MessageCircle className="w-5 h-5 mr-2" />
          แชทกับโรงงาน
        </Button>
      </div>
    </div>
  );
}
