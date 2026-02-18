import { MessageCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { mockOrders } from '../../data/mockData';
import { ChatBOQScreen } from './ChatBOQScreen';
import { ProductionUpdateScreen } from './ProductionUpdateScreen';

export function OrderScreen() {
  const [selectedView, setSelectedView] = useState<'list' | 'chat' | 'update'>('list');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      deposit: 'มัดจำ',
      production: 'กำลังผลิต',
      qc: 'ตรวจ QC',
      shipping: 'จัดส่ง',
      completed: 'เสร็จสิ้น'
    };
    return statusMap[status] || status;
  };

  const getStepProgress = (currentStep: number) => {
    return (currentStep / 4) * 100;
  };

  if (selectedView === 'chat' && selectedOrder) {
    return (
      <ChatBOQScreen
        onBack={() => setSelectedView('list')}
        orderId={selectedOrder.orderId}
        factoryName={selectedOrder.factoryName}
      />
    );
  }

  if (selectedView === 'update' && selectedOrder) {
    return (
      <ProductionUpdateScreen
        onBack={() => setSelectedView('list')}
        orderId={selectedOrder.orderId}
      />
    );
  }

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold">ติดตามสถานะการผลิต</h1>
        </div>
      </div>

      <Tabs defaultValue="active" className="p-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active">กำลังผลิต</TabsTrigger>
          <TabsTrigger value="completed">สำเร็จแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {mockOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">รหัสคำสั่งซื้อ: {order.orderId}</span>
                    <Badge className="bg-blue-600">
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{order.factoryName}</p>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{order.productName}</h3>
                      <p className="text-sm text-gray-600">กำหนดส่ง: {order.dueDate}</p>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className={order.currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                        มัดจำ
                      </span>
                      <span className={order.currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                        ผลิต
                      </span>
                      <span className={order.currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                        ตรวจ QC
                      </span>
                      <span className={order.currentStep >= 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                        จัดส่ง
                      </span>
                    </div>
                    <Progress value={getStepProgress(order.currentStep)} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrder(order);
                        setSelectedView('update');
                      }}
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      ดูความคืบหน้า
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600"
                      onClick={() => {
                        setSelectedOrder(order);
                        setSelectedView('chat');
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      แชทกับโรงงาน
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="text-center py-12 text-gray-500">
            <p>ยังไม่มีงานที่เสร็จสิ้น</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}