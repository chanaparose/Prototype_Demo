import { Calendar, DollarSign, MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { mockQuotes } from '../../data/mockData';

export function QuotesScreen() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            รอตอบรับ
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="w-3 h-3" />
            อนุมัติแล้ว
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            ไม่ผ่าน
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold">ใบเสนอราคา</h1>
        </div>
      </div>

      <Tabs defaultValue="all" className="p-6">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="pending">รอตอบรับ</TabsTrigger>
          <TabsTrigger value="accepted">อนุมัติแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {mockQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{quote.productName}</h3>
                    <p className="text-sm text-gray-600">ลูกค้า: {quote.customerName}</p>
                  </div>
                  {getStatusBadge(quote.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">จำนวน</p>
                    <p className="font-semibold">{quote.quantity} ชิ้น</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">ราคาที่เสนอ</p>
                    <p className="font-semibold text-green-600">
                      ฿{quote.quotedPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>ส่งเมื่อ: {quote.dateSent}</span>
                </div>

                {quote.status === 'pending' && (
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    แชทกับลูกค้า
                  </Button>
                )}

                {quote.status === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ ลูกค้าอนุมัติใบเสนอราคาแล้ว
                    </p>
                  </div>
                )}

                {quote.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      ลูกค้าปฏิเสธใบเสนอราคา
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {mockQuotes
            .filter((q) => q.status === 'pending')
            .map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{quote.productName}</h3>
                      <p className="text-sm text-gray-600">ลูกค้า: {quote.customerName}</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">จำนวน</p>
                      <p className="font-semibold">{quote.quantity} ชิ้น</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">ราคาที่เสนอ</p>
                      <p className="font-semibold text-green-600">
                        ฿{quote.quotedPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    แชทกับลูกค้า
                  </Button>
                </CardContent>
              </Card>
            ))}
          {mockQuotes.filter((q) => q.status === 'pending').length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>ไม่มีใบเสนอราคาที่รอตอบรับ</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {mockQuotes
            .filter((q) => q.status === 'accepted')
            .map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{quote.productName}</h3>
                      <p className="text-sm text-gray-600">ลูกค้า: {quote.customerName}</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">จำนวน</p>
                      <p className="font-semibold">{quote.quantity} ชิ้น</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">ราคาที่เสนอ</p>
                      <p className="font-semibold text-green-600">
                        ฿{quote.quotedPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ ลูกค้าอนุมัติใบเสนอราคาแล้ว
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          {mockQuotes.filter((q) => q.status === 'accepted').length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>ยังไม่มีใบเสนอราคาที่ได้รับการอนุมัติ</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
