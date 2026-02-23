import React, { useState } from 'react';
import { Calendar, DollarSign, TrendingUp, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { mockRFQs } from '../../data/mockData';
import { PriceComparisonScreen } from './PriceComparisonScreen';
import { RFQDetailScreen } from './RFQDetailScreen';

export function ReqHisScreen() {
  const [selectedView, setSelectedView] = useState<'list' | 'comparison' | 'detail'>('list');
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [rfqTab, setRfqTab] = useState<'received' | 'pending'>('received');

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
      {/* Header ธีมเดียวกับ OrderScreen */}
      <div className="relative border-b border-white/10 sticky top-0 z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 px-6 py-5">
          <span className="text-white/70 text-xs font-bold uppercase tracking-[0.15em] block mb-0.5">
            RFQ History
          </span>
          <h1 className="text-xl font-bold text-white">ประวัติการขอใบเสนอราคา</h1>
        </div>
      </div>

      <Tabs value={rfqTab} onValueChange={(v) => setRfqTab(v as 'received' | 'pending')} className="px-4 pt-4 pb-6">
        <TabsList className="grid h-12 w-full grid-cols-2 mb-2 rounded-xl bg-white border border-slate-200 p-1.5">
          <TabsTrigger
            value="pending"
            className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-[#4F4F9F] data-[state=active]:border data-[state=active]:border-purple-200 data-[state=active]:font-medium"
          >
            รอเสนอราคา
          </TabsTrigger>
          <TabsTrigger
            value="received"
            className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-[#4F4F9F] data-[state=active]:border data-[state=active]:border-purple-200 data-[state=active]:font-medium"
          >
            ได้รับข้อเสนอแล้ว
          </TabsTrigger>
        </TabsList>

        <div className="overflow-hidden">
          {rfqTab === 'received' && (
            <motion.div
              key="received"
              initial={{ x: -24, opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className="space-y-4"
            >
              {mockRFQs.filter(rfq => rfq.status === 'received').map((rfq) => (
                <Card key={rfq.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    {/* Header ธีมม่วงอ่อน */}
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50/80 to-slate-50 p-4 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-800">{rfq.title}</span>
                        {rfq.bidCount > 0 && (
                          <Badge className="font-medium whitespace-nowrap shrink-0 bg-purple-100 text-[#4F4F9F] border border-purple-200">
                            {rfq.bidCount} โรงงาน
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{rfq.datePosted}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{rfq.budget.toLocaleString()} บาท</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="bg-purple-50/80 border border-purple-200/60 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-2 text-[#4F4F9F]">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            มี {rfq.bidCount} โรงงานเสนอราคามาแล้ว
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:opacity-95 text-white shadow-sm"
                        onClick={() => {
                          setSelectedRFQ(rfq);
                          setSelectedView('comparison');
                        }}
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        เปรียบเทียบราคา
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
          {rfqTab === 'pending' && (
            <motion.div
              key="pending"
              initial={{ x: 24, opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className="space-y-4"
            >
              {mockRFQs.filter(rfq => rfq.status === 'pending').map((rfq) => (
                <Card key={rfq.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50/80 to-slate-50 p-4 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-800">{rfq.title}</span>
                        <Badge className="font-medium whitespace-nowrap shrink-0 bg-slate-100 text-slate-700 border border-slate-200">
                          รอข้อเสนอ
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{rfq.datePosted}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{rfq.budget.toLocaleString()} บาท</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-slate-600">
                          จำนวน: {rfq.quantity} ชิ้น
                        </p>
                      </div>

                      <div className="flex gap-3 justify-end pl-6">
                        {/* ปุ่มรายละเอียด */}
                        <Button
                          variant="outline"
                          // เปลี่ยนจาก min-w-0 max-w-[120px] เป็นการใช้ px-5 และ min-w-[130px] แทน
                          className="shrink-0 rounded-xl border-[#4F4F9F]/40 bg-purple-50/50 text-[#4F4F9F] hover:bg-purple-100 hover:border-[#4F4F9F]/60 px-5 min-w-[130px]"
                          onClick={() => {
                            setSelectedRFQ(rfq);
                            setSelectedView('detail');
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1.5 shrink-0" />
                          <span className="truncate">รายละเอียด</span>
                        </Button>
                        
                        {/* ปุ่มยกเลิก */}
                        <Button
                          variant="outline"
                          // เพิ่มความกว้างด้วย px-6 (เดิม px-4) และกำหนด min-w-[100px] ให้ดูบาลานซ์กับปุ่มแรก
                          className="shrink-0 rounded-xl border-red-400 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-500 hover:text-red-800 px-6 min-w-[100px]"
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </Tabs>
    </div>
  );
}