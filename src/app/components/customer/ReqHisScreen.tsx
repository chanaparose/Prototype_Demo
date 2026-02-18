import { Calendar, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { mockRFQs } from '../../data/mockData';
import { PriceComparisonScreen } from './PriceComparisonScreen';
import { RFQDetailScreen } from './RFQDetailScreen';

export function ReqHisScreen() {
  const [selectedView, setSelectedView] = useState<'list' | 'comparison' | 'detail'>('list');
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);

  if (selectedView === 'comparison' && selectedRFQ) {
    return (
      <PriceComparisonScreen
        onBack={() => setSelectedView('list')}
        rfqId={selectedRFQ.id}
      />
    );
  }

  if (selectedView === 'detail' && selectedRFQ) {
    return (
      <RFQDetailScreen
        onBack={() => setSelectedView('list')}
        rfqId={selectedRFQ.id}
      />
    );
  }

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold">ประวัติการขอใบเสนอราคา</h1>
        </div>
      </div>

      <Tabs defaultValue="received" className="p-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pending">รอเสนอราคา</TabsTrigger>
          <TabsTrigger value="received">ได้รับข้อเสนอแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {mockRFQs.filter(rfq => rfq.status === 'received').map((rfq) => (
            <Card key={rfq.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{rfq.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{rfq.datePosted}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{rfq.budget.toLocaleString()} บาท</span>
                      </div>
                    </div>
                  </div>
                  {rfq.bidCount > 0 && (
                    <Badge className="bg-orange-500">
                      {rfq.bidCount} โรงงาน
                    </Badge>
                  )}
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-orange-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      มี {rfq.bidCount} โรงงานเสนอราคามาแล้ว
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600"
                  onClick={() => {
                    setSelectedRFQ(rfq);
                    setSelectedView('comparison');
                  }}
                >
                  เปรียบเทียบราคา
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {mockRFQs.filter(rfq => rfq.status === 'pending').map((rfq) => (
            <Card key={rfq.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{rfq.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{rfq.datePosted}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{rfq.budget.toLocaleString()} บาท</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    รอข้อเสนอ
                  </Badge>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-600">
                    จำนวน: {rfq.quantity} ชิ้น
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedRFQ(rfq);
                      setSelectedView('detail');
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    รายละเอียด
                  </Button>
                  <Button variant="outline" className="flex-1">
                    แก้ไข
                  </Button>
                  <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                    ยกเลิก
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}