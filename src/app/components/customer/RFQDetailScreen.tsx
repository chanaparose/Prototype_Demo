import React from 'react';
import { ArrowLeft, Eye, FileText, MapPin, Package } from 'lucide-react';
import { motion } from 'motion/react';
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
      {/* Header - ธีมเดียวกับ CreateRFQScreen */}
      <div className="relative border-b border-white/10 sticky top-0 z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D2E5F] via-[#3E3F7F] to-[#4F4F9F]" />
        <div className="absolute top-[-10%] right-[-5%] w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-white/90 hover:bg-white/10 transition-colors"
              aria-label="กลับ"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            <Badge className="bg-amber-500/90 text-white border-0">
              กำลังรอใบเสนอราคา
            </Badge>
          </div>
          <div className="mt-2">
            <span className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] block mb-0.5">
              Request for Quote
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              รายละเอียดคำขอ
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {rfqDetail.id}
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        className="px-4 pt-6 space-y-6"
      >
        {/* Main Image */}
        <div>
          <img
            src={rfqDetail.imageUrl}
            alt={rfqDetail.productName}
            className="w-full h-64 object-cover rounded-2xl border border-slate-200 shadow-sm"
          />
        </div>

        {/* Product Spec Card */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-purple-100">
                <Package className="w-4 h-4 text-[#4F4F9F]" />
              </div>
              <h2 className="text-slate-800 font-semibold text-lg">{rfqDetail.productName}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">จำนวน</p>
                <p className="text-lg font-semibold text-[#4F4F9F]">
                  {rfqDetail.quantity} ชิ้น
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">งบต่อชิ้น</p>
                <p className="text-lg font-semibold text-[#4F4F9F]">
                  ฿{rfqDetail.budgetPerUnit}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">งบประมาณรวม</p>
              <p className="text-2xl font-bold text-slate-900">
                ฿{rfqDetail.totalBudget.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 shrink-0">
                  <Package className="w-4 h-4 text-[#4F4F9F]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">โรงงานที่ต้องการ</p>
                  <p className="text-sm text-slate-600">{rfqDetail.targetFactory}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-slate-200 shrink-0">
                  <MapPin className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">สถานที่จัดส่ง</p>
                  <p className="text-sm text-slate-600">{rfqDetail.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-slate-800 font-semibold flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              รายละเอียดสินค้า
            </h3>
            <p className="text-sm text-slate-600 mb-4">{rfqDetail.description}</p>

            <h4 className="font-semibold text-slate-800 mb-2 text-sm">ข้อกำหนด</h4>
            <ul className="space-y-2">
              {rfqDetail.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-600">✓</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Status Section - UI เหมือน order card ตอน orderStatus: 'production' */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {/* Header ธีมม่วงอ่อน เหมือน OrderScreen production */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50/80 to-slate-50 p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-slate-800">สถานะการตอบรับ</span>
                <Badge className="font-medium whitespace-nowrap shrink-0 bg-purple-100 text-[#4F4F9F] border border-purple-200">
                  กำลังรอใบเสนอราคา
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{rfqDetail.id}</p>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">โรงงานที่เห็นโพสต์</span>
                    </div>
                    <span className="font-semibold text-[#4F4F9F]">{rfqDetail.seenCount} โรงงาน</span>
                  </div>
                  <Progress value={(rfqDetail.seenCount / 20) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">โรงงานที่เสนอราคา</span>
                    </div>
                    <span className="font-semibold text-amber-600">{rfqDetail.quotedCount} โรงงาน</span>
                  </div>
                  <Progress value={rfqDetail.quotedCount > 0 ? (rfqDetail.quotedCount / 10) * 100 : 0} className="h-2" />
                </div>
              </div>

              {rfqDetail.quotedCount === 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-sm text-amber-800">
                    💡 ยังไม่มีโรงงานเสนอราคา โปรดรอสักครู่
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posted Date */}
        <div className="pb-4">
          <p className="text-sm text-slate-500 text-center">
            โพสต์เมื่อ: {rfqDetail.postedDate}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
