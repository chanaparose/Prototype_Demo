import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { mockOrders } from '../../data/mockData';
import { ChatBOQScreen } from './ChatBOQScreen';
import { ProductionUpdateScreen } from './ProductionUpdateScreen';

const ORDER_STATUS_LABELS: Record<string, string> = {
  deposit: 'มัดจำ',
  production: 'กำลังผลิต',
  qc: 'ตรวจ QC',
  shipping: 'จัดส่ง',
  completed: 'เสร็จสิ้น',
  pending_completed: 'รอยืนยันรับ/คืน',
};

const STEP_LABELS = ['มัดจำ', 'ผลิต', 'ตรวจ QC', 'จัดส่ง'];

function StepProgressBar({ currentStep }: { currentStep: number }) {
  const progressPercent = (currentStep / 4) * 100;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => {
          const isDone = currentStep >= step;
          const isCurrent = currentStep === step;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                {/* สไตล์เดียวกับ ProductionUpdateScreen: เสร็จ = emerald, กำลังทำ = ม่วง, รอ = dashed */}
                <div
                  className={`
                    flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all
                    ${isDone ? 'bg-emerald-500/15 ring-2 ring-emerald-500/30 text-emerald-600' : 'border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400'}
                    ${isCurrent && !isDone ? '!border-solid border-[#4F4F9F] bg-[#4F4F9F]/10 ring-2 ring-[#4F4F9F]/25 text-[#4F4F9F]' : ''}
                  `}
                >
                  {step}
                </div>
                <span
                  className={`mt-1.5 whitespace-nowrap text-[10px] font-medium ${isDone ? 'text-emerald-600' : isCurrent ? 'text-[#4F4F9F]' : 'text-slate-400'}`}
                >
                  {STEP_LABELS[step - 1]}
                </span>
              </div>
              {step < 4 && (
                <div
                  className={`mx-2 h-0.5 min-w-[20px] flex-1 rounded-full transition-colors ${
                    currentStep > step ? 'bg-gradient-to-r from-emerald-400 to-emerald-300' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrderScreen() {
  const [selectedView, setSelectedView] = useState<'list' | 'chat' | 'update'>('list');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderTab, setOrderTab] = useState<'active' | 'completed'>('active');

  const getStatusText = (status: string) => ORDER_STATUS_LABELS[status] || status;

  const getStatusBadgeClass = (status: string) => {
    const base = 'font-medium whitespace-nowrap shrink-0';
    switch (status) {
      case 'deposit':
        return `${base} bg-slate-100 text-slate-700 border border-slate-200`;
      case 'production':
        return `${base} bg-purple-100 text-[#4F4F9F] border border-purple-200`;
      case 'qc':
        return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
      case 'shipping':
        return `${base} bg-indigo-100 text-indigo-800 border border-indigo-200`;
      case 'completed':
        return `${base} bg-emerald-100 text-emerald-800 border border-emerald-200`;
      case 'pending_completed':
        return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
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
        order={selectedOrder}
      />
    );
  }

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header เลื่อนไปกับหน้าจอได้เหมือน HomeScreen */}
      <div className="relative pt-0 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-[#4F4F9F]/50 rounded-full blur-2xl" />
        <div className="relative z-10 pt-6 pb-2">
          <span className="text-white/70 text-xs font-bold uppercase tracking-[0.15em] block mb-0.5">
            Orders
          </span>
          <h1 className="text-xl font-bold text-white">ติดตามสถานะการผลิต</h1>
        </div>
      </div>

      <Tabs value={orderTab} onValueChange={(v) => setOrderTab(v as 'active' | 'completed')} className="px-4 -mt-2 pt-4 pb-6">
        <TabsList className="grid h-12 w-full grid-cols-2 mb-2 rounded-xl bg-white border border-slate-200 p-1.5">
          <TabsTrigger
            value="active"
            className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-[#4F4F9F] data-[state=active]:border data-[state=active]:border-purple-200 data-[state=active]:font-medium"
          >
            กำลังผลิต
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-[#4F4F9F] data-[state=active]:border data-[state=active]:border-purple-200 data-[state=active]:font-medium"
          >
            สำเร็จแล้ว
          </TabsTrigger>
        </TabsList>

        <div className="overflow-hidden">
          {orderTab === 'active' && (
            <motion.div
              key="active"
              initial={{ x: -24, opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className="space-y-4"
            >
          {mockOrders.filter((order) => order.status !== 'completed' && order.status !== 'pending_completed').map((order) => (
            <Card key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <CardContent className="p-0">
                {/* Header ธีมม่วงอ่อน */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50/80 to-slate-50 p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-800">รหัสคำสั่งซื้อ: {order.orderId}</span>
                    <Badge className={getStatusBadgeClass(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{order.factoryName}</p>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 mb-1">{order.productName}</h3>
                      <p className="text-sm text-slate-500">กำหนดส่ง: {order.dueDate}</p>
                    </div>
                  </div>

                  {/* Step Progress Bar - อยู่กลางการ์ด ขยับไปทางขวาเล็กน้อย */}
                  <div className="flex justify-center">
                    <div className="ml-6 w-full max-w-[340px]">
                      <StepProgressBar currentStep={order.currentStep} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setSelectedOrder(order);
                        setSelectedView('update');
                      }}
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      ดูความคืบหน้า
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:opacity-95 text-white shadow-sm"
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
              </motion.div>
            )}
          {orderTab === 'completed' && (
            <motion.div
              key="completed"
              initial={{ x: 24, opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className="space-y-4"
            >
          {(() => {
            const completedOrders = mockOrders.filter((order) => order.status === 'completed' || order.status === 'pending_completed');
            return completedOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>ยังไม่มีงานที่เสร็จสิ้น</p>
              </div>
            ) : (
              completedOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <div
                    className={`p-4 border-b border-slate-100 ${
                      order.status === 'pending_completed'
                        ? 'bg-gradient-to-r from-purple-50 via-indigo-50/80 to-slate-50'
                        : 'bg-gradient-to-r from-emerald-50 via-teal-50/80 to-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-800">รหัสคำสั่งซื้อ: {order.orderId}</span>
                      <Badge className={getStatusBadgeClass(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{order.factoryName}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-4 mb-4">
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 mb-1">{order.productName}</h3>
                        <p className="text-sm text-slate-500">กำหนดส่ง: {order.dueDate}</p>
                      </div>
                    </div>
                    {/* Step Progress Bar - ตำแหน่งเดียวกับ tab กำลังผลิต */}
                    <div className="flex justify-center">
                      <div className="ml-6 w-full max-w-[340px]">
                        <StepProgressBar currentStep={order.currentStep} />
                      </div>
                    </div>

                    {/* Actions - ตำแหน่งเดียวกับ tab กำลังผลิต */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setSelectedOrder(order);
                          setSelectedView('update');
                        }}
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        ดูความคืบหน้า
                      </Button>
                      <Button
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:opacity-95 text-white shadow-sm"
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
            ))
            );
          })()}
            </motion.div>
          )}
        </div>
      </Tabs>
    </div>
  );
}